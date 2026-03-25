"use client";

import { useEffect, useState } from "react";

import { delay } from "./delay";
import { ToolbarIcon } from "./ToolbarIcon";
import "../FeaturesDemo.css";
export function MultiSelectDemo(): JSX.Element {
  const [cursorPos, setCursorPos] = useState({ x: 300, y: 180 });
  const [dragBox, setDragBox] = useState({ visible: false, x: 0, y: 0, width: 0, height: 0 });
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showMarkers, setShowMarkers] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isCrosshair, setIsCrosshair] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const feedbackText = "Add priority labels";

  useEffect(() => {
    let cancelled = false;

    const runAnimation = async () => {
      setCursorPos({ x: 300, y: 180 });
      setDragBox({ visible: false, x: 0, y: 0, width: 0, height: 0 });
      setSelectedItems([]);
      setShowPopup(false);
      setShowMarkers(false);
      setTypedText("");
      setIsCrosshair(true); // Crosshair when toolbar is open
      setIsDragging(false);

      await delay(600);
      if (cancelled) return;

      // Move to start position (bottom left of list)
      setCursorPos({ x: 10, y: 148 });
      await delay(400);
      if (cancelled) return;

      await delay(200);
      if (cancelled) return;

      // Start drag from bottom, go diagonally up to the right
      setIsDragging(true);
      const startX = 15;
      const startY = 153;
      const endX = 200;
      const endY = 63;
      const steps = 20;

      setDragBox({ visible: true, x: startX, y: startY, width: 0, height: 0 });

      for (let i = 0; i <= steps; i++) {
        if (cancelled) return;
        const progress = i / steps;
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;

        setCursorPos({ x: currentX, y: currentY });

        // For upward drag, box top is at currentY, height grows upward
        const boxTop = Math.min(startY, currentY);
        const boxHeight = Math.abs(currentY - startY);
        setDragBox({
          visible: true,
          x: startX,
          y: boxTop,
          width: currentX - startX,
          height: boxHeight,
        });

        // Select items as they're encompassed (bottom to top: 2, 1, 0)
        if (progress > 0.3) setSelectedItems((s) => (s.includes(2) ? s : [...s, 2]));
        if (progress > 0.5) setSelectedItems((s) => (s.includes(1) ? s : [...s, 1]));
        if (progress > 0.7) setSelectedItems((s) => (s.includes(0) ? s : [...s, 0]));

        await delay(25);
      }

      await delay(200);
      if (cancelled) return;

      setIsDragging(false);
      setDragBox({ visible: false, x: 0, y: 0, width: 0, height: 0 });
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
      setShowMarkers(true);

      await delay(2500);
      if (cancelled) return;

      setShowMarkers(false);
      setSelectedItems([]);
      await delay(300);
    };

    runAnimation();
    let interval = setInterval(runAnimation, 9000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        cancelled = true;
        clearInterval(interval);
        setTimeout(() => {
          cancelled = false;
          runAnimation();
          interval = setInterval(runAnimation, 9000);
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
        <div className="demo-url">localhost:3000/tasks</div>
      </div>

      <div className="demo-content">
        <div className="msd-faux-title" />
        <div className="msd-items">
          {[100, 80, 65].map((width, i) => (
            <div key={i} className={`msd-item ${selectedItems.includes(i) ? "selected" : ""}`}>
              <div className="msd-checkbox" />
              <div className="msd-faux-text" style={{ width }} />
            </div>
          ))}
        </div>

        {dragBox.visible && (
          <div
            className="msd-drag-box"
            style={{
              left: dragBox.x,
              top: dragBox.y,
              width: dragBox.width,
              height: dragBox.height,
            }}
          />
        )}

        <div
          className={`demo-marker green ${showMarkers ? "visible" : ""}`}
          style={{ top: 63, left: 200 }}
        >
          1
        </div>

        <div className={`demo-popup ${showPopup ? "visible" : ""}`} style={{ top: 100 }}>
          <div className="demo-popup-header">3 elements selected</div>
          <div className="demo-popup-input">
            {typedText}<span style={{ opacity: 0.4 }}>|</span>
          </div>
          <div className="demo-popup-actions">
            <div className="demo-popup-btn cancel">Cancel</div>
            <div className="demo-popup-btn submit green">Add</div>
          </div>
        </div>

        <div className={`demo-cursor ${isDragging ? "dragging" : ""}`} style={{ left: cursorPos.x, top: cursorPos.y }}>
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
            <ToolbarIcon icon="eye" disabled={!showMarkers} />
            <ToolbarIcon icon="copy" disabled={!showMarkers} />
            <ToolbarIcon icon="trash" disabled={!showMarkers} />
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
// AREA SELECTION DEMO
// ============================================================
