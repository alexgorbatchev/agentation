"use client";

import { useEffect, useId, useRef, useState, type JSX } from "react";
import { motion, useAnimate, type AnimationSequence } from "framer-motion";

interface ICopyablePackageManagerProps {
  name: string;
  command: string;
}

export function CopyablePackageManager({ name, command }: ICopyablePackageManagerProps): JSX.Element {
  const [copied, setCopied] = useState(false);
  const [scope, animate] = useAnimate();
  const maskId = useId();
  const isFirstRender = useRef(true);
  const hasAnimatedIn = useRef(false);
  const inAnimation = useRef<ReturnType<typeof animate> | null>(null);
  const outAnimation = useRef<ReturnType<typeof animate> | null>(null);

  const inSequence: AnimationSequence = [
    [
      '[data-part="square-front"]',
      { y: [0, -4] },
      { duration: 0.12, ease: "easeOut" },
    ],
    [
      '[data-part="square-back"]',
      { x: [0, -4] },
      { at: "<", duration: 0.12, ease: "easeOut" },
    ],
    [
      '[data-part="square-front"], [data-part="square-back"]',
      {
        rx: [2, 7.25],
        width: [10.5, 14.5],
        height: [10.5, 14.5],
        rotate: [0, -45],
      },
      { at: "<", duration: 0.12, ease: "easeOut" },
    ],
    [
      '[data-part="check"]',
      { opacity: [0, 1], pathOffset: [1, 0] },
      { at: "-0.03", duration: 0 },
    ],
    ['[data-part="check"]', { pathLength: [0, 1] }, { duration: 0.1 }],
  ];

  const outSequence: AnimationSequence = [
    [
      '[data-part="check"]',
      { pathOffset: [0, 1] },
      { duration: 0.1, ease: "easeOut" },
    ],
    [
      '[data-part="check"]',
      { opacity: [1, 0], pathLength: [1, 0] },
      { duration: 0 },
    ],
    [
      '[data-part="square-front"], [data-part="square-back"]',
      {
        rx: [7.25, 2],
        width: [14.5, 10.5],
        height: [14.5, 10.5],
        rotate: [-45, 0],
      },
      { at: "+0.03", duration: 0.12, ease: "easeOut" },
    ],
    [
      '[data-part="square-front"]',
      { y: [-4, 0] },
      { at: "<", duration: 0.12, ease: "easeOut" },
    ],
    [
      '[data-part="square-back"]',
      { x: [-4, 0] },
      { at: "<", duration: 0.12, ease: "easeOut" },
    ],
  ];

  async function animateIn(): Promise<void> {
    if (!inAnimation.current && !outAnimation.current && !hasAnimatedIn.current) {
      const animation = animate(inSequence);
      inAnimation.current = animation;
      await animation;
      inAnimation.current = null;

      if (animation.speed === 1) {
        hasAnimatedIn.current = true;
      }

      return;
    }

    if (outAnimation.current) {
      outAnimation.current.speed = -1;
      return;
    }

    if (inAnimation.current) {
      inAnimation.current.speed = 1;
    }
  }

  async function animateOut(): Promise<void> {
    if (inAnimation.current) {
      inAnimation.current.speed = -1;
      return;
    }

    if (hasAnimatedIn.current && !outAnimation.current) {
      const animation = animate(outSequence);
      outAnimation.current = animation;
      await animation;
      outAnimation.current = null;

      if (animation.speed === 1) {
        hasAnimatedIn.current = false;
      }

      return;
    }

    if (outAnimation.current) {
      outAnimation.current.speed = 1;
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (copied) {
      void animateIn();
      return;
    }

    void animateOut();
  }, [copied]);

  async function handleCopy(): Promise<void> {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => void handleCopy()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          void handleCopy();
        }
      }}
      style={{
        color: "#4a9eff",
        textDecoration: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        position: "relative",
      }}
      title={command}
    >
      {name}
      <svg
        ref={scope}
        style={{ overflow: "visible", width: "0.9rem", height: "0.9rem" }}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        aria-hidden="true"
      >
        <motion.rect
          data-part="square-front"
          x="4.75"
          y="8.75"
          width="10.5"
          height="10.5"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <g mask={`url(#${maskId})`}>
          <motion.rect
            data-part="square-back"
            x="8.75"
            y="4.75"
            width="10.5"
            height="10.5"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </g>
        <motion.path
          data-part="check"
          initial={{ pathLength: 0, opacity: 0 }}
          d="M9.25 12.25L11 14.25L15 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#fff" />
          <motion.rect
            data-part="square-front"
            x="4.75"
            y="8.75"
            width="10.5"
            height="10.5"
            rx="2"
            fill="#000"
            stroke="#000"
            strokeWidth="1.5"
          />
        </mask>
      </svg>
    </span>
  );
}
