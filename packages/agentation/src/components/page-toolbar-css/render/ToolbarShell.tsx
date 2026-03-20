import type { ReactNode } from "react";

import styles from "../styles.module.scss";

type ToolbarShellProps = {
  className?: string;
  toolbarPosition: { x: number; y: number } | null;
  children: ReactNode;
};

export function ToolbarShell({
  className,
  toolbarPosition,
  children,
}: ToolbarShellProps) {
  return (
    <div
      className={`${styles.toolbar}${className ? ` ${className}` : ""}`}
      data-feedback-toolbar
      style={
        toolbarPosition
          ? {
              left: toolbarPosition.x,
              top: toolbarPosition.y,
              right: "auto",
              bottom: "auto",
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
