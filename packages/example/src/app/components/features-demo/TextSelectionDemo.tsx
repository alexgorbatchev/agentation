"use client";

import { useEffect, useRef, useState } from "react";

import { delay } from "./delay";
import { ToolbarIcon } from "./ToolbarIcon";
import "../FeaturesDemo.css";
export function TextSelectionDemo(): JSX.Element {
  const [typedText, setTypedText] = useState("");
  const [cursorPos, setCursorPos] = useState({ x: 300, y: 180 });
  const [showSelection, setShowSelection] = useState(false);
  const [selectionWidth, setSelectionWidth] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [showMarker, setShowMarker] = useState(false);
  const [isTextCursor, setIsTextCursor] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [wordPos, setWordPos] = useState({ x: 52, y: 57, width: 44 });

  const wordRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wordPosRef = useRef({ x: 52, y: 57, width: 44 });

  // Measure the actual position of "recieve"
  const measure = () => {
    if (wordRef.current && contentRef.current) {
      const wordRect = wordRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const newPos = {
        x: wordRect.left - contentRect.left,
        y: wordRect.top - contentRect.top,
        width: wordRect.width,
      };
      wordPosRef.current = newPos;
      setWordPos(newPos);
    }
  };

  // Measure on mount and resize
  useEffect(() => {
    const timer = setTimeout(measure, 100);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const feedbackText = "Fix typo";
  const actualCursorX = isSelecting ? wordPos.x + selectionWidth : cursorPos.x;

  useEffect(() => {
    let cancelled = false;

    const runAnimation = async () => {
      setTypedText("");
      setCursorPos({ x: 300, y: 180 });
      setShowSelection(false);
      setSelectionWidth(0);
      setShowPopup(false);
      setShowMarker(false);
      setIsTextCursor(false);
      setIsSelecting(false);

      await delay(600);
      if (cancelled) return;

      const pos = wordPosRef.current;
      // Move toward the text - switch to I-beam mid-motion
      setCursorPos({ x: pos.x, y: pos.y });
      await delay(180);
      if (cancelled) return;
      setIsTextCursor(true);
      await delay(250);
      if (cancelled) return;

      setIsSelecting(true);
      setShowSelection(true);

      const endWidth = pos.width;
      const steps = 14;
      const stepSize = endWidth / steps;

      for (let i = 0; i <= steps; i++) {
        if (cancelled) return;
        const w = Math.round(i * stepSize);
        setSelectionWidth(w);
        await delay(20);
      }

      setCursorPos({ x: pos.x + endWidth, y: pos.y });
      setIsSelecting(false);
      await delay(250);
      if (cancelled) return;

      setShowPopup(true);
      await delay(300);
      if (cancelled) return;

      for (let i = 0; i <= feedbackText.length; i++) {
        if (cancelled) return;
        setTypedText(feedbackText.slice(0, i));
        await delay(30);
      }
      await delay(400);
      if (cancelled) return;

      setShowPopup(false);
      await delay(200);
      if (cancelled) return;
      setShowMarker(true);

      await delay(1800);
      if (cancelled) return;

      setShowMarker(false);
      setShowSelection(false);
      await delay(200);
    };

    runAnimation();
    let interval = setInterval(runAnimation, 6000);

    // Restart animation cleanly when returning from background
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        cancelled = true;
        clearInterval(interval);
        setTimeout(() => {
          cancelled = false;
          runAnimation();
          interval = setInterval(runAnimation, 7000);
        }, 100);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div className="demo-window text-demo">
      <div className="demo-browser-bar">
        <div className="demo-dot" />
        <div className="demo-dot" />
        <div className="demo-dot" />
        <div className="demo-url">localhost:3000/blog</div>
      </div>

      <div className="demo-content" ref={contentRef}>
        <p className="demo-quote">
          "Simple can be harder than complex: You have to work hard to get your thinking clean to make it <span ref={wordRef}>simpl</span>. But it's worth it in the end because once you get there, you can move mountains."
        </p>
        <p className="demo-quote-author">— Steve Jobs</p>

        <div className={`tsd-highlight ${showSelection ? "visible" : ""}`} style={{ left: wordPos.x - 2, top: wordPos.y - 1, width: selectionWidth + 4, height: 16 }} />
        <div className={`demo-marker ${showMarker ? "visible" : ""}`} style={{ top: wordPos.y + 1, left: wordPos.x + wordPos.width }}>1</div>

        <div className={`demo-popup ${showPopup ? "visible" : ""}`}>
          <div className="demo-popup-header">"simpl"</div>
          <div className="demo-popup-input">
            {typedText}<span style={{ opacity: 0.4 }}>|</span>
          </div>
          <div className="demo-popup-actions">
            <div className="demo-popup-btn cancel">Cancel</div>
            <div className="demo-popup-btn submit">Add</div>
          </div>
        </div>

        <div className={`demo-cursor ${isSelecting ? "selecting" : ""}`} style={{ left: actualCursorX, top: cursorPos.y }}>
          <div className={`demo-cursor-crosshair ${isTextCursor ? "hidden" : ""}`}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <line x1="8.5" y1="0" x2="8.5" y2="17" stroke="black" strokeWidth="1"/>
              <line x1="0" y1="8.5" x2="17" y2="8.5" stroke="black" strokeWidth="1"/>
            </svg>
          </div>
          <div className={`demo-cursor-text ${isTextCursor ? "" : "hidden"}`}>
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M3 1H7M3 15H7M5 1V15" stroke="#000" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="demo-toolbar">
          <div className="demo-toolbar-buttons">
            <ToolbarIcon icon="pause" />
            <ToolbarIcon icon="eye" disabled={!showMarker} />
            <ToolbarIcon icon="copy" disabled={!showMarker} />
            <ToolbarIcon icon="trash" disabled={!showMarker} />
            <ToolbarIcon icon="settings" />
            <div className="demo-toolbar-divider" />
            <ToolbarIcon icon="close" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ELEMENT CLICK DEMO
// ============================================================
