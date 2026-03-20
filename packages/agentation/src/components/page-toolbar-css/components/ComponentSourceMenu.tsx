import type { Dispatch, SetStateAction } from "react";

import { formatComponentSourcePath } from "../../../utils/component-inspector";
import type { ComponentInspection } from "../../../utils/component-inspector";
import type { ComponentMenuState } from "../hooks/useInteractionLifecycle";

type ComponentSourceMenuProps = {
  componentMenu: ComponentMenuState | null;
  isDarkMode: boolean;
  hoveredComponentMenuIndex: number | null;
  setHoveredComponentMenuIndex: Dispatch<SetStateAction<number | null>>;
  openComponentSource: (item: ComponentInspection) => Promise<void>;
};

export function ComponentSourceMenu({
  componentMenu,
  isDarkMode,
  hoveredComponentMenuIndex,
  setHoveredComponentMenuIndex,
  openComponentSource,
}: ComponentSourceMenuProps): JSX.Element | null {
  if (!componentMenu) {
    return null;
  }

  return (
    <div
      data-component-source-menu
      style={{
        position: "fixed",
        left: Math.min(componentMenu.x, window.innerWidth - 440),
        top: Math.min(
          componentMenu.y,
          Math.max(16, window.innerHeight - 24 - componentMenu.items.length * 72),
        ),
        zIndex: 2147483647,
        minWidth: 420,
        maxWidth: 460,
        background: isDarkMode ? "#111827" : "#ffffff",
        color: isDarkMode ? "#f9fafb" : "#111827",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.12)"}`,
        borderRadius: 12,
        boxShadow: "0 24px 48px rgba(0,0,0,0.22)",
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {componentMenu.items.map((item, index) => {
        const propNames = Object.keys(item.props);
        const sourceLabel = formatComponentSourcePath(item.source);

        return (
          <button
            key={`${item.displayName}-${item.source.fileName}-${item.source.lineNumber}-${index}`}
            type="button"
            onClick={() => {
              void openComponentSource(item);
            }}
            onMouseEnter={() => setHoveredComponentMenuIndex(index)}
            onMouseLeave={() =>
              setHoveredComponentMenuIndex((current) =>
                current === index ? null : current,
              )
            }
            onFocus={() => setHoveredComponentMenuIndex(index)}
            onBlur={() =>
              setHoveredComponentMenuIndex((current) =>
                current === index ? null : current,
              )
            }
            style={{
              all: "unset",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              padding: "10px 12px",
              borderRadius: 10,
              cursor: "pointer",
              background:
                hoveredComponentMenuIndex === index
                  ? isDarkMode
                    ? "rgba(96,165,250,0.22)"
                    : "rgba(59,130,246,0.14)"
                  : isDarkMode
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(15,23,42,0.03)",
              boxShadow:
                hoveredComponentMenuIndex === index
                  ? isDarkMode
                    ? "inset 0 0 0 1px rgba(147,197,253,0.28)"
                    : "inset 0 0 0 1px rgba(59,130,246,0.2)"
                  : "none",
              transform:
                hoveredComponentMenuIndex === index
                  ? "translateY(-1px)"
                  : "none",
              transition:
                "background 120ms ease, box-shadow 120ms ease, transform 120ms ease",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
              {`<${item.displayName}>`}
            </div>
            {propNames.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {propNames.map((propName) => (
                  <span
                    key={propName}
                    title={item.props[propName]}
                    style={{
                      fontSize: 11,
                      lineHeight: 1,
                      padding: "4px 6px",
                      borderRadius: 999,
                      background: isDarkMode
                        ? "rgba(96,165,250,0.18)"
                        : "rgba(59,130,246,0.12)",
                      color: isDarkMode ? "#bfdbfe" : "#1d4ed8",
                    }}
                  >
                    {propName}
                  </span>
                ))}
              </div>
            )}
            <div
              title={sourceLabel}
              style={{
                fontSize: 11,
                lineHeight: 1.3,
                opacity: 0.75,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                direction: "rtl",
                textAlign: "left",
              }}
            >
              {sourceLabel}
            </div>
          </button>
        );
      })}
    </div>
  );
}
