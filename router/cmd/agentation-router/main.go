package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/benjitaylor/agentation/router/internal/config"
	httpserver "github.com/benjitaylor/agentation/router/internal/http"
	routerpkg "github.com/benjitaylor/agentation/router/internal/router"
	"github.com/benjitaylor/agentation/router/internal/store"
)

const shutdownTimeout = 5 * time.Second

func main() {
	arguments := os.Args[1:]
	if len(arguments) == 0 {
		printUsage()
		os.Exit(0)
	}

	subcommand := arguments[0]
	subcommandArgs := arguments[1:]

	switch subcommand {
	case "serve":
		os.Exit(runServe(subcommandArgs))
	case "start":
		os.Exit(runStart(subcommandArgs))
	case "stop":
		os.Exit(runStop())
	case "status":
		os.Exit(runStatus())
	case "help", "--help", "-h":
		printUsage()
		os.Exit(0)
	default:
		os.Exit(runServe(arguments))
	}
}

func runServe(args []string) int {
	cfg := config.Load(args)
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	registry := store.NewRegistry(cfg.SessionStaleAfter)
	forwarder := routerpkg.NewForwarder(cfg.ForwardTimeout)
	server := httpserver.NewServer(cfg, logger, registry, forwarder)

	go func() {
		logger.Info("agentation router listening", "address", cfg.Address)
		error := server.ListenAndServe()
		if error != nil && !errors.Is(error, http.ErrServerClosed) {
			logger.Error("router server failed", "error", error)
			os.Exit(1)
		}
	}()

	signalContext, stopSignal := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stopSignal()

	<-signalContext.Done()
	shutdownContext, cancelShutdown := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancelShutdown()

	if error := server.Shutdown(shutdownContext); error != nil {
		logger.Error("router shutdown failed", "error", error)
		return 1
	}

	logger.Info("agentation router stopped")
	return 0
}

func runStart(args []string) int {
	foreground, serveArgs := parseStartArgs(args)

	if pid, ok := loadRunningPID(); ok {
		fmt.Printf("agentation-router already running (pid %d)\n", pid)
		return 0
	}

	if foreground {
		fmt.Println("starting agentation-router in foreground")
		return runServe(serveArgs)
	}

	executablePath, error := os.Executable()
	if error != nil {
		fmt.Fprintf(os.Stderr, "failed to resolve executable path: %v\n", error)
		return 1
	}

	logPath := logFilePath()
	if error := os.MkdirAll(filepath.Dir(logPath), 0o755); error != nil {
		fmt.Fprintf(os.Stderr, "failed to create log directory: %v\n", error)
		return 1
	}
	logFile, error := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if error != nil {
		fmt.Fprintf(os.Stderr, "failed to open log file: %v\n", error)
		return 1
	}
	defer logFile.Close()

	commandArgs := append([]string{"serve"}, serveArgs...)
	command := exec.Command(executablePath, commandArgs...)
	command.Stdout = logFile
	command.Stderr = logFile

	if error := command.Start(); error != nil {
		fmt.Fprintf(os.Stderr, "failed to start agentation-router: %v\n", error)
		return 1
	}

	pid := command.Process.Pid
	if error := writePID(pid); error != nil {
		fmt.Fprintf(os.Stderr, "failed to write pid file: %v\n", error)
		_ = command.Process.Kill()
		return 1
	}

	time.Sleep(250 * time.Millisecond)
	if !isProcessRunning(pid) {
		_ = removePIDFile()
		fmt.Fprintln(os.Stderr, "agentation-router failed to stay running")
		return 1
	}

	fmt.Printf("agentation-router started in background (pid %d)\n", pid)
	fmt.Printf("log: %s\n", logPath)
	return 0
}

func runStop() int {
	pid, error := readPID()
	if error != nil || !isProcessRunning(pid) {
		fallbackPID, ok := findRunningRouterPIDByScan()
		if !ok {
			_ = removePIDFile()
			fmt.Println("agentation-router is not running")
			return 0
		}
		pid = fallbackPID
	}

	if error := syscall.Kill(pid, syscall.SIGTERM); error != nil {
		fmt.Fprintf(os.Stderr, "failed to stop agentation-router: %v\n", error)
		return 1
	}

	for attempt := 0; attempt < 30; attempt++ {
		if !isProcessRunning(pid) {
			_ = removePIDFile()
			fmt.Printf("agentation-router stopped (pid %d)\n", pid)
			return 0
		}
		time.Sleep(100 * time.Millisecond)
	}

	if error := syscall.Kill(pid, syscall.SIGKILL); error != nil {
		fmt.Fprintf(os.Stderr, "failed to kill agentation-router: %v\n", error)
		return 1
	}

	_ = removePIDFile()
	fmt.Printf("agentation-router stopped (pid %d)\n", pid)
	return 0
}

