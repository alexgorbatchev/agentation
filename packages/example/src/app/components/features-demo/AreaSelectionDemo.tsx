"use client";

import { useEffect, useState } from "react";

import { delay } from "./delay";
import { ToolbarIcon } from "./ToolbarIcon";
import "../FeaturesDemo.css";
export function AreaSelectionDemo(): JSX.Element {
  const [cursorPos, setCursorPos] = useState({ x: 300, y: 180 });
  const [dragBox, setDragBox] = useState({ visible: false, x: 0, y: 0, width: 0, height: 0 });
  const [areaOutline, setAreaOutline] = useState({ visible: false, x: 0, y: 0, width: 0, height: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [showMarker, setShowMarker] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isCrosshair, setIsCrosshair] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const feedbackText = "Add chart here";

  useEffect(() => {
    let cancelled = false;

    const runAnimation = async () => {
      setCursorPos({ x: 300, y: 180 });
      setDragBox({ visible: false, x: 0, y: 0, width: 0, height: 0 });
      setAreaOutline({ visible: false, x: 0, y: 0, width: 0, height: 0 });
      setShowPopup(false);
      setShowMarker(false);
      setTypedText("");
      setIsCrosshair(true); // Crosshair when toolbar is open
      setIsDragging(false);

      await delay(600);
      if (cancelled) return;

      // Move to empty section area
      setCursorPos({ x: 25, y: 115 });
      await delay(400);
      if (cancelled) return;

      await delay(200);
      if (cancelled) return;

      // Start drag in empty section
      setIsDragging(true);
      const startX = 30;
      const startY = 120;
      const endX = 350;
      const endY = 175;
      const steps = 16;

      setDragBox({ visible: true, x: startX, y: startY, width: 0, height: 0 });

      for (let i = 0; i <= steps; i++) {
        if (cancelled) return;
        const progress = i / steps;
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;

        setCursorPos({ x: currentX, y: currentY });
        setDragBox({
          visible: true,
          x: startX,
          y: startY,
          width: currentX - startX,
          height: currentY - startY,
        });

        await delay(25);
      }

      await delay(200);
      if (cancelled) return;

      // End drag - hide drag box, show area outline
      setIsDragging(false);
      setDragBox({ visible: false, x: 0, y: 0, width: 0, height: 0 });
      setAreaOutline({
        visible: true,
        x: startX,
        y: startY,
        width: endX - startX,
        height: endY - startY,
      });
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
      setAreaOutline({ visible: false, x: 0, y: 0, width: 0, height: 0 });
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
        <div className="demo-url">localhost:3000/landing</div>
      </div>

      <div className="demo-content">
        <div className="asd-header">
          <div className="asd-header-left">
            <div className="asd-logo" />
            <div className="asd-faux-title" />
          </div>
          <div className="asd-faux-btn" />
        </div>
        <div className="asd-stats-row">
          <div className="asd-stat-card">
            <div className="asd-faux-label" />
            <div className="asd-faux-value" />
          </div>
          <div className="asd-stat-card">
            <div className="asd-faux-label" style={{ width: 38 }} />
            <div className="asd-faux-value" style={{ width: 50 }} />
          </div>
          <div className="asd-stat-card">
            <div className="asd-faux-label" style={{ width: 30 }} />
            <div className="asd-faux-value" style={{ width: 38 }} />
          </div>
        </div>
        <div className="asd-empty-section" />

        {dragBox.visible && (
          <div
            className="asd-drag-box"
            style={{
              left: dragBox.x,
              top: dragBox.y,
              width: dragBox.width,
              height: dragBox.height,
            }}
          />
        )}

        {/* Area outline shown after selection */}
        <div
          className={`asd-area-outline ${areaOutline.visible ? "visible" : ""}`}
          style={{ top: areaOutline.y, left: areaOutline.x, width: areaOutline.width, height: areaOutline.height }}
        />

        <div
          className={`demo-marker green ${showMarker ? "visible" : ""}`}
          style={{ top: 148, left: 350 }}
        >
          1
        </div>

        <div className={`demo-popup ${showPopup ? "visible" : ""}`} style={{ top: 65 }}>
          <div className="demo-popup-header">Area selection</div>
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
// ANIMATION PAUSE DEMO
// ============================================================
