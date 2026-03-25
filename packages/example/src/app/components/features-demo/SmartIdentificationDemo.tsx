"use client";

import { useRef, useState, type RefObject } from "react";

import { useDemoAnimationLoop } from "./useDemoAnimationLoop";
import "../FeaturesDemo.css";

export function SmartIdentificationDemo(): JSX.Element {
  const [cursorPos, setCursorPos] = useState({ x: 100, y: 80 });
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [activeCaption, setActiveCaption] = useState("button");
  const [showLabel, setShowLabel] = useState(false);
  const [labelPos, setLabelPos] = useState({ x: 0, y: 0, below: false });

  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const getElementPosition = (ref: RefObject<HTMLElement>, preferBelow = false) => {
    if (!ref.current || !contentRef.current) return null;
    const contentRect = contentRef.current.getBoundingClientRect();
    const rect = ref.current.getBoundingClientRect();

    const cursorX = rect.left - contentRect.left + 14;
    const cursorY = rect.top - contentRect.top + 14;

    // Clamp labelX to stay within bounds (with generous padding for label width)
    const rawLabelX = rect.left - contentRect.left + rect.width / 2;
    const labelX = Math.max(70, Math.min(rawLabelX, contentRect.width - 70));

    // Check if we have room above, otherwise put below
    const spaceAbove = rect.top - contentRect.top;
    const below = preferBelow || spaceAbove < 30;
    const labelY = below
      ? Math.min(rect.bottom - contentRect.top + 8, contentRect.height - 30)
      : Math.max(rect.top - contentRect.top - 8, 30);

    return { cursorX, cursorY, labelX, labelY, below };
  };

  const resetDemo = (): void => {
    setCursorPos({ x: 100, y: 80 });
    setActiveElement(null);
    setShowLabel(false);
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

        setShowLabel(false);
        setActiveElement(null);
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
        setShowLabel(true);

        if (!(await wait(duration))) {
          return;
        }

        setShowLabel(false);
        setActiveElement(null);
        await wait(60);
      };

      resetDemo();

      if (!(await wait(400))) {
        return;
      }

      await hoverElement("button", buttonRef, true);
      if (isCancelled()) {
        return;
      }

      await hoverElement("link", linkRef, true);
      if (isCancelled()) {
        return;
      }

      await hoverElement("heading", headingRef, true);
      if (isCancelled()) {
        return;
      }

      await hoverElement("image", imageRef);
      if (isCancelled()) {
        return;
      }

      await hoverElement("input", inputRef);
      if (isCancelled()) {
        return;
      }

      await hoverElement("card", cardRef);
      if (isCancelled()) {
        return;
      }

      await wait(500);
    },
    { intervalMs: 14000, onVisibilityRestart: resetDemo },
  );

  const labels: Record<string, string> = {
    button: "button.Follow",
    link: "a.benji.org",
    heading: "h3.Benji Taylor",
    image: "img[alt=\"avatar\"]",
    input: "input[placeholder]",
    card: ".header-banner",
  };

  const captions: Record<string, string> = {
    button: "Buttons and links are named by their text content.",
    link: "Buttons and links are named by their text content.",
    heading: "Headings are identified by their content.",
    image: "Images use alt text or src filename.",
    input: "Inputs use labels or placeholder text.",
    card: "Other elements use class names or IDs.",
  };

  return (
    <div className="fd-container">
      <div className="demo-window sid-demo">
        <div className="demo-browser-bar">
          <div className="demo-dot" />
          <div className="demo-dot" />
          <div className="demo-dot" />
          <div className="demo-url">localhost:3000/@benjitaylor</div>
        </div>

        <div className="demo-content sid-page" ref={contentRef}>
          {/* Banner */}
          <div ref={cardRef} className={`sid-banner ${activeElement === "card" ? "hovered" : ""}`} />

          {/* Avatar overlapping banner */}
          <img
            ref={imageRef}
            src="/demo-avatar.png"
            alt="avatar"
            className={`sid-avatar ${activeElement === "image" ? "hovered" : ""}`}
          />

          {/* Follow button */}
          <button ref={buttonRef} className={`sid-follow-btn ${activeElement === "button" ? "hovered" : ""}`}>
            Follow
          </button>

          {/* Profile info */}
          <div className="sid-profile-info">
            <h3 ref={headingRef} className={`sid-name ${activeElement === "heading" ? "hovered" : ""}`}>
              Benji Taylor
            </h3>
            <span className="sid-handle">@benjitaylor</span>
            <p className="sid-bio">head of design <span className="sid-mention">@base</span>. founder <span className="sid-mention">@family</span> (acq by <span className="sid-mention">@aave</span>). tools <span className="sid-mention">@dip</span>.</p>
            <div className="sid-meta">
              <span className="sid-location">Los Angeles, CA</span>
              <a ref={linkRef} className={`sid-link ${activeElement === "link" ? "hovered" : ""}`}>
                benji.org
              </a>
            </div>
            <div className="sid-stats">
              <span><strong>394</strong> Following</span>
              <span><strong>28.3K</strong> Followers</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="sid-tabs">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search posts"
              className={`sid-search ${activeElement === "input" ? "hovered" : ""}`}
              readOnly
            />
          </div>

          {/* Label */}
          {showLabel && activeElement && (
            <div
              className={`sid-label ${labelPos.below ? "below" : "above"}`}
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
