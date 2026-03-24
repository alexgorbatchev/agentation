"use client";

import { useEffect, useRef, useState } from "react";
import { ComponentSourceMenuPreview, type ComponentSourceMenuPreviewItem } from "../../../../agentation/src/components/page-toolbar-css/components/ComponentSourceMenuPreview";
import { PageFeedbackToolbarPreview } from "../../../../agentation/src/components/page-toolbar-css/components/PageFeedbackToolbarPreview";

// Animated demo showing the agentation workflow
// This is purely for documentation - uses visual copies of the real UI

const HERO_COMPONENT_MENU_ITEMS: ComponentSourceMenuPreviewItem[] = [
  {
    displayName: "ActionButton",
    props: ["label", "tone"],
    sourceLabel: "src/components/toolbar/ActionButton.tsx:18",
  },
  {
    displayName: "ActionRow",
    props: ["ctaLabel"],
    sourceLabel: "src/components/toolbar/ActionRow.tsx:44",
  },
  {
    displayName: "ProfileCard",
    props: ["title", "subtitle"],
    sourceLabel: "src/components/ProfileCard.tsx:72",
  },
];

export function HeroDemo(): JSX.Element {
  const [typedText, setTypedText] = useState("");
  const [cursorPos, setCursorPos] = useState({ x: 280, y: 180 });
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isToolbarHovered, setIsToolbarHovered] = useState(false);
  const [isToolbarClicking, setIsToolbarClicking] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showNewMarker, setShowNewMarker] = useState(false);
  const [isCrosshair, setIsCrosshair] = useState(false);
  const [btnPos, setBtnPos] = useState({ x: 20, y: 82, width: 68, height: 33 });

  // New states for extended demo
  const [dragBox, setDragBox] = useState({ visible: false, x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [areaOutline, setAreaOutline] = useState({ visible: false, x: 0, y: 0, width: 0, height: 0 });
  const [showGreenMarker, setShowGreenMarker] = useState(false);
  const [greenMarkerPos, setGreenMarkerPos] = useState({ x: 0, y: 0 });
  const [copyClicked, setCopyClicked] = useState(false);
  const [copyHovered, setCopyHovered] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalText, setTerminalText] = useState("");
  const [popupHeader, setPopupHeader] = useState("button.submit-btn");
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [headerText] = useState("Benji's Dashboard");
  const [textSelection, setTextSelection] = useState({ visible: false, x: 0, y: 0, width: 0 });
  const [showOrangeMarker, setShowOrangeMarker] = useState(false);
  const [orangeMarkerPos, setOrangeMarkerPos] = useState({ x: 0, y: 0 });
  const [isIBeam, setIsIBeam] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedSidebarIcons, setSelectedSidebarIcons] = useState<number[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<number[]>([]);
  const [showComponentMenu, setShowComponentMenu] = useState(false);
  const [componentMenuPos, setComponentMenuPos] = useState({ x: 0, y: 0 });
  const [hoveredComponentMenuIndex, setHoveredComponentMenuIndex] = useState<number | null>(null);
  const [showAltShortcut, setShowAltShortcut] = useState(false);

  const btnRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const timePosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const toolbarContainerRef = useRef<HTMLDivElement>(null);
  const sidebarIconsRef = useRef<HTMLDivElement>(null);
  const componentMenuItemRefs = [
    useRef<HTMLButtonElement>(null),
    useRef<HTMLButtonElement>(null),
    useRef<HTMLButtonElement>(null),
  ];
  const btnPosRef = useRef({ x: 20, y: 82, width: 68, height: 33 });
  const metricsPosRef = useRef({ x: 0, y: 26, width: 175, height: 58 });
  const toolbarPosRef = useRef({ x: 280, y: 210 });
  const sidebarIconsPosRef = useRef({ x: 10, y: 40, width: 24, height: 70 });

  const getRelativeCenter = (element: HTMLElement | null): { x: number; y: number } | null => {
    if (!element || !contentRef.current) {
      return null;
    }

    const elementRect = element.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();

    return {
      x: elementRect.left - contentRect.left + elementRect.width / 2,
      y: elementRect.top - contentRect.top + elementRect.height / 2,
    };
  };

  // Measure element positions
  const measure = (): void => {
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
    if (metricsRef.current && contentRef.current) {
      const metricsRect = metricsRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      // Get first two cards (about 2/3 of the row width)
      const twoCardsWidth = metricsRect.width * 0.72;
      metricsPosRef.current = {
        x: metricsRect.left - contentRect.left,
        y: metricsRect.top - contentRect.top,
        width: twoCardsWidth,
        height: metricsRect.height,
      };
    }
    if (toolbarContainerRef.current && contentRef.current) {
      const toolbarRect = toolbarContainerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      toolbarPosRef.current = {
        x: toolbarRect.left - contentRect.left + toolbarRect.width / 2,
        y: toolbarRect.top - contentRect.top + toolbarRect.height / 2,
      };
    }
    if (sidebarIconsRef.current && contentRef.current) {
      const iconsRect = sidebarIconsRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      sidebarIconsPosRef.current = {
        x: iconsRect.left - contentRect.left,
        y: iconsRect.top - contentRect.top,
        width: iconsRect.width,
        height: iconsRect.height,
      };
    }
    if (timeRef.current && contentRef.current) {
      const timeRect = timeRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      timePosRef.current = {
        x: timeRect.left - contentRect.left,
        y: timeRect.top - contentRect.top,
        width: timeRect.width,
        height: timeRect.height,
      };
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

  useEffect(() => {
    if (!copyButtonRef.current || copyClicked) {
      return;
    }

    copyButtonRef.current.style.background = copyHovered ? "rgba(255, 255, 255, 0.1)" : "transparent";
  }, [copyClicked, copyHovered]);

  const feedbackText1 = "Change to primary style";
  const feedbackText2 = "Add hover states";
  const feedbackText3 = "Make this more prominent";

  // Different terminal output for mobile (metrics instead of sidebar)
  const getTerminalOutput = (mobile: boolean): string => mobile ? `## Page Feedback

### 1. button.export-btn
Change to primary style

### 2. Metrics cards
Add hover states

### 3. "${headerText}"
Make this more prominent` : `## Page Feedback

### 1. button.export-btn
Change to primary style

### 2. Sidebar icons
Add hover states

### 3. "${headerText}"
Make this more prominent`;

  const annotationCount: number =
    2 + Number(showNewMarker) + Number(showGreenMarker) + Number(showOrangeMarker);

  // Animation sequence
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval>;

    const resetState = () => {
      setTypedText("");
      setCursorPos({ x: 400, y: 180 });
      setIsToolbarExpanded(false);
      setIsToolbarHovered(false);
      setIsToolbarClicking(false);
      setShowHighlight(false);
      setShowPopup(false);
      setShowNewMarker(false);
      setIsCrosshair(false);
      setDragBox({ visible: false, x: 0, y: 0, width: 0, height: 0 });
      setIsDragging(false);
      setAreaOutline({ visible: false, x: 0, y: 0, width: 0, height: 0 });
      setShowGreenMarker(false);
      setCopyClicked(false);
      setCopyHovered(false);
      setShowTerminal(false);
      setTerminalText("");
      setPopupHeader("button.submit-btn");
      setPopupPos({ x: 0, y: 0 });
      setTextSelection({ visible: false, x: 0, y: 0, width: 0 });
      setShowOrangeMarker(false);
      setIsIBeam(false);
      setIsMobileView(window.innerWidth <= 640);
      setSelectedSidebarIcons([]);
      setSelectedMetrics([]);
      setShowComponentMenu(false);
      setComponentMenuPos({ x: 0, y: 0 });
      setHoveredComponentMenuIndex(null);
      setShowAltShortcut(false);
    };

    const runAnimation = async () => {
      // Reset state
      resetState();

      // Check if mobile (sidebar hidden below 640px)
      const isMobile = window.innerWidth <= 640;
      setIsMobileView(isMobile);

      if (cancelled) return;
      await delay(600);
      if (cancelled) return;

      // Move cursor to toolbar center (measured position)
      const toolbarPos = toolbarPosRef.current;
      setCursorPos({ x: toolbarPos.x, y: toolbarPos.y });
      await delay(400);
      if (cancelled) return;

      // Hover toolbar
      setIsToolbarHovered(true);
      await delay(300);
      if (cancelled) return;

      // Click toolbar (press down)
      setIsToolbarClicking(true);
      await delay(100);
      if (cancelled) return;

      // Release click and expand
      setIsToolbarClicking(false);
      setIsToolbarHovered(false);
      setIsToolbarExpanded(true);
      await delay(400);
      if (cancelled) return;

      // Switch to crosshair cursor
      setIsCrosshair(true);
      await delay(200);
      if (cancelled) return;

      // Move cursor toward the button center
      const pos = btnPosRef.current;
      setCursorPos({ x: pos.x + pos.width / 2, y: pos.y + pos.height / 2 });
      await delay(500);
      if (cancelled) return;

      // Show hover highlight
      setShowHighlight(true);
      await delay(400);
      if (cancelled) return;

      // Click - hide highlight, show popup near cursor
      setShowHighlight(false);
      await delay(100);
      if (cancelled) return;
      // Position popup below cursor, more to the left to stay in bounds
      const containerWidth = contentRef.current?.offsetWidth || 300;
      const cursorX = pos.x + pos.width / 2;
      const popupX = Math.min(Math.max(100, cursorX - 80), containerWidth - 100);
      setPopupPos({ x: popupX, y: pos.y + pos.height + 7 });
      setShowPopup(true);
      await delay(300);
      if (cancelled) return;

      // Type feedback
      for (let i = 0; i <= feedbackText1.length; i++) {
        if (cancelled) return;
        setTypedText(feedbackText1.slice(0, i));
        await delay(35);
      }
      if (cancelled) return;
      await delay(300);
      if (cancelled) return;

      // Submit - hide popup, show marker
      setShowPopup(false);
      await delay(200);
      if (cancelled) return;
      setShowNewMarker(true);
      await delay(600);
      if (cancelled) return;

      // === ALT + RIGHT-CLICK COMPONENT SOURCE MENU ===
      const componentTargetX = pos.x + pos.width / 2;
      const componentTargetY = pos.y + pos.height / 2;
      const menuContainerWidth = contentRef.current?.offsetWidth || 300;
      const menuX = Math.max(12, Math.min(componentTargetX + 24, menuContainerWidth - 228));
      const menuY = Math.max(18, pos.y - 8);
      const componentMenuItemIndex = 1;

      setIsCrosshair(false);
      setCursorPos({ x: componentTargetX, y: componentTargetY });
      setShowAltShortcut(true);
      setShowHighlight(true);
      await delay(450);
      if (cancelled) return;

      setComponentMenuPos({ x: menuX, y: menuY });
      setShowComponentMenu(true);
      await delay(300);
      if (cancelled) return;

      const componentMenuItemCenter = getRelativeCenter(
        componentMenuItemRefs[componentMenuItemIndex]?.current,
      );
      setCursorPos(
        componentMenuItemCenter || { x: componentTargetX + 72, y: componentTargetY + 80 },
      );
      await delay(220);
      if (cancelled) return;

      setHoveredComponentMenuIndex(componentMenuItemIndex);
      await delay(2000);
      if (cancelled) return;

      setShowComponentMenu(false);
      setHoveredComponentMenuIndex(null);
      setShowHighlight(false);
      setShowAltShortcut(false);
      setIsCrosshair(true);
      await delay(220);
      if (cancelled) return;

      // === DRAG SELECTION ===
      if (!isMobile) {
        // Desktop: Drag over sidebar icons (upwards)
        const sidebarPos = sidebarIconsPosRef.current;
        const dragStartX = sidebarPos.x + sidebarPos.width + 2;
        const dragStartY = sidebarPos.y + sidebarPos.height + 2;
        setCursorPos({ x: dragStartX, y: dragStartY });
        await delay(500);
        if (cancelled) return;

        // Start drag - select the sidebar icons (dragging up)
        setIsDragging(true);
        const dragEndX = sidebarPos.x - 2;
        const dragEndY = sidebarPos.y - 2;
        setDragBox({ visible: true, x: dragStartX, y: dragStartY, width: 0, height: 0 });

        // Animate drag smoothly
        const steps = 16;
        for (let i = 1; i <= steps; i++) {
          if (cancelled) return;
          const progress = i / steps;
          const currentX = dragStartX + (dragEndX - dragStartX) * progress;
          const currentY = dragStartY + (dragEndY - dragStartY) * progress;
          setCursorPos({ x: currentX, y: currentY });
          // Calculate box with positive width/height regardless of drag direction
          setDragBox({
            visible: true,
            x: Math.min(dragStartX, currentX),
            y: Math.min(dragStartY, currentY),
            width: Math.abs(currentX - dragStartX),
            height: Math.abs(currentY - dragStartY),
          });
          // Select icons as they're encompassed (bottom to top: 2, 1, 0)
          if (progress > 0.25) setSelectedSidebarIcons((s) => (s.includes(2) ? s : [...s, 2]));
          if (progress > 0.5) setSelectedSidebarIcons((s) => (s.includes(1) ? s : [...s, 1]));
          if (progress > 0.75) setSelectedSidebarIcons((s) => (s.includes(0) ? s : [...s, 0]));
          await delay(25);
        }
        if (cancelled) return;
        await delay(200);
        if (cancelled) return;

        // Release drag - hide drag box, show area outline
        setIsDragging(false);
        setDragBox({ visible: false, x: 0, y: 0, width: 0, height: 0 });
        setSelectedSidebarIcons([]);
        setAreaOutline({
          visible: true,
          x: Math.min(dragStartX, dragEndX),
          y: Math.min(dragStartY, dragEndY),
          width: Math.abs(dragEndX - dragStartX),
          height: Math.abs(dragEndY - dragStartY),
        });
        setPopupHeader("Sidebar icons");
        setTypedText("");
        // Position popup to the right of the sidebar selection
        setPopupPos({ x: dragEndX + 110, y: (dragStartY + dragEndY) / 2 - 40 });
        setShowPopup(true);
        await delay(300);
        if (cancelled) return;

        // Type second feedback
        for (let i = 0; i <= feedbackText2.length; i++) {
          if (cancelled) return;
          setTypedText(feedbackText2.slice(0, i));
          await delay(35);
        }
        if (cancelled) return;
        await delay(300);
        if (cancelled) return;

        // Submit - hide popup, show green marker at release point
        setShowPopup(false);
        await delay(200);
        if (cancelled) return;
        // Place marker at top-right corner of selection (near cursor end, but not cropped)
        setGreenMarkerPos({ x: dragStartX, y: dragEndY });
        setShowGreenMarker(true);
        await delay(400);
        if (cancelled) return;
      } else {
        // Mobile: Drag over metrics cards (horizontal)
        const metricsPos = metricsPosRef.current;
        const dragStartX = metricsPos.x - 2;
        const dragStartY = metricsPos.y + metricsPos.height / 2;
        setCursorPos({ x: dragStartX, y: dragStartY });
        await delay(400);
        if (cancelled) return;

        // Start drag - select across the metrics cards
        setIsDragging(true);
        const dragEndX = metricsPos.x + metricsPos.width;
        const dragEndY = metricsPos.y + metricsPos.height + 2;
        setDragBox({ visible: true, x: dragStartX, y: metricsPos.y - 2, width: 0, height: 0 });

        // Animate drag smoothly (fewer steps for mobile)
        const steps = 12;
        for (let i = 1; i <= steps; i++) {
          if (cancelled) return;
          const progress = i / steps;
          const currentX = dragStartX + (dragEndX - dragStartX) * progress;
          setCursorPos({ x: currentX, y: dragStartY });
          setDragBox({
            visible: true,
            x: metricsPos.x - 2,
            y: metricsPos.y - 2,
            width: currentX - dragStartX,
            height: metricsPos.height + 4,
          });
          // Select metrics as they're encompassed (left to right: 0, 1, 2)
          if (progress > 0.2) setSelectedMetrics((s) => (s.includes(0) ? s : [...s, 0]));
          if (progress > 0.5) setSelectedMetrics((s) => (s.includes(1) ? s : [...s, 1]));
          if (progress > 0.8) setSelectedMetrics((s) => (s.includes(2) ? s : [...s, 2]));
          await delay(25);
        }
        if (cancelled) return;
        await delay(150);
        if (cancelled) return;

        // Release drag - hide drag box, show area outline
        setIsDragging(false);
        setDragBox({ visible: false, x: 0, y: 0, width: 0, height: 0 });
        setSelectedMetrics([]);
        setAreaOutline({
          visible: true,
          x: metricsPos.x - 2,
          y: metricsPos.y - 2,
          width: metricsPos.width + 2,
          height: metricsPos.height + 4,
        });
        setPopupHeader("Metrics cards");
        setTypedText("");
        // Position popup below the metrics selection
        const containerWidth = contentRef.current?.offsetWidth || 300;
        setPopupPos({ x: Math.min(metricsPos.x + metricsPos.width / 2, containerWidth - 100), y: dragEndY + 7 });
        setShowPopup(true);
        await delay(250);
        if (cancelled) return;

        // Type feedback (short for mobile)
        const mobileDragFeedback = "Add hover states";
        for (let i = 0; i <= mobileDragFeedback.length; i++) {
          if (cancelled) return;
          setTypedText(mobileDragFeedback.slice(0, i));
          await delay(30);
        }
        if (cancelled) return;
        await delay(250);
        if (cancelled) return;

        // Submit - hide popup, show green marker
        setShowPopup(false);
        await delay(150);
        if (cancelled) return;
        setGreenMarkerPos({ x: dragEndX, y: metricsPos.y + metricsPos.height / 2 });
        setShowGreenMarker(true);
        await delay(300);
        if (cancelled) return;
      }

      // === TEXT SELECTION ===
      // Move cursor to the time text
      const timePos = timePosRef.current;
      const textStartX = timePos.x;
      const textEndX = timePos.x + timePos.width;
      const textY = timePos.y + timePos.height / 2;

      // Move to start of text and switch to I-beam cursor
      setIsCrosshair(false);
      setIsIBeam(true);
      setCursorPos({ x: textStartX, y: textY });
      await delay(500);
      if (cancelled) return;

      // Start selection
      setIsDragging(true);
      setTextSelection({ visible: true, x: textStartX, y: timePos.y, width: 0 });

      // Animate text selection across the time
      const textSteps = 12;
      for (let i = 1; i <= textSteps; i++) {
        if (cancelled) return;
        const progress = i / textSteps;
        const currentX = textStartX + (textEndX - textStartX) * progress;
        setCursorPos({ x: currentX, y: textY });
        setTextSelection({ visible: true, x: textStartX, y: timePos.y - 2, width: currentX - textStartX });
        await delay(30);
      }
      if (cancelled) return;
      await delay(200);
      if (cancelled) return;

      // Release selection - show popup
      setIsDragging(false);
      setPopupHeader(`"${headerText}"`);
      setTypedText("");
      // Position popup below the time
      const textPopupX = Math.min(Math.max(100, (textStartX + textEndX) / 2), (contentRef.current?.offsetWidth || 300) - 100);
      setPopupPos({ x: textPopupX, y: timePos.y + timePos.height + 7 });
      setShowPopup(true);
      await delay(300);
      if (cancelled) return;

      // Type third feedback
      const textFeedback = feedbackText3;
      for (let i = 0; i <= textFeedback.length; i++) {
        if (cancelled) return;
        setTypedText(textFeedback.slice(0, i));
        await delay(35);
      }
      if (cancelled) return;
      await delay(300);
      if (cancelled) return;

      // Submit - hide popup, show orange marker
      setShowPopup(false);
      await delay(200);
      if (cancelled) return;
      setOrangeMarkerPos({ x: textEndX + 2, y: timePos.y + timePos.height / 2 });
      setShowOrangeMarker(true);
      setTextSelection({ visible: false, x: 0, y: 0, width: 0 });
      setIsIBeam(false);
      await delay(300);
      if (cancelled) return;

      // === COPY OUTPUT ===

      // Measure copy button position now that toolbar is expanded
      const copyButtonCenter = getRelativeCenter(copyButtonRef.current);

      // Move cursor to copy button
      setCursorPos(copyButtonCenter || { x: 400, y: 222 });
      await delay(350);
      if (cancelled) return;

      // Switch to pointer when hovering copy button
      setIsCrosshair(false);
      setCopyHovered(true);
      await delay(400);
      if (cancelled) return;

      // Click copy button
      setCopyHovered(false);
      setCopyClicked(true);
      await delay(400);
      if (cancelled) return;

      // Show terminal first (empty, just with Claude welcome)
      setShowTerminal(true);
      await delay(600);
      if (cancelled) return;

      // Now "paste" the output - type it quickly to show it appearing
      const terminalOutput = getTerminalOutput(isMobile);
      const lines = terminalOutput.split('\n');
      let currentText = '';
      for (const line of lines) {
        if (cancelled) return;
        currentText += line + '\n';
        setTerminalText(currentText.trim());
        await delay(80);
      }

      // Pause before loop
      if (cancelled) return;
      await delay(800);
      if (cancelled) return;

      // Reset for next loop - close toolbar with terminal for clean restart
      setShowNewMarker(false);
      setShowGreenMarker(false);
      setShowOrangeMarker(false);
      setAreaOutline({ visible: false, x: 0, y: 0, width: 0, height: 0 });
      setCopyClicked(false);
      setCopyHovered(false);
      setShowTerminal(false);
      setIsToolbarExpanded(false);
      setIsCrosshair(false);
      await delay(400);
    };

    const startAnimation = () => {
      cancelled = false;
      runAnimation();
      // Slightly shorter interval on mobile (faster animations, shorter text)
      const loopInterval = window.innerWidth <= 640 ? 17800 : 20000;
      interval = setInterval(runAnimation, loopInterval);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible - cancel current animation and restart fresh
        cancelled = true;
        clearInterval(interval);
        resetState();
        setTimeout(() => {
          startAnimation();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    startAnimation();

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div className="hero-demo-container">
      {/* Browser window */}
      <div className={`hero-demo-browser ${showTerminal ? 'faded' : ''}`}>
        {/* Browser chrome */}
        <div className="hero-demo-browser-bar">
          <div className="hero-demo-dot red" />
          <div className="hero-demo-dot yellow" />
          <div className="hero-demo-dot green" />
          <div className="hero-demo-url-bar">localhost:3000</div>
        </div>

        {/* Fake page content - Stripe dashboard style */}
        <div className="hero-demo-content" ref={contentRef}>
          {/* Sidebar - minimal icons only */}
          <div className="hero-demo-sidebar">
            <div className="hero-demo-sidebar-logo" />
            <div className="hero-demo-sidebar-icons" ref={sidebarIconsRef}>
              <div className={`hero-demo-sidebar-icon ${selectedSidebarIcons.includes(0) ? "selected" : ""}`} />
              <div className={`hero-demo-sidebar-icon active ${selectedSidebarIcons.includes(1) ? "selected" : ""}`} />
              <div className={`hero-demo-sidebar-icon ${selectedSidebarIcons.includes(2) ? "selected" : ""}`} />
            </div>
            <div className="hero-demo-sidebar-bottom">
              <div className="hero-demo-sidebar-icon circle" />
            </div>
          </div>

          {/* Main content */}
          <div className="hero-demo-main">
            {/* Header */}
            <div className="hero-demo-header">
              <div className="hero-demo-header-left">
                <div className="hero-demo-logo" />
                <span className="hero-demo-title-text" ref={timeRef}>{headerText}</span>
              </div>
              <div className="hero-demo-button" ref={btnRef} />
            </div>

            {/* Metrics row */}
            <div className="hero-demo-metrics" ref={metricsRef}>
              <div className={`hero-demo-metric ${selectedMetrics.includes(0) ? "selected" : ""}`}>
                <div className="hero-demo-metric-label" />
                <div className="hero-demo-metric-value" />
              </div>
              <div className={`hero-demo-metric ${selectedMetrics.includes(1) ? "selected" : ""}`}>
                <div className="hero-demo-metric-label" style={{ width: 55 }} />
                <div className="hero-demo-metric-value wide" />
              </div>
              <div className={`hero-demo-metric ${selectedMetrics.includes(2) ? "selected" : ""}`}>
                <div className="hero-demo-metric-label" style={{ width: 38 }} />
                <div className="hero-demo-metric-value" style={{ width: 40 }} />
              </div>
            </div>

            {/* Table */}
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
              containerClassName={`hero-demo-toolbar ${isToolbarExpanded ? "expanded" : "collapsed"} ${
                isToolbarHovered ? "hovered" : ""
              } ${isToolbarClicking ? "clicking" : ""}`}
              containerRef={toolbarContainerRef}
              isActive={isToolbarExpanded}
              annotationCount={annotationCount}
              copied={copyClicked}
              hasSendButton={true}
              hasResolvedAnnotations={false}
              resolvedEndpoint="http://127.0.0.1:4747"
              connectionStatus="connected"
              buttonRefs={{ copy: copyButtonRef }}
            />
          </div>

          {/* Overlays - positioned relative to hero-demo-content */}

          {/* Highlight overlay for button */}
          <div
            className={`hero-demo-button-highlight ${showHighlight ? "visible" : ""}`}
            style={{ top: btnPos.y - 4, left: btnPos.x - 4, width: btnPos.width + 8, height: btnPos.height + 8 }}
          />

          {/* Drag selection box */}
          {dragBox.visible && (
            <div
              className="hero-demo-drag-box"
              style={{ left: dragBox.x, top: dragBox.y, width: dragBox.width, height: dragBox.height }}
            />
          )}

          {/* Area outline - stays visible after drag */}
          <div
            className={`hero-demo-area-outline ${areaOutline.visible ? "visible" : ""}`}
            style={{ left: areaOutline.x, top: areaOutline.y, width: areaOutline.width, height: areaOutline.height }}
          />

          {/* Existing markers */}
          <div className="hero-demo-marker visible" style={{ top: '52px', left: '104px' }}>
            1
          </div>
          <div className="hero-demo-marker visible" style={{ top: '105px', left: '224px' }}>
            2
          </div>

          {/* New marker - appears after annotation */}
          <div className={`hero-demo-marker ${showNewMarker ? "visible" : ""}`} style={{ top: btnPos.y + btnPos.height / 2, left: btnPos.x + btnPos.width / 2 }}>
            3
          </div>

          {/* Green marker for drag selection */}
          <div className={`hero-demo-marker green ${showGreenMarker ? "visible" : ""}`} style={{ top: greenMarkerPos.y, left: greenMarkerPos.x }}>
            4
          </div>

          {/* Text selection highlight */}
          {textSelection.visible && (
            <div
              className="hero-demo-text-selection"
              style={{ left: textSelection.x, top: textSelection.y, width: textSelection.width }}
            />
          )}

          {/* Orange marker for text selection */}
          <div className={`hero-demo-marker orange ${showOrangeMarker ? "visible" : ""}`} style={{ top: orangeMarkerPos.y, left: orangeMarkerPos.x }}>
            5
          </div>

          {/* Alt + right-click shortcut hint */}
          <div
            className={`hero-demo-shortcut-pill ${showAltShortcut ? "visible" : ""}`}
            style={{ left: cursorPos.x + 18, top: cursorPos.y - 20 }}
          >
            Alt + Right click
          </div>

          {/* Component source menu */}
          {showComponentMenu && (
            <ComponentSourceMenuPreview
              items={HERO_COMPONENT_MENU_ITEMS}
              position={componentMenuPos}
              hoveredComponentMenuIndex={hoveredComponentMenuIndex}
              setHoveredComponentMenuIndex={setHoveredComponentMenuIndex}
              className="hero-demo-component-menu"
              itemRefs={componentMenuItemRefs}
            />
          )}

          {/* Popup */}
          <div className={`hero-demo-popup ${showPopup ? "visible" : ""}`} style={{ left: popupPos.x, top: popupPos.y }}>
            <div className="hero-demo-popup-header">{popupHeader}</div>
            <div className="hero-demo-popup-input">
              {typedText}
              <span style={{ opacity: 0.4 }}>|</span>
            </div>
            <div className="hero-demo-popup-actions">
              <div className="hero-demo-popup-btn cancel">Cancel</div>
              <div className={`hero-demo-popup-btn submit ${popupHeader === "Sidebar icons" ? "green" : ""} ${popupHeader.startsWith('"') ? "orange" : ""}`}>Add</div>
            </div>
          </div>

          {/* Cursor */}
          <div
            className={`hero-demo-cursor ${isDragging ? 'dragging' : ''}`}
            style={{ left: cursorPos.x, top: cursorPos.y }}
          >
            <div className={`hero-demo-cursor-pointer ${isCrosshair || isIBeam ? 'hidden' : ''}`}>
              <svg height="24" width="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd" transform="translate(10 7)">
                  <path d="m6.148 18.473 1.863-1.003 1.615-.839-2.568-4.816h4.332l-11.379-11.408v16.015l3.316-3.221z" fill="#fff"/>
                  <path d="m6.431 17 1.765-.941-2.775-5.202h3.604l-8.025-8.043v11.188l2.53-2.442z" fill="#000"/>
                </g>
              </svg>
            </div>
            <div className={`hero-demo-cursor-crosshair ${isCrosshair && !isIBeam ? '' : 'hidden'}`}>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <line x1="8.5" y1="0" x2="8.5" y2="17" stroke="black" strokeWidth="1"/>
                <line x1="0" y1="8.5" x2="17" y2="8.5" stroke="black" strokeWidth="1"/>
              </svg>
            </div>
            <div className={`hero-demo-cursor-ibeam ${isIBeam ? '' : 'hidden'}`}>
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path d="M3 1H7M3 15H7M5 1V15" stroke="black" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal window - Ghostty style overlay */}
      <div className={`hero-demo-terminal ${showTerminal ? "visible" : ""}`}>
        <div className="hero-demo-terminal-bar">
          <div className="hero-demo-terminal-dot red" />
          <div className="hero-demo-terminal-dot yellow" />
          <div className="hero-demo-terminal-dot green" />
          <div className="hero-demo-terminal-title">Benji's Project</div>
        </div>
        <div className="hero-demo-terminal-content">
          <div className="hero-demo-terminal-welcome">
            {/* Claude Code welcome box - pixel-perfect recreation */}
            <svg viewBox="0 0 240 76" fill="none" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {/* Orange box border */}
              <rect x="4" y="4" width="148" height="68" rx="3" stroke="#D97757" strokeWidth="1.5" fill="none" />

              {/* Title to the right of box */}
              <text x="160" y="16" fill="rgba(0,0,0,0.7)" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="500">Claude Code</text>
              <text x="160" y="26" fill="rgba(0,0,0,0.4)" fontSize="7" fontFamily="ui-monospace, SFMono-Regular, monospace">v2.1.14</text>

              {/* Welcome text */}
              <text x="78" y="20" fill="rgba(0,0,0,0.6)" fontSize="8" fontFamily="ui-monospace, SFMono-Regular, monospace" textAnchor="middle">Welcome back Benji!</text>

              {/* Claude bot icon */}
              <g transform="translate(56, 26) scale(0.35)">
                <path d="M104.998 0H20.998V16.2H104.998V0Z" fill="#D77757"/>
                <path d="M34.998 16.1953H20.998V32.3953H34.998V16.1953Z" fill="#D77757"/>
                <rect x="35" y="14.7266" width="56" height="29.4545" fill="black"/>
                <path d="M84 14.7266H42V36.8175H84V14.7266Z" fill="#D77757"/>
                <path d="M105.002 16.1953H91.002V32.3953H105.002V16.1953Z" fill="#D77757"/>
                <path d="M119 32.4023H7V48.6023H119V32.4023Z" fill="#D77757"/>
                <path d="M104.998 48.5977H20.998V64.7977H104.998V48.5977Z" fill="#D77757"/>
                <path d="M35 64.8047H28V81.0047H35V64.8047Z" fill="#D77757"/>
                <path d="M49 64.8047H42V81.0047H49V64.8047Z" fill="#D77757"/>
                <path d="M84 64.8047H77V81.0047H84V64.8047Z" fill="#D77757"/>
                <path d="M98.002 64.8047H91.002V81.0047H98.002V64.8047Z" fill="#D77757"/>
              </g>

              {/* Bottom info */}
              <text x="78" y="62" fill="rgba(0,0,0,0.4)" fontSize="7" fontFamily="ui-monospace, SFMono-Regular, monospace" textAnchor="middle">Opus 4.5 · ~/Code/agentation</text>
            </svg>
          </div>
          {terminalText}
          <span style={{ opacity: 0.4 }}>█</span>
        </div>
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
