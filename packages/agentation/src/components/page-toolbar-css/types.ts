import type { Annotation } from "../../types";
import type {
  ComponentEditor,
  ComponentSourceUrlParams,
} from "../../utils/component-inspector";

export type DemoAnnotation = {
  selector: string;
  comment: string;
  selectedText?: string;
};

export type ReactComponentMode = "smart" | "filtered" | "all" | "off";

export type PageFeedbackToolbarCSSProps = {
  demoAnnotations?: DemoAnnotation[];
  demoDelay?: number;
  enableDemoMode?: boolean;
  /** Callback fired when an annotation is added. */
  onAnnotationAdd?: (annotation: Annotation) => void;
  /** Callback fired when an annotation is deleted. */
  onAnnotationDelete?: (annotation: Annotation) => void;
  /** Callback fired when an annotation comment is edited. */
  onAnnotationUpdate?: (annotation: Annotation) => void;
  /** Callback fired when all annotations are cleared. Receives the annotations that were cleared. */
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  /** Callback fired when the copy button is clicked. Receives the markdown output. */
  onCopy?: (markdown: string) => void;
  /** Callback fired when "Send to Agent" is clicked. Receives the markdown output and annotations. */
  onSubmit?: (output: string, annotations: Annotation[]) => void;
  /** Whether to copy to clipboard when the copy button is clicked. Defaults to true. */
  copyToClipboard?: boolean;
  /**
   * Server URL for sync (e.g., "http://127.0.0.1:4747").
   * Optional; if omitted, Agentation probes the local endpoint once on page load.
   */
  endpoint?: string;
  /** Project identifier used to scope server sessions for multi-project agent loops. */
  projectId?: string;
  /** Pre-existing session ID to join. If not provided, creates or rejoins a project-scoped session. */
  sessionId?: string;
  /** Called when a new session is created. */
  onSessionCreated?: (sessionId: string) => void;
  /** Webhook URL to receive annotation events. */
  webhookUrl?: string;
  /** Custom class name applied to the toolbar container. Use to adjust positioning or z-index. */
  className?: string;
  /** Editor protocol used for alt+right-click component navigation. */
  componentEditor?: ComponentEditor;
  /** Override editor URL generation for alt+right-click component navigation. */
  getComponentEditorUrl?: (params: ComponentSourceUrlParams) => string;
  /** Override navigation side effects for opening component sources. */
  navigateToUrl?: (url: string) => void;
  /** Base URL for the Neovim bridge/router when using componentEditor="neovim". */
  neovimBridgeUrl?: string;
  /** Optional project ID used by the Neovim router to resolve the target session. */
  neovimProjectId?: string;
  /** Copy the component source path to the clipboard when opening it. */
  copyComponentSourcePath?: boolean;
};

/** Public Agentation props require project scoping. */
export type AgentationProps = Omit<PageFeedbackToolbarCSSProps, "projectId"> & {
  projectId: string;
};
