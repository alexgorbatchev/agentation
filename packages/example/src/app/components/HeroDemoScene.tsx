import { ComponentSourceMenuPreview } from "../../../../agentation/src/components/page-toolbar-css/components/ComponentSourceMenuPreview";
import { PageFeedbackToolbarPreview } from "../../../../agentation/src/components/page-toolbar-css/components/PageFeedbackToolbarPreview";

import { HERO_COMPONENT_MENU_ITEMS, HERO_HEADER_TEXT } from "./heroDemoConstants";
import type { HeroDemoSceneRefs, HeroDemoSceneState } from "./useHeroDemoTimeline";

type HeroDemoSceneProps = {
  state: HeroDemoSceneState;
  refs: HeroDemoSceneRefs;
};

export function HeroDemoScene({ state, refs }: HeroDemoSceneProps): JSX.Element {
  return (
    <div className="hero-demo-container">
      <div className={`hero-demo-browser ${state.showTerminal ? "faded" : ""}`}>
        <div className="hero-demo-browser-bar">
          <div className="hero-demo-dot red" />
          <div className="hero-demo-dot yellow" />
          <div className="hero-demo-dot green" />
          <div className="hero-demo-url-bar">localhost:3000</div>
        </div>

        <div className="hero-demo-content" ref={refs.contentRef}>
          <div className="hero-demo-sidebar">
            <div className="hero-demo-sidebar-logo" />
            <div className="hero-demo-sidebar-icons" ref={refs.sidebarIconsRef}>
              <div className={`hero-demo-sidebar-icon ${state.selectedSidebarIcons.includes(0) ? "selected" : ""}`} />
              <div
                className={`hero-demo-sidebar-icon active ${state.selectedSidebarIcons.includes(1) ? "selected" : ""}`}
              />
              <div className={`hero-demo-sidebar-icon ${state.selectedSidebarIcons.includes(2) ? "selected" : ""}`} />
            </div>
            <div className="hero-demo-sidebar-bottom">
              <div className="hero-demo-sidebar-icon circle" />
            </div>
          </div>

          <div className="hero-demo-main">
            <div className="hero-demo-header">
              <div className="hero-demo-header-left">
                <div className="hero-demo-logo" />
                <span className="hero-demo-title-text" ref={refs.timeRef}>
                  {HERO_HEADER_TEXT}
                </span>
              </div>
              <div className="hero-demo-button" ref={refs.btnRef} />
            </div>

            <div className="hero-demo-metrics" ref={refs.metricsRef}>
              <div className={`hero-demo-metric ${state.selectedMetrics.includes(0) ? "selected" : ""}`}>
                <div className="hero-demo-metric-label" />
                <div className="hero-demo-metric-value" />
              </div>
              <div className={`hero-demo-metric ${state.selectedMetrics.includes(1) ? "selected" : ""}`}>
                <div className="hero-demo-metric-label" style={{ width: 55 }} />
                <div className="hero-demo-metric-value wide" />
              </div>
              <div className={`hero-demo-metric ${state.selectedMetrics.includes(2) ? "selected" : ""}`}>
                <div className="hero-demo-metric-label" style={{ width: 38 }} />
                <div className="hero-demo-metric-value" style={{ width: 40 }} />
              </div>
            </div>

            <div className="hero-demo-table">
              <div className="hero-demo-table-header">
                <div className="hero-demo-th" style={{ width: 60 }} />
                <div className="hero-demo-th" style={{ width: 45 }} />
                <div className="hero-demo-th" style={{ width: 40 }} />
              </div>
              <div className="hero-demo-table-row">
                <div className="hero-demo-td" style={{ width: 70 }} />
                <div className="hero-demo-td" style={{ width: 50 }} />
                <div className="hero-demo-td-pill" />
              </div>
              <div className="hero-demo-table-row">
                <div className="hero-demo-td" style={{ width: 55 }} />
                <div className="hero-demo-td" style={{ width: 42 }} />
                <div className="hero-demo-td-pill" style={{ width: 42 }} />
              </div>
              <div className="hero-demo-table-row">
                <div className="hero-demo-td" style={{ width: 62 }} />
                <div className="hero-demo-td" style={{ width: 38 }} />
                <div className="hero-demo-td-pill" />
              </div>
            </div>

            <PageFeedbackToolbarPreview
              className="hero-demo-toolbar-shell"
              containerClassName={`hero-demo-toolbar ${state.isToolbarExpanded ? "expanded" : "collapsed"} ${
                state.isToolbarHovered ? "hovered" : ""
              } ${state.isToolbarClicking ? "clicking" : ""}`}
              containerRef={refs.toolbarContainerRef}
              isActive={state.isToolbarExpanded}
              annotationCount={state.annotationCount}
              copied={state.copyClicked}
              hasSendButton={true}
              hasResolvedAnnotations={false}
              resolvedEndpoint="http://127.0.0.1:4747"
              connectionStatus="connected"
              buttonRefs={{ copy: refs.copyButtonRef }}
              interactive={false}
            />
          </div>

          <div
            className={`hero-demo-button-highlight ${state.showHighlight ? "visible" : ""}`}
            style={{
              top: state.btnPos.y - 4,
              left: state.btnPos.x - 4,
              width: state.btnPos.width + 8,
              height: state.btnPos.height + 8,
            }}
          />

          {state.dragBox.visible && (
            <div
              className="hero-demo-drag-box"
              style={{
                left: state.dragBox.x,
                top: state.dragBox.y,
                width: state.dragBox.width,
                height: state.dragBox.height,
              }}
            />
          )}

          <div
            className={`hero-demo-area-outline ${state.areaOutline.visible ? "visible" : ""}`}
            style={{
              left: state.areaOutline.x,
              top: state.areaOutline.y,
              width: state.areaOutline.width,
              height: state.areaOutline.height,
            }}
          />

          <div className="hero-demo-marker visible" style={{ top: "52px", left: "104px" }}>
            1
          </div>
          <div className="hero-demo-marker visible" style={{ top: "105px", left: "224px" }}>
            2
          </div>

          <div
            className={`hero-demo-marker ${state.showNewMarker ? "visible" : ""}`}
            style={{ top: state.btnPos.y + state.btnPos.height / 2, left: state.btnPos.x + state.btnPos.width / 2 }}
          >
            3
          </div>

          <div
            className={`hero-demo-marker green ${state.showGreenMarker ? "visible" : ""}`}
            style={{ top: state.greenMarkerPos.y, left: state.greenMarkerPos.x }}
          >
            4
          </div>

          {state.textSelection.visible && (
            <div
              className="hero-demo-text-selection"
              style={{
                left: state.textSelection.x,
                top: state.textSelection.y,
                width: state.textSelection.width,
              }}
            />
          )}

          <div
            className={`hero-demo-marker orange ${state.showOrangeMarker ? "visible" : ""}`}
            style={{ top: state.orangeMarkerPos.y, left: state.orangeMarkerPos.x }}
          >
            5
          </div>

          <div
            className={`hero-demo-shortcut-pill ${state.showAltShortcut ? "visible" : ""}`}
            style={{ left: state.cursorPos.x + 18, top: state.cursorPos.y - 20 }}
          >
            Alt + Right click
          </div>

          {state.showComponentMenu && (
            <ComponentSourceMenuPreview
              items={HERO_COMPONENT_MENU_ITEMS}
              position={state.componentMenuPos}
              hoveredComponentMenuIndex={state.hoveredComponentMenuIndex}
              setHoveredComponentMenuIndex={(): void => undefined}
              className="hero-demo-component-menu"
              itemRefs={refs.componentMenuItemRefs}
              interactive={false}
            />
          )}

          <div
            className={`hero-demo-popup ${state.showPopup ? "visible" : ""}`}
            style={{ left: state.popupPos.x, top: state.popupPos.y }}
          >
            <div className="hero-demo-popup-header">{state.popupHeader}</div>
            <div className="hero-demo-popup-input">
              {state.typedText}
              <span style={{ opacity: 0.4 }}>|</span>
            </div>
            <div className="hero-demo-popup-actions">
              <div className="hero-demo-popup-btn cancel">Cancel</div>
              <div
                className={`hero-demo-popup-btn submit ${
                  state.popupHeader === "Sidebar icons" ? "green" : ""
                } ${state.popupHeader.startsWith('"') ? "orange" : ""}`}
              >
                Add
              </div>
            </div>
          </div>

          <div className={`hero-demo-cursor ${state.isDragging ? "dragging" : ""}`} style={{ left: state.cursorPos.x, top: state.cursorPos.y }}>
            <div className={`hero-demo-cursor-pointer ${state.isCrosshair || state.isIBeam ? "hidden" : ""}`}>
              <svg height="24" width="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd" transform="translate(10 7)">
                  <path d="m6.148 18.473 1.863-1.003 1.615-.839-2.568-4.816h4.332l-11.379-11.408v16.015l3.316-3.221z" fill="#fff" />
                  <path d="m6.431 17 1.765-.941-2.775-5.202h3.604l-8.025-8.043v11.188l2.53-2.442z" fill="#000" />
                </g>
              </svg>
            </div>
            <div className={`hero-demo-cursor-crosshair ${state.isCrosshair && !state.isIBeam ? "" : "hidden"}`}>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <line x1="8.5" y1="0" x2="8.5" y2="17" stroke="black" strokeWidth="1" />
                <line x1="0" y1="8.5" x2="17" y2="8.5" stroke="black" strokeWidth="1" />
              </svg>
            </div>
            <div className={`hero-demo-cursor-ibeam ${state.isIBeam ? "" : "hidden"}`}>
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path d="M3 1H7M3 15H7M5 1V15" stroke="black" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className={`hero-demo-terminal ${state.showTerminal ? "visible" : ""}`}>
        <div className="hero-demo-terminal-bar">
          <div className="hero-demo-terminal-dot red" />
          <div className="hero-demo-terminal-dot yellow" />
          <div className="hero-demo-terminal-dot green" />
          <div className="hero-demo-terminal-title">Benji's Project</div>
        </div>
        <div className="hero-demo-terminal-content">
          <div className="hero-demo-terminal-welcome">
            <svg viewBox="0 0 240 76" fill="none" style={{ width: "100%", height: "auto", display: "block" }}>
              <rect x="4" y="4" width="148" height="68" rx="3" stroke="#D97757" strokeWidth="1.5" fill="none" />
              <text x="160" y="16" fill="rgba(0,0,0,0.7)" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="500">
                Claude Code
              </text>
              <text x="160" y="26" fill="rgba(0,0,0,0.4)" fontSize="7" fontFamily="ui-monospace, SFMono-Regular, monospace">
                v2.1.14
              </text>
              <text x="78" y="20" fill="rgba(0,0,0,0.6)" fontSize="8" fontFamily="ui-monospace, SFMono-Regular, monospace" textAnchor="middle">
                Welcome back Benji!
              </text>
              <g transform="translate(56, 26) scale(0.35)">
                <path d="M104.998 0H20.998V16.2H104.998V0Z" fill="#D77757" />
                <path d="M34.998 16.1953H20.998V32.3953H34.998V16.1953Z" fill="#D77757" />
                <rect x="35" y="14.7266" width="56" height="29.4545" fill="black" />
                <path d="M84 14.7266H42V36.8175H84V14.7266Z" fill="#D77757" />
                <path d="M105.002 16.1953H91.002V32.3953H105.002V16.1953Z" fill="#D77757" />
                <path d="M119 32.4023H7V48.6023H119V32.4023Z" fill="#D77757" />
                <path d="M104.998 48.5977H20.998V64.7977H104.998V48.5977Z" fill="#D77757" />
                <path d="M35 64.8047H28V81.0047H35V64.8047Z" fill="#D77757" />
                <path d="M49 64.8047H42V81.0047H49V64.8047Z" fill="#D77757" />
                <path d="M84 64.8047H77V81.0047H84V64.8047Z" fill="#D77757" />
                <path d="M98.002 64.8047H91.002V81.0047H98.002V64.8047Z" fill="#D77757" />
              </g>
              <text x="78" y="62" fill="rgba(0,0,0,0.4)" fontSize="7" fontFamily="ui-monospace, SFMono-Regular, monospace" textAnchor="middle">
                Opus 4.5 · ~/Code/agentation
              </text>
            </svg>
          </div>
          {state.terminalText}
          <span style={{ opacity: 0.4 }}>█</span>
        </div>
      </div>
    </div>
  );
}
