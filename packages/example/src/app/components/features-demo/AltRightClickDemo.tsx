"use client";

import { useRef, useState } from "react";

import { useDemoAnimationLoop } from "./useDemoAnimationLoop";
import { useMeasureOnResize } from "./useMeasureOnResize";
import {
  HERO_COMPONENT_MENU_ITEMS,
  HERO_COMPONENT_MENU_MAX_WIDTH,
  HERO_COMPONENT_MENU_SCALE,
} from "../heroDemoConstants";
import { ComponentSourceMenuPreview } from "../hero-demo/ComponentSourceMenuPreview";
import { PageFeedbackToolbarPreview } from "../hero-demo/PageFeedbackToolbarPreview";
import "../FeaturesDemo.css";

type Point = {
  x: number;
  y: number;
};

type Bounds = Point & {
  width: number;
  height: number;
};

const DEFAULT_BUTTON_POS: Bounds = { x: 208, y: 140, width: 118, height: 32 };
const DEFAULT_MENU_POS: Point = { x: 140, y: 92 };

export function AltRightClickDemo(): JSX.Element {
  const [cursorPos, setCursorPos] = useState<Point>({ x: 320, y: 48 });
  const [buttonPos, setButtonPos] = useState<Bounds>(DEFAULT_BUTTON_POS);
  const [menuPos, setMenuPos] = useState<Point>(DEFAULT_MENU_POS);
  const [isHighlightVisible, setIsHighlightVisible] = useState(false);
  const [isShortcutVisible, setIsShortcutVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [hoveredComponentMenuIndex, setHoveredComponentMenuIndex] = useState<number | null>(null);

  const buttonRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonPosRef = useRef<Bounds>(DEFAULT_BUTTON_POS);

  const measure = (): void => {
    if (!buttonRef.current || !contentRef.current) {
      return;
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const nextButtonPos: Bounds = {
      x: buttonRect.left - contentRect.left,
      y: buttonRect.top - contentRect.top,
      width: buttonRect.width,
      height: buttonRect.height,
    };

    buttonPosRef.current = nextButtonPos;
    setButtonPos(nextButtonPos);
  };

  useMeasureOnResize({ measure });

  const getMenuPosition = (nextButtonPos: Bounds): Point => {
    const contentWidth = contentRef.current?.offsetWidth ?? 360;
    const menuWidth = Math.ceil(HERO_COMPONENT_MENU_MAX_WIDTH * HERO_COMPONENT_MENU_SCALE.desktop);
    const targetX = nextButtonPos.x + nextButtonPos.width / 2;

    return {
      x: Math.max(12, Math.min(targetX + 24, contentWidth - menuWidth)),
      y: Math.max(18, nextButtonPos.y - 8),
    };
  };

  const resetDemo = (): void => {
    setCursorPos({ x: 320, y: 48 });
    setMenuPos(DEFAULT_MENU_POS);
    setIsHighlightVisible(false);
    setIsShortcutVisible(false);
    setIsMenuVisible(false);
    setHoveredComponentMenuIndex(null);
  };

  useDemoAnimationLoop(
    async ({ wait }) => {
      resetDemo();

      if (!(await wait(600))) {
        return;
      }

      measure();
      const nextButtonPos = buttonPosRef.current;
      const buttonCenter: Point = {
        x: nextButtonPos.x + nextButtonPos.width / 2,
        y: nextButtonPos.y + nextButtonPos.height / 2,
      };

      setCursorPos(buttonCenter);
      if (!(await wait(420))) {
        return;
      }

      setIsHighlightVisible(true);
      setIsShortcutVisible(true);
      if (!(await wait(500))) {
        return;
      }

      const nextMenuPos = getMenuPosition(nextButtonPos);
      setMenuPos(nextMenuPos);
      setIsMenuVisible(true);
      if (!(await wait(240))) {
        return;
      }

      setCursorPos({ x: nextMenuPos.x + 132, y: nextMenuPos.y + 84 });
      setHoveredComponentMenuIndex(1);
      if (!(await wait(2100))) {
        return;
      }

      setIsMenuVisible(false);
      setHoveredComponentMenuIndex(null);
      setIsShortcutVisible(false);
      setIsHighlightVisible(false);
      await wait(260);
    },
    { intervalMs: 6200, onVisibilityRestart: resetDemo },
  );

  return (
    <div className="demo-window">
      <div className="demo-browser-bar">
        <div className="demo-dot" />
        <div className="demo-dot" />
        <div className="demo-dot" />
        <div className="demo-url">localhost:3000/dashboard</div>
      </div>

      <div className="demo-content" ref={contentRef}>
        <div className="ecd-faux-title" />
        <div className="ecd-plan-card ard-plan-card">
          <div className="ecd-plan-header">
            <div>
              <div className="ecd-faux-badge" />
            </div>
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
              <div className="ecd-faux-text" style={{ width: 58 }} />
            </div>
            <div className="ecd-feature">
              <div className="ecd-faux-check" />
              <div className="ecd-faux-text" style={{ width: 74 }} />
            </div>
            <div className="ecd-feature disabled">
              <div className="ecd-faux-x" />
              <div className="ecd-faux-text" style={{ width: 92 }} />
            </div>
          </div>

          <div className="ard-action-row">
            <div className="ard-secondary-button" />
            <div className="ard-export-button" ref={buttonRef}>
              Export
            </div>
          </div>
        </div>

        <div
          className={`ecd-highlight ${isHighlightVisible ? "visible" : ""}`}
          style={{
            top: buttonPos.y - 4,
            left: buttonPos.x - 4,
            width: buttonPos.width + 8,
            height: buttonPos.height + 8,
          }}
        />

        <div
          className={`ard-shortcut-pill ${isShortcutVisible ? "visible" : ""}`}
          style={{ left: cursorPos.x + 18, top: cursorPos.y - 20 }}
        >
          Alt + Right click
        </div>

        {isMenuVisible && (
          <ComponentSourceMenuPreview
            items={HERO_COMPONENT_MENU_ITEMS}
            position={menuPos}
            hoveredComponentMenuIndex={hoveredComponentMenuIndex}
            setHoveredComponentMenuIndex={setHoveredComponentMenuIndex}
            className="ard-component-menu"
            style={{ transform: `scale(${HERO_COMPONENT_MENU_SCALE.desktop})`, transformOrigin: "top left" }}
            interactive={false}
          />
        )}

        <div className="demo-cursor" style={{ left: cursorPos.x, top: cursorPos.y }}>
          <div className="demo-cursor-pointer">
            <svg height="24" width="24" viewBox="0 0 32 32">
              <g fill="none" fillRule="evenodd" transform="translate(10 7)">
                <path
                  d="m6.148 18.473 1.863-1.003 1.615-.839-2.568-4.816h4.332l-11.379-11.408v16.015l3.316-3.221z"
                  fill="#fff"
                />
                <path
                  d="m6.431 17 1.765-.941-2.775-5.202h3.604l-8.025-8.043v11.188l2.53-2.442z"
                  fill="#000"
                />
              </g>
            </svg>
          </div>
        </div>

        <PageFeedbackToolbarPreview
          className="ard-toolbar-shell"
          containerClassName="ard-toolbar-container"
          style={{ left: 124, bottom: 14 }}
          isActive={true}
          annotationCount={2}
          copied={false}
          hasSendButton={true}
          hasResolvedAnnotations={false}
          resolvedEndpoint="http://127.0.0.1:4747"
          connectionStatus="connected"
          interactive={false}
        />
      </div>
    </div>
  );
}
