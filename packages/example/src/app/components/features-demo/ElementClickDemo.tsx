"use client";

import { useEffect, useRef, useState } from "react";

import { delay } from "./delay";
import { ToolbarIcon } from "./ToolbarIcon";
import "../FeaturesDemo.css";
export function ElementClickDemo(): JSX.Element {
  const [cursorPos, setCursorPos] = useState({ x: 350, y: 80 });
  const [showHighlight, setShowHighlight] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showMarker, setShowMarker] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isCrosshair, setIsCrosshair] = useState(false);
  const [btnPos, setBtnPos] = useState({ x: 20, y: 181, width: 330, height: 32 });

  const btnRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const btnPosRef = useRef({ x: 20, y: 181, width: 330, height: 32 });

  // Measure the actual position of the button
  const measure = () => {
    if (btnRef.current && contentRef.current) {
      const btnRect = btnRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const newPos = {
        x: btnRect.left - contentRect.left,
        y: btnRect.top - contentRect.top,
        width: btnRect.width,
        height: btnRect.height,
      };
      btnPosRef.current = newPos;
      setBtnPos(newPos);
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

  const feedbackText = "Make this more prominent";

  useEffect(() => {
    let cancelled = false;

    const runAnimation = async () => {
      setCursorPos({ x: 350, y: 80 });
      setShowHighlight(false);
      setShowPopup(false);
      setShowMarker(false);
      setTypedText("");
      setIsCrosshair(true); // Crosshair when toolbar is open

      await delay(600);
      if (cancelled) return;

      const pos = btnPosRef.current;
      // Move toward the upgrade button center
      setCursorPos({ x: pos.x + pos.width / 2, y: pos.y + pos.height / 2 });
      await delay(400);
      if (cancelled) return;

      // Show highlight on hover
      setShowHighlight(true);
      await delay(300);
      if (cancelled) return;

      // Click
      await delay(200);
      if (cancelled) return;
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
      await delay(300);
    };

    runAnimation();
    let interval = setInterval(runAnimation, 8000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        cancelled = true;
        clearInterval(interval);
        setTimeout(() => {
          cancelled = false;
          runAnimation();
          interval = setInterval(runAnimation, 8000);
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
        <div className="demo-url">localhost:3000/account</div>
      </div>

      <div className="demo-content" ref={contentRef}>
        <div className="ecd-faux-title" />
        <div className="ecd-plan-card">
          <div className="ecd-plan-header">
            <div className="ecd-faux-badge" />
            <div className="ecd-plan-usage">
              <div className="ecd-faux-label" />
              <div className="ecd-faux-value" />
            </div>
          </div>
          <div className="ecd-plan-progress">
            <div className="ecd-plan-progress-fill" />
          </div>
          <div className="ecd-plan-features">
            <div className="ecd-feature">
              <div className="ecd-faux-check" />
              <div className="ecd-faux-text" style={{ width: 50 }} />
            </div>
            <div className="ecd-feature">
              <div className="ecd-faux-check" />
              <div className="ecd-faux-text" style={{ width: 70 }} />
            </div>
            <div className="ecd-feature disabled">
              <div className="ecd-faux-x" />
              <div className="ecd-faux-text" style={{ width: 80 }} />
            </div>
          </div>
          <div className="ecd-upgrade-btn" ref={btnRef} />
        </div>

        <div
          className={`ecd-highlight ${showHighlight ? "visible" : ""}`}
          style={{ top: btnPos.y - 4, left: btnPos.x - 4, width: btnPos.width + 8, height: btnPos.height + 8 }}
        />
        <div className={`demo-marker ${showMarker ? "visible" : ""}`} style={{ top: btnPos.y + btnPos.height / 2, left: btnPos.x + btnPos.width / 2 }}>1</div>

        <div className={`demo-popup ecd-popup ${showPopup ? "visible" : ""}`} style={{ top: 115 }}>
          <div className="demo-popup-header">&lt;button.upgrade-btn&gt;</div>
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
// MULTI-SELECT DEMO
// ============================================================
