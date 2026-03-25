import type { CSSProperties, Ref } from "react";

export type ComponentSourceMenuViewItemProp = {
  name: string;
  title?: string;
};

export type ComponentSourceMenuViewItem = {
  key: string;
  displayName: string;
  props: ComponentSourceMenuViewItemProp[];
  sourceLabel: string;
};

type ComponentSourceMenuViewProps = {
  items: ComponentSourceMenuViewItem[];
  isDarkMode: boolean;
  hoveredComponentMenuIndex: number | null;
  setHoveredComponentMenuIndex: (index: number | null) => void;
  onItemClick: (index: number) => void;
  position: { x: number; y: number };
  positionMode?: "fixed" | "absolute";
  className?: string;
  style?: CSSProperties;
  itemRefs?: Array<Ref<HTMLButtonElement> | undefined>;
  interactive?: boolean;
};

export function ComponentSourceMenuView({
  items,
  isDarkMode,
  hoveredComponentMenuIndex,
  setHoveredComponentMenuIndex,
  onItemClick,
  position,
  positionMode = "fixed",
  className,
  style,
  itemRefs,
  interactive = true,
}: ComponentSourceMenuViewProps): JSX.Element | null {
  if (items.length === 0) {
    return null;
  }

  const left =
    positionMode === "fixed"
      ? Math.min(position.x, window.innerWidth - 440)
      : position.x;
  const top =
    positionMode === "fixed"
      ? Math.min(position.y, Math.max(16, window.innerHeight - 24 - items.length * 72))
      : position.y;

  return (
    <div
      data-component-source-menu
      className={className}
      aria-hidden={interactive ? undefined : true}
      style={{
        position: positionMode,
        left,
        top,
        zIndex: 2147483647,
        minWidth: 420,
        maxWidth: 460,
        background: isDarkMode ? "#111827" : "#ffffff",
        color: isDarkMode ? "#f9fafb" : "#111827",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.12)"}`,
        borderRadius: 12,
        boxShadow: "0 24px 48px rgba(0,0,0,0.22)",
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        ...style,
      }}
    >
      {items.map((item, index) => (
        <button
          key={item.key}
          ref={itemRefs?.[index]}
          type="button"
          tabIndex={interactive ? 0 : -1}
          onClick={() => {
            onItemClick(index);
          }}
          onMouseEnter={() => setHoveredComponentMenuIndex(index)}
          onMouseLeave={() =>
            setHoveredComponentMenuIndex(
              hoveredComponentMenuIndex === index ? null : hoveredComponentMenuIndex,
            )
          }
          onFocus={() => setHoveredComponentMenuIndex(index)}
          onBlur={() =>
            setHoveredComponentMenuIndex(
              hoveredComponentMenuIndex === index ? null : hoveredComponentMenuIndex,
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
            transform: hoveredComponentMenuIndex === index ? "translateY(-1px)" : "none",
            transition: "background 120ms ease, box-shadow 120ms ease, transform 120ms ease",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{`<${item.displayName}>`}</div>
          {item.props.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {item.props.map((prop) => (
                <span
                  key={`${item.key}-${prop.name}`}
                  title={prop.title}
                  style={{
                    fontSize: 11,
                    lineHeight: 1,
                    padding: "4px 6px",
                    borderRadius: 999,
                    background: isDarkMode ? "rgba(96,165,250,0.18)" : "rgba(59,130,246,0.12)",
                    color: isDarkMode ? "#bfdbfe" : "#1d4ed8",
                  }}
                >
                  {prop.name}
                </span>
              ))}
            </div>
          )}
          <div
            title={item.sourceLabel}
            style={{
              fontSize: 11,
              lineHeight: 1.3,
              opacity: 0.75,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              direction: "rtl",
              textAlign: "left",
            }}
          >
            {item.sourceLabel}
          </div>
        </button>
      ))}
    </div>
  );
}
