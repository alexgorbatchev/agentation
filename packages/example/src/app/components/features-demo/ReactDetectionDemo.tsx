"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";

import { useDemoAnimationLoop } from "./useDemoAnimationLoop";
import "../FeaturesDemo.css";

export function ReactDetectionDemo(): JSX.Element {
  const [cursorPos, setCursorPos] = useState({ x: 100, y: 80 });
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [activeCaption, setActiveCaption] = useState("button");
  const [showLabel, setShowLabel] = useState(false);
  const [labelExiting, setLabelExiting] = useState(false);
  const [labelPos, setLabelPos] = useState({ x: 0, y: 0, below: false });

  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const navItemRef = useRef<HTMLDivElement>(null);
  const sidebarItemRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const getElementPosition = (ref: RefObject<HTMLElement>, preferBelow = false) => {
    if (!ref.current || !contentRef.current) return null;
    const contentRect = contentRef.current.getBoundingClientRect();
    const rect = ref.current.getBoundingClientRect();

    // Center cursor on element
    const cursorX = rect.left - contentRect.left + rect.width / 2;
    const cursorY = rect.top - contentRect.top + rect.height / 2;

    // Clamp labelX to stay within bounds (labels are ~180px wide, centered)
    const rawLabelX = rect.left - contentRect.left + rect.width / 2;
    const labelX = Math.max(100, Math.min(rawLabelX, contentRect.width - 100));

    // Check if we have room above, otherwise put below
    const spaceAbove = rect.top - contentRect.top;
    const below = preferBelow || spaceAbove < 35;
    const labelY = below
      ? Math.min(rect.bottom - contentRect.top + 10, contentRect.height - 30)
      : Math.max(rect.top - contentRect.top - 10, 30);

    return { cursorX, cursorY, labelX, labelY, below };
  };

  const resetDemo = (): void => {
    setCursorPos({ x: 100, y: 80 });
    setActiveElement(null);
    setShowLabel(false);
    setLabelExiting(false);
  };

  useDemoAnimationLoop(
    async ({ isCancelled, wait }) => {
      const hoverElement = async (
        element: string,
        ref: RefObject<HTMLElement>,
        preferBelow = false,
        duration: number = 1600,
      ): Promise<void> => {
        if (isCancelled()) {
          return;
        }

        setActiveCaption(element);

        const pos = getElementPosition(ref, preferBelow);
        if (!pos) {
          return;
        }

        setCursorPos({ x: pos.cursorX, y: pos.cursorY });

        if (!(await wait(400))) {
          return;
        }

        setActiveElement(element);
        setLabelPos({ x: pos.labelX, y: pos.labelY, below: pos.below });
        setLabelExiting(false);
        setShowLabel(true);

        if (!(await wait(duration))) {
          return;
        }

        setLabelExiting(true);
        if (!(await wait(150))) {
          return;
        }

        setShowLabel(false);
        setActiveElement(null);
        setLabelExiting(false);
      };

      resetDemo();

      if (!(await wait(400))) {
        return;
      }

      await hoverElement("button", buttonRef, true);
      if (isCancelled()) {
        return;
      }

      await hoverElement("navItem", navItemRef, true);
      if (isCancelled()) {
        return;
      }

      await hoverElement("sidebarItem", sidebarItemRef);
      if (isCancelled()) {
        return;
      }

      await hoverElement("card", cardRef);
      if (isCancelled()) {
        return;
      }

      await wait(500);
    },
    { intervalMs: 11000, onVisibilityRestart: resetDemo },
  );

  const labels: Record<string, ReactNode> = {
    button: <><span className="rdd-bracket">&lt;</span>App<span className="rdd-bracket">&gt;</span> <span className="rdd-bracket">&lt;</span>Header<span className="rdd-bracket">&gt;</span> <span className="rdd-bracket">&lt;</span>Button<span className="rdd-bracket">&gt;</span></>,
    navItem: <><span className="rdd-bracket">&lt;</span>App<span className="rdd-bracket">&gt;</span> <span className="rdd-bracket">&lt;</span>Header<span className="rdd-bracket">&gt;</span> <span className="rdd-bracket">&lt;</span>NavLink<span className="rdd-bracket">&gt;</span></>,
    sidebarItem: <><span className="rdd-bracket">&lt;</span>App<span className="rdd-bracket">&gt;</span> <span className="rdd-bracket">&lt;</span>Sidebar<span className="rdd-bracket">&gt;</span> <span className="rdd-bracket">&lt;</span>MenuItem<span className="rdd-bracket">&gt;</span></>,
    card: <><span className="rdd-bracket">&lt;</span>App<span className="rdd-bracket">&gt;</span> <span className="rdd-bracket">&lt;</span>Dashboard<span className="rdd-bracket">&gt;</span> <span className="rdd-bracket">&lt;</span>Card<span className="rdd-bracket">&gt;</span></>,
  };

  const captions: Record<string, string> = {
    button: "Hover over any element to see its React component hierarchy.",
    navItem: "Navigate through components to understand structure.",
    sidebarItem: "Sidebar items show their own component tree.",
    card: "Dashboard cards are detected with their full path.",
  };

  return (
    <div className="fd-container">
      <div className="demo-window rdd-demo">
        <div className="demo-browser-bar">
          <div className="demo-dot" />
          <div className="demo-dot" />
          <div className="demo-dot" />
          <div className="demo-url">localhost:3000/dashboard</div>
        </div>

        <div className="demo-content rdd-page" ref={contentRef}>
          {/* Faux dashboard UI */}
          <div className="rdd-header">
            <div className="rdd-logo" />
            <div className="rdd-nav">
              <div ref={navItemRef} className={`rdd-nav-item active ${activeElement === "navItem" ? "hovered" : ""}`} />
              <div className="rdd-nav-item" />
              <div className="rdd-nav-item" />
            </div>
            <div ref={buttonRef} className={`rdd-btn ${activeElement === "button" ? "hovered" : ""}`} />
          </div>

          <div className="rdd-content-area">
            <div className="rdd-sidebar">
              <div ref={sidebarItemRef} className={`rdd-sidebar-item ${activeElement === "sidebarItem" ? "hovered" : ""}`} />
              <div className="rdd-sidebar-item" />
              <div className="rdd-sidebar-item" />
            </div>
            <div className="rdd-main">
              <div ref={cardRef} className={`rdd-card ${activeElement === "card" ? "hovered" : ""}`} />
              <div className="rdd-card" />
            </div>
          </div>

          {/* Label */}
          {showLabel && activeElement && (
            <div
              className={`rdd-label ${labelPos.below ? "below" : "above"} ${labelExiting ? "exiting" : ""}`}
              style={{ left: labelPos.x, top: labelPos.y }}
            >
              {labels[activeElement]}
            </div>
          )}

          {/* Cursor - crosshair since we're in annotation mode */}
          <div className="demo-cursor" style={{ left: cursorPos.x, top: cursorPos.y }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <line x1="8.5" y1="0" x2="8.5" y2="17" stroke="black" strokeWidth="1"/>
              <line x1="0" y1="8.5" x2="17" y2="8.5" stroke="black" strokeWidth="1"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p key={activeCaption} style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', lineHeight: 1.5, animation: 'fadeIn 0.3s ease' }}>
        {captions[activeCaption]}
      </p>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
