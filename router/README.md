# Agentation Router

Local routing daemon for Neovim bridge sessions.

## What it does

- accepts frontend `open`/`ping` requests at a single endpoint
- tracks active Neovim sessions per project
- routes requests to the best matching Neovim session

## Binary

The binary name is:

```bash
agentation-router
```

## Build

From repo root:

```bash
just build-router
```

Or directly:

```bash
cd router
go build -o ../bin/agentation-router ./cmd/agentation-router
```

## Test

From repo root:

```bash
just test-router
```

Or directly:

```bash
cd router
go test ./...
```

## Run

Foreground server:

```bash
./bin/agentation-router serve
```

Managed process commands:

```bash
./bin/agentation-router start            # background (default)
./bin/agentation-router start --foreground
./bin/agentation-router status
./bin/agentation-router stop
```

Defaults:

- address: `127.0.0.1:8787`
- session stale timeout: `20s`
- pid file: `${TMPDIR:-/tmp}/agentation-router.pid`
- log file: `${TMPDIR:-/tmp}/agentation-router.log`

Optional overrides:

- `AGENTATION_ROUTER_PID_FILE`
- `AGENTATION_ROUTER_LOG_FILE`

## API

- `GET /health`
- `GET /sessions`
- `POST /register`
- `POST /unregister`
- `GET|POST /ping`
- `GET|POST /open`

### Register payload

```json
{
  "sessionId": "nvim-abc",
  "projectId": "project-123",
  "repoId": "repo-123",
  "root": "/Users/alex/dev/project",
  "displayName": "project",
  "endpoint": "http://127.0.0.1:9011"
}
```

### Open query parameters

- `projectId` (optional)
- `path` (required)
- `line` (optional, default `1`)
- `column` (optional, default `1`)
- `origin` (optional)

## Service snippets (optional)

### launchd (macOS)

Create `~/Library/LaunchAgents/dev.agentation.router.plist` and point `ProgramArguments` to the built binary:

```xml
<key>ProgramArguments</key>
<array>
  <string>/absolute/path/to/bin/agentation-router</string>
</array>
```

Then load:

```bash
launchctl load ~/Library/LaunchAgents/dev.agentation.router.plist
```

### systemd (Linux user service)

```ini
[Unit]
Description=Agentation Router

[Service]
ExecStart=/absolute/path/to/bin/agentation-router
Restart=on-failure

[Install]
WantedBy=default.target
```

## Project identity edge cases

- If no git repository exists, the Neovim bridge falls back to hashing the configured project root path.
- Git worktrees naturally produce distinct project IDs because each worktree has its own real path.
- Symlinked project paths are resolved via realpath before hashing to keep identity stable.
