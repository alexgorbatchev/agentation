"use client";

import { useEffect, useRef, useState } from "react";

import { delay } from "./delay";
import { ToolbarIcon } from "./ToolbarIcon";
import "../FeaturesDemo.css";
export function AnimationPauseDemo(): JSX.Element {
  const [cursorPos, setCursorPos] = useState({ x: 300, y: 100 });
  const [isPaused, setIsPaused] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showMarker, setShowMarker] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isCrosshair, setIsCrosshair] = useState(false);
  const [progressPos, setProgressPos] = useState({ x: 20, y: 138, width: 330, height: 12 });
  const [pauseBtnPos, setPauseBtnPos] = useState({ x: 218, y: 275, width: 28, height: 28 });

  const progressRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pauseBtnRef = useRef<HTMLDivElement>(null);
  const progressPosRef = useRef({ x: 20, y: 138, width: 330, height: 12 });
  const pauseBtnPosRef = useRef({ x: 218, y: 275, width: 28, height: 28 });

  // Measure the actual positions
  const measure = () => {
    if (progressRef.current && contentRef.current) {
      const progressRect = progressRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const newPos = {
        x: progressRect.left - contentRect.left,
        y: progressRect.top - contentRect.top,
        width: progressRect.width,
        height: progressRect.height,
      };
      progressPosRef.current = newPos;
      setProgressPos(newPos);
    }
    if (pauseBtnRef.current && contentRef.current) {
      const btnRect = pauseBtnRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const newPos = {
        x: btnRect.left - contentRect.left,
        y: btnRect.top - contentRect.top,
        width: btnRect.width,
        height: btnRect.height,
      };
      pauseBtnPosRef.current = newPos;
      setPauseBtnPos(newPos);
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

  const feedbackText = "Skeleton pulses too fast";

  useEffect(() => {
    let cancelled = false;

    const runAnimation = async () => {
      setCursorPos({ x: 300, y: 100 });
      setIsPaused(false);
      setShowHighlight(false);
      setShowPopup(false);
      setShowMarker(false);
      setTypedText("");
      setIsCrosshair(true); // Crosshair in annotation mode

      await delay(800);
      if (cancelled) return;

      // Move to pause button in toolbar - switch to pointer for toolbar interaction
      setIsCrosshair(false);
      const pausePos = pauseBtnPosRef.current;
      setCursorPos({ x: pausePos.x + pausePos.width / 2, y: pausePos.y + pausePos.height / 2 });
      await delay(450);
      if (cancelled) return;

      // Click pause
      await delay(150);
      if (cancelled) return;
      setIsPaused(true);
      await delay(500);
      if (cancelled) return;

      // Move to progress bar area - switch back to crosshair for annotation
      setIsCrosshair(true);
      const pos = progressPosRef.current;
      setCursorPos({ x: pos.x + pos.width / 2, y: pos.y + pos.height / 2 });
      await delay(450);
      if (cancelled) return;

      setShowHighlight(true);
      await delay(300);
      if (cancelled) return;

      // Click and show popup
      setShowPopup(true);
      await delay(300);
      if (cancelled) return;

      // Type feedback
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

      await delay(2500);
      if (cancelled) return;

      setShowMarker(false);
      setShowHighlight(false);
      setIsPaused(false);
      await delay(300);
    };

    runAnimation();
    let interval = setInterval(runAnimation, 10000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        cancelled = true;
        clearInterval(interval);
        setTimeout(() => {
          cancelled = false;
          runAnimation();
          interval = setInterval(runAnimation, 10000);
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
    <div className="demo-window">
      <div className="demo-browser-bar">
        <div className="demo-dot" />
        <div className="demo-dot" />
        <div className="demo-dot" />
        <div className="demo-url">localhost:3000/upload</div>
      </div>

      <div className="demo-content" ref={contentRef}>
        <div className="apd-skeleton-card" ref={progressRef}>
          <div className={`apd-skeleton-avatar ${isPaused ? "paused" : ""}`} />
          <div className="apd-skeleton-lines">
            <div className={`apd-skeleton-line ${isPaused ? "paused" : ""}`} style={{ width: '70%' }} />
            <div className={`apd-skeleton-line short ${isPaused ? "paused" : ""}`} style={{ width: '45%' }} />
          </div>
        </div>
        <div className="apd-skeleton-card">
          <div className={`apd-skeleton-avatar ${isPaused ? "paused" : ""}`} />
          <div className="apd-skeleton-lines">
            <div className={`apd-skeleton-line ${isPaused ? "paused" : ""}`} style={{ width: '85%' }} />
            <div className={`apd-skeleton-line short ${isPaused ? "paused" : ""}`} style={{ width: '55%' }} />
          </div>
        </div>

        <div
          className={`apd-highlight ${showHighlight ? "visible" : ""}`}
          style={{ top: progressPos.y - 4, left: progressPos.x - 4, width: progressPos.width + 8, height: progressPos.height + 8 }}
        />
        <div className={`demo-marker ${showMarker ? "visible" : ""}`} style={{ top: progressPos.y + progressPos.height / 2, left: progressPos.x + progressPos.width / 2 }}>1</div>

        <div className={`demo-popup ${showPopup ? "visible" : ""}`} style={{ top: 70 }}>
          <div className="demo-popup-header">&lt;div.skeleton-card&gt;</div>
          <div className="demo-popup-input">
            {typedText}<span style={{ opacity: 0.4 }}>|</span>
          </div>
          <div className="demo-popup-actions">
            <div className="demo-popup-btn cancel">Cancel</div>
            <div className="demo-popup-btn submit">Add</div>
          </div>
        </div>

        <div className="demo-cursor" style={{ left: cursorPos.x, top: cursorPos.y }}>
          <div className={`demo-cursor-pointer ${isCrosshair ? "hidden" : ""}`}>
            <svg height="24" width="24" viewBox="0 0 32 32">
              <g fill="none" fillRule="evenodd" transform="translate(10 7)">
                <path d="m6.148 18.473 1.863-1.003 1.615-.839-2.568-4.816h4.332l-11.379-11.408v16.015l3.316-3.221z" fill="#fff"/>
                <path d="m6.431 17 1.765-.941-2.775-5.202h3.604l-8.025-8.043v11.188l2.53-2.442z" fill="#000"/>
              </g>
            </svg>
          </div>
          <div className={`demo-cursor-crosshair ${isCrosshair ? "" : "hidden"}`}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <line x1="8.5" y1="0" x2="8.5" y2="17" stroke="black" strokeWidth="1"/>
              <line x1="0" y1="8.5" x2="17" y2="8.5" stroke="black" strokeWidth="1"/>
            </svg>
          </div>
        </div>

        <div className="demo-toolbar">
          <div className="demo-toolbar-buttons">
            <div ref={pauseBtnRef} style={{ display: 'flex' }}>
              <ToolbarIcon icon={isPaused ? "play" : "pause"} active={isPaused} />
            </div>
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