func runStatus() int {
	pid, error := readPID()
	if error != nil || !isProcessRunning(pid) {
		fallbackPID, ok := findRunningRouterPIDByScan()
		if !ok {
			_ = removePIDFile()
			fmt.Println("agentation-router not running")
			return 1
		}
		pid = fallbackPID
		_ = writePID(pid)
	}

	fmt.Printf("agentation-router running (pid %d)\n", pid)
	return 0
}

func parseStartArgs(args []string) (bool, []string) {
	foreground := false
	serveArgs := make([]string, 0, len(args))
	for _, arg := range args {
		switch arg {
		case "--foreground", "foreground":
			foreground = true
		case "--background", "background":
			foreground = false
		default:
			serveArgs = append(serveArgs, arg)
		}
	}
	return foreground, serveArgs
}

func pidFilePath() string {
	path := strings.TrimSpace(os.Getenv("AGENTATION_ROUTER_PID_FILE"))
	if path != "" {
		return path
	}
	return filepath.Join(os.TempDir(), "agentation-router.pid")
}

func logFilePath() string {
	path := strings.TrimSpace(os.Getenv("AGENTATION_ROUTER_LOG_FILE"))
	if path != "" {
		return path
	}
	return filepath.Join(os.TempDir(), "agentation-router.log")
}

func writePID(pid int) error {
	path := pidFilePath()
	if error := os.MkdirAll(filepath.Dir(path), 0o755); error != nil {
		return error
	}
	return os.WriteFile(path, []byte(strconv.Itoa(pid)), 0o644)
}

func readPID() (int, error) {
	contents, error := os.ReadFile(pidFilePath())
	if error != nil {
		return 0, error
	}

	raw := strings.TrimSpace(string(contents))
	if raw == "" {
		return 0, fmt.Errorf("pid file is empty")
	}

	pid, error := strconv.Atoi(raw)
	if error != nil {
		return 0, error
	}
	if pid <= 0 {
		return 0, fmt.Errorf("pid is invalid")
	}

	return pid, nil
}

func removePIDFile() error {
	error := os.Remove(pidFilePath())
	if errors.Is(error, os.ErrNotExist) {
		return nil
	}
	return error
}

func isProcessRunning(pid int) bool {
	error := syscall.Kill(pid, 0)
	return error == nil || errors.Is(error, syscall.EPERM)
}

func loadRunningPID() (int, bool) {
	pid, error := readPID()
	if error == nil && isProcessRunning(pid) {
		return pid, true
	}

	fallbackPID, ok := findRunningRouterPIDByScan()
	if !ok {
		_ = removePIDFile()
		return 0, false
	}

	_ = writePID(fallbackPID)
	return fallbackPID, true
}

func findRunningRouterPIDByScan() (int, bool) {
	output, error := exec.Command("pgrep", "-f", "agentation-router").Output()
	if error != nil {
		return 0, false
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	for _, line := range lines {
		value := strings.TrimSpace(line)
		if value == "" {
			continue
		}

		pid, parseError := strconv.Atoi(value)
		if parseError != nil {
			continue
		}
		if pid <= 0 || pid == os.Getpid() {
			continue
		}
		if !isProcessRunning(pid) {
			continue
		}

		commandOutput, commandError := exec.Command("ps", "-o", "command=", "-p", strconv.Itoa(pid)).Output()
		if commandError != nil {
			continue
		}

		commandLine := strings.TrimSpace(string(commandOutput))
		if commandLine == "" {
			continue
		}

		if strings.Contains(commandLine, "agentation-router start") ||
			strings.Contains(commandLine, "agentation-router stop") ||
			strings.Contains(commandLine, "agentation-router status") {
			continue
		}

		if strings.Contains(commandLine, "agentation-router serve") ||
			strings.HasSuffix(commandLine, "agentation-router") ||
			strings.HasSuffix(commandLine, "bin/agentation-router") {
			return pid, true
		}
	}

	return 0, false
}

func printUsage() {
	fmt.Println("agentation-router commands:")
	fmt.Println("  start [--foreground|--background] [serve flags]")
	fmt.Println("  stop")
	fmt.Println("  status")
	fmt.Println("  serve [flags] (run foreground server)")
}
