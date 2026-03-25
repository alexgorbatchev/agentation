"use client";

import { useRef, useState, type RefObject } from "react";

import { useDemoAnimationLoop } from "./useDemoAnimationLoop";
import { useMeasureOnResize } from "./useMeasureOnResize";
import "../FeaturesDemo.css";

const OUTPUT_DETAIL_OPTIONS = ["Compact", "Standard", "Detailed", "Forensic"];
const COLOR_OPTIONS = [
  { value: "#AF52DE", label: "Purple" },
  { value: "#3c82f7", label: "Blue" },
  { value: "#5AC8FA", label: "Cyan" },
  { value: "#34C759", label: "Green" },
  { value: "#FFD60A", label: "Yellow" },
  { value: "#FF9500", label: "Orange" },
  { value: "#FF3B30", label: "Red" },
];

export function SettingsDemo(): JSX.Element {
  const [showPanel, setShowPanel] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [outputDetail, setOutputDetail] = useState(1); // Standard
  const [selectedColor, setSelectedColor] = useState(1); // Blue
  const [reactEnabled, setReactEnabled] = useState(true);
  const [clearAfterCopy, setClearAfterCopy] = useState(false);
  const [blockInteractions, setBlockInteractions] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 190, y: 20 });
  const [isClicking, setIsClicking] = useState(false);
  const [activeCaption, setActiveCaption] = useState<string | null>("output");

  // Refs for measuring element positions
  const containerRef = useRef<HTMLDivElement>(null);
  const cycleBtnRef = useRef<HTMLButtonElement>(null);
  const reactToggleRef = useRef<HTMLLabelElement>(null);
  const greenColorRef = useRef<HTMLDivElement>(null);
  const clearCheckboxRef = useRef<HTMLSpanElement>(null);
  const blockCheckboxRef = useRef<HTMLSpanElement>(null);
  const themeToggleRef = useRef<HTMLButtonElement>(null);
  const mcpLinkRef = useRef<HTMLButtonElement>(null);

  // Measured positions
  const positionsRef = useRef({
    cycleBtn: { x: 178, y: 82 },
    reactToggle: { x: 195, y: 112 },
    greenColor: { x: 106, y: 175 },
    clearCheckbox: { x: 24, y: 220 },
    blockCheckbox: { x: 24, y: 242 },
    themeToggle: { x: 194, y: 42 },
    mcpLink: { x: 105, y: 280 },
  });

  // Measure positions
  const measurePositions = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const getCenter = (ref: RefObject<HTMLElement>) => {
      if (!ref.current) return null;
      const rect = ref.current.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      };
    };

    const cyclePos = getCenter(cycleBtnRef);
    const reactPos = getCenter(reactToggleRef);
    const greenPos = getCenter(greenColorRef);
    const clearPos = getCenter(clearCheckboxRef);
    const blockPos = getCenter(blockCheckboxRef);
    const themePos = getCenter(themeToggleRef);
    const mcpPos = getCenter(mcpLinkRef);

    if (cyclePos) positionsRef.current.cycleBtn = cyclePos;
    if (reactPos) positionsRef.current.reactToggle = reactPos;
    if (greenPos) positionsRef.current.greenColor = greenPos;
    if (clearPos) positionsRef.current.clearCheckbox = clearPos;
    if (blockPos) positionsRef.current.blockCheckbox = blockPos;
    if (themePos) positionsRef.current.themeToggle = themePos;
    if (mcpPos) positionsRef.current.mcpLink = mcpPos;
  };

  useMeasureOnResize({ measure: measurePositions });

  const resetDemo = (): void => {
    setShowPanel(true);
    setIsDarkMode(true);
    setOutputDetail(1);
    setSelectedColor(1);
    setReactEnabled(true);
    setClearAfterCopy(false);
    setBlockInteractions(false);
    setActiveCaption("output");
    setIsClicking(false);
  };

  useDemoAnimationLoop(
    async ({ isCancelled, wait }) => {
      const click = async (): Promise<void> => {
        setIsClicking(true);
        if (!(await wait(100))) {
          return;
        }
        if (!isCancelled()) {
          setIsClicking(false);
        }
      };

      resetDemo();

      if (!(await wait(100))) {
        return;
      }
      measurePositions();
      const pos = positionsRef.current;
      setCursorPos(pos.cycleBtn);
      if (!(await wait(1400))) {
        return;
      }

      await click();
      if (isCancelled()) {
        return;
      }
      setOutputDetail(2);
      if (!(await wait(2200))) {
        return;
      }

      setActiveCaption("react");
      setCursorPos(pos.reactToggle);
      if (!(await wait(1000))) {
        return;
      }
      await click();
      if (isCancelled()) {
        return;
      }
      setReactEnabled(false);
      if (!(await wait(2200))) {
        return;
      }

      setActiveCaption("color");
      setCursorPos(pos.greenColor);
      if (!(await wait(1000))) {
        return;
      }
      await click();
      if (isCancelled()) {
        return;
      }
      setSelectedColor(3);
      if (!(await wait(2200))) {
        return;
      }

      setActiveCaption("clear");
      setCursorPos(pos.clearCheckbox);
      if (!(await wait(1000))) {
        return;
      }
      await click();
      if (isCancelled()) {
        return;
      }
      setClearAfterCopy(true);
      if (!(await wait(2200))) {
        return;
      }

      setActiveCaption("block");
      setCursorPos(pos.blockCheckbox);
      if (!(await wait(1000))) {
        return;
      }
      await click();
      if (isCancelled()) {
        return;
      }
      setBlockInteractions(true);
      if (!(await wait(2200))) {
        return;
      }

      setActiveCaption("theme");
      setCursorPos(pos.themeToggle);
      if (!(await wait(1000))) {
        return;
      }
      await click();
      if (isCancelled()) {
        return;
      }
      setIsDarkMode(false);
      if (!(await wait(2500))) {
        return;
      }

      await wait(1500);
    },
    { intervalMs: 28000, onVisibilityRestart: resetDemo },
  );

  const currentColor = COLOR_OPTIONS[selectedColor].value;

  const captions: Record<string, string> = {
    output: "Choose how much detail to include in your output.",
    react: "Include React component names in annotations.",
    color: "Pick a marker colour that stands out against your design.",
    clear: "Automatically clear all annotations after copying.",
    block: "Prevent accidental clicks on page elements while annotating.",
    theme: "Switch between dark and light mode.",
  };

  return (
    <div className="sd-outer">
      <div className="sd-container" ref={containerRef}>
        {/* Settings Panel - exact replica (user clicks disabled, Agentation still works) */}
        <div
          className={`sd-panel ${showPanel ? "visible" : ""} ${isDarkMode ? "dark" : "light"}`}
          onClickCapture={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sd-header">
            <span className="sd-brand">
              <span className="sd-brand-slash" style={{ color: currentColor }}>/</span>
              agentation
            </span>
            <span className="sd-version">v0.3.2</span>
            <button ref={themeToggleRef} className="sd-theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 2V4M12 20V22M4 12H2M22 12H20M5.64 5.64L4.22 4.22M19.78 19.78L18.36 18.36M5.64 18.36L4.22 19.78M19.78 4.22L18.36 5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>

          {/* Output Detail */}
          <div className="sd-section">
            <div className="sd-row">
              <span className="sd-label">
                Output Detail
                <span className="sd-help-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <path d="M12 17h.01"/>
                  </svg>
                </span>
              </span>
              <button ref={cycleBtnRef} className="sd-cycle-btn">
                <span className="sd-cycle-text" key={outputDetail}>{OUTPUT_DETAIL_OPTIONS[outputDetail]}</span>
                <span className="sd-cycle-dots">
                  {OUTPUT_DETAIL_OPTIONS.map((_, i) => (
                    <span key={i} className={`sd-cycle-dot ${outputDetail === i ? "active" : ""}`} />
                  ))}
                </span>
              </button>
            </div>

            {/* React Components */}
            <div className="sd-row sd-row-margin-top">
              <span className="sd-label">
                React Components
                <span className="sd-help-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <path d="M12 17h.01"/>
                  </svg>
                </span>
              </span>
              <label ref={reactToggleRef} className="sd-toggle-switch">
                <input type="checkbox" checked={reactEnabled} readOnly />
                <span className={`sd-toggle-slider ${reactEnabled ? "checked" : ""}`} />
              </label>
            </div>

            {/* Hide Until Restart */}
            <div className="sd-row sd-row-margin-top">
              <span className="sd-label">
                Hide Until Restart
                <span className="sd-help-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <path d="M12 17h.01"/>
                  </svg>
                </span>
              </span>
              <label className="sd-toggle-switch">
                <input type="checkbox" checked={false} readOnly />
                <span className="sd-toggle-slider" />
              </label>
            </div>
          </div>

          {/* Marker Colour */}
          <div className="sd-section">
            <span className="sd-label sd-label-marker">Marker Colour</span>
            <div className="sd-colors">
              {COLOR_OPTIONS.map((color, i) => (
                <div
                  key={color.value}
                  ref={i === 3 ? greenColorRef : undefined}
                  className={`sd-color-ring ${selectedColor === i ? "selected" : ""}`}
                  style={{ borderColor: selectedColor === i ? color.value : "transparent" }}
                >
                  <div
                    className={`sd-color ${selectedColor === i ? "selected" : ""}`}
                    style={{ backgroundColor: color.value }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="sd-section">
            <label className="sd-checkbox-row">
              <span ref={clearCheckboxRef} className={`sd-checkbox ${clearAfterCopy ? "checked" : ""}`}>
                {clearAfterCopy && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="sd-checkbox-label">
                Clear on copy/send
                <span className="sd-help-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <path d="M12 17h.01"/>
                  </svg>
                </span>
              </span>
            </label>
            <label className="sd-checkbox-row sd-checkbox-row-margin-bottom">
              <span ref={blockCheckboxRef} className={`sd-checkbox ${blockInteractions ? "checked" : ""}`}>
                {blockInteractions && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="sd-checkbox-label">Block page interactions</span>
            </label>
          </div>

          {/* Manage Server & Webhooks */}
          <div className="sd-section sd-section-extra-padding">
            <button ref={mcpLinkRef} className="sd-nav-link">
              <span>Manage Server & Webhooks</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Cursor */}
        <div className={`sd-cursor ${isClicking ? "clicking" : ""}`} style={{ left: cursorPos.x, top: cursorPos.y }}>
          <svg height="24" width="24" viewBox="0 0 32 32">
            <g fill="none" fillRule="evenodd" transform="translate(10 7)">
              <path d="m6.148 18.473 1.863-1.003 1.615-.839-2.568-4.816h4.332l-11.379-11.408v16.015l3.316-3.221z" fill="#fff"/>
              <path d="m6.431 17 1.765-.941-2.775-5.202h3.604l-8.025-8.043v11.188l2.53-2.442z" fill="#000"/>
            </g>
          </svg>
        </div>
      </div>

      {/* Caption - outside container like other demos */}
      <p key={activeCaption} style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', whiteSpace: 'pre-line', lineHeight: 1.3, animation: 'fadeIn 0.3s ease' }}>
        {activeCaption ? captions[activeCaption] : captions.output}
      </p>
    </div>
  );
}
