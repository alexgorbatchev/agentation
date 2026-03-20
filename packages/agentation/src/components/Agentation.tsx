import { PageFeedbackToolbarCSS } from "./page-toolbar-css";
import type { AgentationProps } from "./page-toolbar-css";

const IS_PRODUCTION_BUILD = process.env.NODE_ENV === "production";

export function Agentation(props: AgentationProps): JSX.Element | null {
  if (IS_PRODUCTION_BUILD) {
    return null;
  }

  return <PageFeedbackToolbarCSS {...props} />;
}
