"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { delay } from "./delay";
import "../FeaturesDemo.css";

interface ChatMessage {
  role: "user" | "agent" | "diff";
  text: string;
  progress: number; // 0 to 1
  isTyping?: boolean;
  files?: { name: string; added: number; removed: number }[];
}

export function AgentChatDemo(): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [fading, setFading] = useState(false);

  const conversation: { role: "user" | "agent"; text: string }[] = [
    { role: "user", text: "What annotations do I have?" },
    { role: "agent", text: "**12 annotations across 4 pages.** 7 are on /dashboard — mostly spacing and alignment. Want me to fix them?" },
    { role: "user", text: "Yes" },
    { role: "agent", text: "**Done.** Fixed card padding, stat grid alignment, button colors, and header spacing. All 12 marked as resolved." },
  ];

  // Parse **semibold** text
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</span>;
      }
      return part;
    });
  };

  const diffFiles = [
    { name: "Dashboard.tsx", added: 32, removed: 8 },
    { name: "globals.css", added: 14, removed: 0 },
  ];

  useEffect(() => {
    let cancelled = false;
    let msgCount = 0;

    const streamText = async (textLength: number) => {
      const targetIndex = msgCount - 1;
      const duration = 500 + textLength * 8; // Longer text = longer duration
      const startTime = Date.now();

      const animate = () => {
        if (cancelled) return;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out for smoother ending
        const easedProgress = 1 - Math.pow(1 - progress, 2);

        setMessages(prev => prev.map((m, idx) =>
          idx === targetIndex ? { ...m, progress: easedProgress } : m
        ));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
      await delay(duration);
    };

    const runAnimation = async () => {
      setMessages([]);
      setShowDiff(false);
      msgCount = 0;

      await delay(400);
      if (cancelled) return;

      for (let i = 0; i < conversation.length; i++) {
        if (cancelled) return;
        const msg = conversation[i];
        const isLast = i === conversation.length - 1;

        if (msg.role === "agent") {
          // Show "Thinking..."
          setMessages(prev => [...prev, { ...msg, progress: 0, isTyping: true }]);
          msgCount++;
          // Thinking duration
          await delay(500 + Math.random() * 150);
          if (cancelled) return;

          // Start streaming
          setMessages(prev => prev.map((m, idx) =>
            idx === msgCount - 1 ? { ...m, isTyping: false } : m
          ));

          await streamText(msg.text.length);

          // Show diff immediately when final message finishes streaming
          if (isLast) {
            setShowDiff(true);
          }
        } else {
          setMessages(prev => [...prev, { ...msg, progress: 1 }]);
          msgCount++;
        }

        if (!isLast) {
          // Pause after each message before next one appears
          await delay(600);
          if (cancelled) return;
        }
      }

      // Hold for a moment, then fade out
      await delay(2000);
      if (cancelled) return;
      setFading(true);
      await delay(400);
      if (cancelled) return;

      // Clear and restart
      setMessages([]);
      setShowDiff(false);
      setFading(false);
      await delay(600);
      if (cancelled) return;

      // Loop
      runAnimation();
    };

    runAnimation();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        cancelled = true;
        setTimeout(() => {
          cancelled = false;
          setMessages([]);
          setShowDiff(false);
          setFading(false);
          runAnimation();
        }, 100);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div className="acd-container">
      <div className="acd-chat">
        <div className={`acd-content-wrap${fading ? ' acd-fading' : ''}`}>
        {messages.map((msg, i) => (
          <div key={i} className="acd-message">
            <span className={`acd-label acd-label-${msg.role}`}>{msg.role === "user" ? "You" : "Agent"}</span>
            <span className="acd-content">
              {msg.isTyping ? (
                <span className="acd-shimmer-text">Thinking...</span>
              ) : (
                <span
                  className={`acd-stream${msg.progress >= 1 ? ' complete' : ''}`}
                  style={{
                    '--reveal': `${msg.progress * 100}%`,
                  } as React.CSSProperties}
                >
                  {renderText(msg.text)}
                </span>
              )}
            </span>
          </div>
        ))}
        {showDiff && (
          <div className="acd-diff">
            {diffFiles.map((file, i) => {
              const ext = file.name.split('.').pop();
              const isTsx = ext === 'tsx' || ext === 'ts' || ext === 'jsx' || ext === 'js';
              const isCss = ext === 'css' || ext === 'scss';
              return (
                <span key={i} className="acd-diff-file">
                  {isTsx ? (
                    // React/TS icon
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="2.5" fill="#61dafb"/>
                      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61dafb" strokeWidth="1.5" fill="none"/>
                      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61dafb" strokeWidth="1.5" fill="none" transform="rotate(60 12 12)"/>
                      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61dafb" strokeWidth="1.5" fill="none" transform="rotate(120 12 12)"/>
                    </svg>
                  ) : isCss ? (
                    // CSS icon
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6">
                      <path d="M4.192 3.143h15.615l-1.42 16.034-6.404 1.812-6.369-1.813L4.192 3.143ZM16.9 6.424l-9.8-.002.158 1.926 7.529.002-.189 2.02H9.66l.17 1.918h4.518l-.201 2.187-2.146.598-2.148-.596-.136-1.533H7.59l.267 2.983 4.144 1.166 4.137-1.164.558-6.162.087-.876.318-3.467Z"/>
                    </svg>
                  ) : (
                    // Generic file icon
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" opacity="0.5">
                      <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/>
                    </svg>
                  )}
                  <span className="acd-diff-name">{file.name}</span>
                  <span className="acd-diff-added">+{file.added}</span>
                  {file.removed > 0 && <span className="acd-diff-removed">-{file.removed}</span>}
                </span>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
