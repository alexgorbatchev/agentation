"use client";

import { useEffect, useRef, useState } from "react";

import { ToolbarIcon } from "./ToolbarIcon";
import { useDemoAnimationLoop } from "./useDemoAnimationLoop";
import { useMeasureOnResize } from "./useMeasureOnResize";
import "../FeaturesDemo.css";

export function ComputedStylesDemo(): JSX.Element {
  const [cursorPos, setCursorPos] = useState({ x: 300, y: 80 });
  const [showHighlight, setShowHighlight] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showMarker, setShowMarker] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isCrosshair, setIsCrosshair] = useState(true);
  const [isStylesExpanded, setIsStylesExpanded] = useState(false);
  const [btnPos, setBtnPos] = useState({ x: 20, y: 100, width: 100, height: 36 });

  const btnRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);
  const btnPosRef = useRef({ x: 20, y: 100, width: 100, height: 36 });
  const chevronPosRef = useRef({ x: 0, y: 0 });

  // Measure positions
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

  useMeasureOnResize({ measure });

  // Update chevron position when popup is visible
  useEffect(() => {
    if (showPopup && chevronRef.current && contentRef.current) {
      const chevronRect = chevronRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      chevronPosRef.current = {
        x: chevronRect.left - contentRect.left + chevronRect.width / 2,
        y: chevronRect.top - contentRect.top + chevronRect.height / 2,
      };
    }
  }, [showPopup]);

  const feedbackText = "Make avatar 48px";

  const resetDemo = (): void => {
    setCursorPos({ x: 300, y: 80 });
    setShowHighlight(false);
    setShowPopup(false);
    setShowMarker(false);
    setTypedText("");
    setIsCrosshair(true);
    setIsStylesExpanded(false);
  };

  useDemoAnimationLoop(
    async ({ isCancelled, wait }) => {
      resetDemo();

      if (!(await wait(600))) {
        return;
      }

      const pos = btnPosRef.current;
      setCursorPos({ x: pos.x + pos.width / 2, y: pos.y + pos.height / 2 });
      if (!(await wait(400))) {
        return;
      }

      setShowHighlight(true);
      if (!(await wait(300))) {
        return;
      }

      if (!(await wait(200))) {
        return;
      }
      setShowPopup(true);
      if (!(await wait(400))) {
        return;
      }

      setIsCrosshair(false);
      const chevronPos = chevronPosRef.current;
      setCursorPos({ x: chevronPos.x, y: chevronPos.y });
      if (!(await wait(400))) {
        return;
      }

      setIsStylesExpanded(true);
      if (!(await wait(1200))) {
        return;
      }

      setIsStylesExpanded(false);
      if (!(await wait(400))) {
        return;
      }

      setCursorPos({ x: 280, y: 125 });
      if (!(await wait(300))) {
        return;
      }

      for (let i = 0; i <= feedbackText.length; i++) {
        if (isCancelled()) {
          return;
        }

        setTypedText(feedbackText.slice(0, i));
        if (!(await wait(35))) {
          return;
        }
      }
      if (!(await wait(400))) {
        return;
      }

      setShowPopup(false);
      setIsCrosshair(true);
      if (!(await wait(200))) {
        return;
      }
      setShowMarker(true);

      if (!(await wait(2000))) {
        return;
      }

      setShowMarker(false);
      setShowHighlight(false);
      await wait(300);
    },
    { intervalMs: 10000, onVisibilityRestart: resetDemo },
  );

  const computedStyles = [
    { prop: "width", value: "44px" },
    { prop: "height", value: "44px" },
    { prop: "border-radius", value: "50%" },
    { prop: "object-fit", value: "cover" },
    { prop: "background", value: "linear-gradient(...)" },
  ];

  return (
    <div className="fd-container">
      <div className="demo-window">
        <div className="demo-browser-bar">
          <div className="demo-dot" />
          <div className="demo-dot" />
          <div className="demo-dot" />
          <div className="demo-url">localhost:3000/settings</div>
        </div>

        <div className="demo-content" ref={contentRef}>
          <div className="csd-profile-card">
            <div ref={btnRef} className="csd-avatar" />
            <div className="csd-profile-info">
              <div className="csd-name" />
              <div className="csd-email" />
            </div>
            <div className="csd-edit-btn" />
          </div>
          <div className="csd-stats-row">
            <div className="csd-stat">
              <div className="csd-stat-value" />
              <div className="csd-stat-label" />
            </div>
            <div className="csd-stat">
              <div className="csd-stat-value short" />
              <div className="csd-stat-label" />
            </div>
            <div className="csd-stat">
              <div className="csd-stat-value" />
              <div className="csd-stat-label" />
            </div>
          </div>

          <div
            className={`csd-highlight ${showHighlight ? "visible" : ""}`}
            style={{ top: btnPos.y - 4, left: btnPos.x - 4, width: btnPos.width + 8, height: btnPos.height + 8 }}
          />
          <div className={`demo-marker ${showMarker ? "visible" : ""}`} style={{ top: btnPos.y + btnPos.height / 2, left: btnPos.x + btnPos.width / 2 }}>1</div>

          <div className={`demo-popup csd-popup ${showPopup ? "visible" : ""}`} style={{ top: 55, left: '35%' }}>
            <div className="csd-popup-header">
              <button ref={chevronRef} className="csd-toggle-btn" type="button">
                <svg
                  className={`csd-chevron ${isStylesExpanded ? "expanded" : ""}`}
                  width="12"
                  height="12"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M5.5 10.25L9 7.25L5.75 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="csd-element">&lt;img.avatar&gt;</span>
              </button>
            </div>

            <div className={`csd-styles-wrapper ${isStylesExpanded ? "expanded" : ""}`}>
              <div className="csd-styles-inner">
                <div className="csd-styles-block">
                  {computedStyles.map(({ prop, value }) => (
                    <div key={prop} className="csd-style-line">
                      <span className="csd-style-prop">{prop}</span>
                      : <span className="csd-style-value">{value}</span>;
                    </div>
                  ))}
                </div>
              </div>
            </div>

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

      <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', whiteSpace: 'pre-line', lineHeight: 1.3 }}>
        Click the chevron to expand computed CSS styles for the selected element.{"\n"}Useful for debugging styling issues or communicating design specs.
      </p>
    </div>
  );
}
