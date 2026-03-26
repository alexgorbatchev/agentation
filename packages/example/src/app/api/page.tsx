import type { JSX } from "react";

import { Footer } from "../Footer";
import { CodeBlock } from "../components/CodeBlock";

export default function APIPage(): JSX.Element {
  return (
    <>
      <article className="article">
        <header>
          <h1>API</h1>
          <p className="tagline">Public React props, local HTTP API, and CLI integration surface</p>
        </header>

        <section>
          <h2 id="overview">Overview</h2>
          <p>
            Agentation exposes a small public React API for the browser toolbar and a local CLI/server API for
            project-scoped agent automation. The browser component is what you ship in your app; the local CLI/server is
            what powers synced sessions, pending queues, watch loops, and editor routing.
          </p>
          <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            This page covers the public component props and the core CLI/server surface. For the exhaustive npm package,
            install, environment-variable, and release reference, see the{" "}
            <a
              href="https://github.com/alexgorbatchev/agentation-cli/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              agentation-cli README
            </a>
            .
          </p>
          <ul>
            <li>Mount the browser toolbar with a required <code>projectId</code></li>
            <li>Use CLI commands such as <code>pending</code>, <code>watch</code>, <code>reply</code>, and <code>resolve</code></li>
            <li>Use the local HTTP API directly if you need custom tooling around sessions or annotations</li>
          </ul>
        </section>

        <section>
          <h2 id="props">Props</h2>
          <p>
            <code>{"<Agentation />"}</code> is a thin public wrapper around the CSS toolbar component. These are the
            current public props exported by <code>@alexgorbatchev/agentation</code>.
          </p>

          <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Required</h3>
          <div className="props-list">
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">projectId</code>
                <span className="prop-type">string</span>
              </div>
              <p className="prop-desc">
                Required project scope used by the local CLI/server for session reuse, pending queues, and watch flows.
              </p>
            </div>
          </div>

          <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Demo mode</h3>
          <div className="props-list">
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">demoAnnotations</code>
                <span className="prop-type">DemoAnnotation[]</span>
              </div>
              <p className="prop-desc">Optional scripted demo annotations rendered when demo mode is enabled.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">demoDelay</code>
                <span className="prop-type">number</span>
                <span className="prop-default">default: 1000</span>
              </div>
              <p className="prop-desc">Delay in milliseconds between demo annotation steps.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">enableDemoMode</code>
                <span className="prop-type">boolean</span>
                <span className="prop-default">default: false</span>
              </div>
              <p className="prop-desc">Enable the built-in demo flow instead of normal live annotation capture.</p>
            </div>
          </div>

          <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Callbacks</h3>
          <div className="props-list">
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">onAnnotationAdd</code>
                <span className="prop-type">(annotation: Annotation) =&gt; void</span>
              </div>
              <p className="prop-desc">Called when an annotation is created.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">onAnnotationDelete</code>
                <span className="prop-type">(annotation: Annotation) =&gt; void</span>
              </div>
              <p className="prop-desc">Called when an annotation is deleted.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">onAnnotationUpdate</code>
                <span className="prop-type">(annotation: Annotation) =&gt; void</span>
              </div>
              <p className="prop-desc">Called when an annotation comment or server-backed fields are updated.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">onAnnotationsClear</code>
                <span className="prop-type">(annotations: Annotation[]) =&gt; void</span>
              </div>
              <p className="prop-desc">Called when all local annotations are cleared.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">onCopy</code>
                <span className="prop-type">(markdown: string) =&gt; void</span>
              </div>
              <p className="prop-desc">Receives generated markdown when the copy action runs.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">onSubmit</code>
                <span className="prop-type">(output: string, annotations: Annotation[]) =&gt; void</span>
              </div>
              <p className="prop-desc">Receives the rendered output plus annotations when the send action runs.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">onSessionCreated</code>
                <span className="prop-type">(sessionId: string) =&gt; void</span>
              </div>
              <p className="prop-desc">Called when a new server-backed session is created.</p>
            </div>
          </div>

          <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Sync and delivery</h3>
          <div className="props-list">
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">endpoint</code>
                <span className="prop-type">string</span>
              </div>
              <p className="prop-desc">
                Optional server URL. If omitted, Agentation probes <code>http://127.0.0.1:4747</code> once and
                otherwise stays local-only.
              </p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">sessionId</code>
                <span className="prop-type">string</span>
              </div>
              <p className="prop-desc">Join a pre-existing session instead of creating or reusing a project-scoped one.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">webhookUrl</code>
                <span className="prop-type">string</span>
              </div>
              <p className="prop-desc">
                Default webhook target. Auto-send is controlled by toolbar settings, and the manual send action can still
                target this URL.
              </p>
            </div>
          </div>

          <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Behavior and UI</h3>
          <div className="props-list">
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">copyToClipboard</code>
                <span className="prop-type">boolean</span>
                <span className="prop-default">default: true</span>
              </div>
              <p className="prop-desc">
                Disable clipboard writes if you want to handle copied output yourself via <code>onCopy</code>.
              </p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">className</code>
                <span className="prop-type">string</span>
              </div>
              <p className="prop-desc">Custom class applied to the toolbar container for z-index or positioning adjustments.</p>
            </div>
          </div>

          <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Component-source navigation</h3>
          <div className="props-list">
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">componentEditor</code>
                <span className="prop-type">&quot;cursor&quot; | &quot;neovim&quot; | &quot;vscode&quot; | &quot;vscode-insiders&quot; | &quot;webstorm&quot;</span>
                <span className="prop-default">default: &quot;vscode&quot;</span>
              </div>
              <p className="prop-desc">Editor protocol used when opening detected source files from the component menu.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">getComponentEditorUrl</code>
                <span className="prop-type">(params: ComponentSourceUrlParams) =&gt; string</span>
              </div>
              <p className="prop-desc">Override editor URL generation entirely.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">navigateToUrl</code>
                <span className="prop-type">(url: string) =&gt; void</span>
                <span className="prop-default">default: window.location.assign</span>
              </div>
              <p className="prop-desc">Override the final navigation side effect when a component source link is opened.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">neovimBridgeUrl</code>
                <span className="prop-type">string</span>
                <span className="prop-default">default: http://127.0.0.1:8777</span>
              </div>
              <p className="prop-desc">Base URL for the Neovim router when <code>componentEditor=&quot;neovim&quot;</code>.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">neovimProjectId</code>
                <span className="prop-type">string</span>
              </div>
              <p className="prop-desc">Optional project ID passed to the Neovim router for session resolution.</p>
            </div>
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">copyComponentSourcePath</code>
                <span className="prop-type">boolean</span>
                <span className="prop-default">default: true</span>
              </div>
              <p className="prop-desc">Copy the resolved source path to the clipboard when opening a component source link.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 id="basic-usage">Basic usage</h2>
          <p>Receive annotation data directly in your code:</p>
          <CodeBlock
            code={`import { Agentation, type Annotation } from "@alexgorbatchev/agentation";

function App() {
  const handleAnnotation = (annotation: Annotation) => {
    console.log(annotation.element, annotation.comment);
  };

  return (
    <>
      <YourApp />
      <Agentation projectId="my-project" onAnnotationAdd={handleAnnotation} />
    </>
  );
}`}
          />
        </section>

        <section>
          <h2 id="annotation-type">Annotation type</h2>
          <p>
            The <code>Annotation</code> object passed to callbacks. See <a href="/schema">Agentation Format</a> for the
            wire schema and server-backed fields.
          </p>
          <CodeBlock
            code={`type Annotation = {
  // Core fields
  id: string;
  x: number;
  y: number;
  comment: string;
  element: string;
  elementPath: string;
  timestamp: number;

  // Element context
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  nearbyElements?: string;
  computedStyles?: string;
  fullPath?: string;
  accessibility?: string;
  isMultiSelect?: boolean;
  isFixed?: boolean;
  reactComponents?: string;
  sourceFile?: string;
  elementBoundingBoxes?: Array<{ x: number; y: number; width: number; height: number }>;

  // Server-backed metadata
  sessionId?: string;
  url?: string;
  intent?: "fix" | "change" | "question" | "approve";
  severity?: "blocking" | "important" | "suggestion";
  status?: "pending" | "acknowledged" | "resolved" | "dismissed";
  thread?: ThreadMessage[];
  createdAt?: number;
  updatedAt?: number;
  resolvedAt?: number;
  resolvedBy?: "human" | "agent";
  authorId?: string;

  // Local-only sync tracking
  _syncedTo?: string;
  _reviewedAt?: number;
};

type ThreadMessage = {
  id: string;
  role: "human" | "agent";
  content: string;
  timestamp: number;
};`}
          />
        </section>

        <section>
          <h2 id="cli-command-surface">CLI command surface</h2>
          <p>
            The supported automation path is the project-scoped CLI. Add <code>--json</code> when you want
            machine-readable output.
          </p>
          <CodeBlock
            language="bash"
            code={`# lifecycle
agentation start
agentation status
agentation stop

# project discovery + queue inspection
agentation projects --json
agentation project my-project --json
agentation pending my-project --json
agentation watch my-project --timeout 300 --json

# annotation actions
agentation ack <annotation-id>
agentation reply <annotation-id> --message "Working on it"
agentation resolve <annotation-id> --summary "Updated spacing in Hero.tsx"
agentation dismiss <annotation-id> --reason "Out of scope for this change"`}
          />
        </section>

        <section>
          <h2 id="http-api">HTTP API</h2>
          <p>
            The local Agentation server (started with <code>agentation start</code>) provides a REST API for programmatic
            access. For agent automation, prefer project-scoped CLI commands or include <code>?projectId=...</code> on
            the corresponding HTTP requests.
          </p>

          <h3 style={{ marginTop: "1.25rem" }}>Sessions</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
            <tbody>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", width: "5rem", color: "rgba(0,0,0,0.4)" }}>POST</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/sessions</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Create a new session</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/sessions</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>List sessions (optionally filter with <code>?projectId=...</code>)</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/sessions/:id</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Get session with annotations</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>POST</td>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>/sessions/:id/action</td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Request agent action for a session</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginTop: "1.25rem" }}>Annotations</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
            <tbody>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", width: "5rem", color: "rgba(0,0,0,0.4)" }}>POST</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/sessions/:id/annotations</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Add annotation</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/annotations/:id</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Get annotation</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>PATCH</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/annotations/:id</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Update annotation status or metadata</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>DELETE</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/annotations/:id</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Delete annotation</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>POST</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/annotations/:id/thread</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Add thread message</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/sessions/:id/pending</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Get pending annotations for one session</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>/pending</td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Get pending annotations across all projects, or filter with <code>?projectId=...</code></td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginTop: "1.25rem" }}>Events (SSE)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
            <tbody>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", width: "5rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/sessions/:id/events</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Session event stream (optionally add <code>?agent=true</code>)</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>/events</td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Global event stream (supports <code>?projectId=...</code>, <code>?domain=...</code>, and <code>?agent=true</code>)</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginTop: "1.25rem" }}>Health</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
            <tbody>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", width: "5rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/health</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Health check</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>/status</td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Server status</td>
              </tr>
            </tbody>
          </table>

          <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            <code>POST /sessions/:id/action</code> accepts a JSON body shaped like <code>{'{ "output": "..." }'}</code>
            and emits an <code>action.requested</code> event containing the session, current annotations, and request
            timestamp.
          </p>
        </section>

        <section>
          <h2 id="real-time-events">Real-Time Events</h2>
          <p>Subscribe to real-time events via Server-Sent Events:</p>
          <CodeBlock
            language="bash"
            code={`# Session-level: events for a single page
curl -N http://127.0.0.1:4747/sessions/:id/events

# Project-scoped: events across all sessions for one project
curl -N "http://127.0.0.1:4747/events?projectId=my-project"

# Agent watch flow: only the stream shape used by CLI watch
curl -N "http://127.0.0.1:4747/events?agent=true&projectId=my-project"

# Reconnect after disconnect (replay missed events)
curl -N -H "Last-Event-ID: 42" http://127.0.0.1:4747/sessions/:id/events`}
          />
          <h3 style={{ marginTop: "1.25rem" }}>Event types</h3>
          <ul style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.65)", marginTop: "0.5rem" }}>
            <li><code>annotation.created</code> &mdash; New annotation added</li>
            <li><code>annotation.updated</code> &mdash; Annotation modified (comment, status, etc.)</li>
            <li><code>annotation.deleted</code> &mdash; Annotation removed</li>
            <li><code>session.created</code> &mdash; New session started</li>
            <li><code>session.updated</code> &mdash; Session updated</li>
            <li><code>session.closed</code> &mdash; Session closed</li>
            <li><code>action.requested</code> &mdash; Agent action requested</li>
            <li><code>thread.message</code> &mdash; New message in annotation thread</li>
          </ul>
        </section>

        <section>
          <h2 id="environment-variables">Environment Variables</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", marginTop: "1rem" }}>
            <thead>
              <tr>
                <th style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.1)", textAlign: "left", fontWeight: 500 }}>Variable</th>
                <th style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.1)", textAlign: "left", fontWeight: 500 }}>Description</th>
                <th style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.1)", textAlign: "left", fontWeight: 500 }}>Default</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_BASE_URL</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Default base URL for CLI data commands such as <code>pending</code>, <code>watch</code>, <code>reply</code>, and <code>resolve</code></td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>http://localhost:4747</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_STORE</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Storage backend (<code>sqlite</code> or <code>memory</code>)</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>sqlite</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_DB_PATH</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Override the SQLite file path completely</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>derived from XDG_DATA_HOME</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>XDG_DATA_HOME</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Base directory used to derive the default SQLite location</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>~/.local/share</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_SERVER_ADDR</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Default address for <code>agentation start</code>; set to <code>0</code> to disable the HTTP server</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>127.0.0.1:4747</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_ROUTER_ADDR</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Default address for the optional router; set to <code>0</code> to disable it</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>127.0.0.1:8787</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_PID_FILE</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Override the single PID file used for stack lifecycle isolation</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>platform-specific runtime path</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_LOG_FILE</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Override the stack supervisor log file for background mode</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>derived runtime path</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_SERVER_LOG_FILE</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Override the server log file</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>derived runtime path</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_ROUTER_LOG_FILE</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Override the router log file</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>derived runtime path</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_ROUTER_TOKEN</td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.6)" }}>Optional auth token for router mutation endpoints such as <code>/register</code>, <code>/unregister</code>, and <code>/open</code></td>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>unset</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            Lower-level router tuning variables and npm install fallback variables are documented in the{" "}
            <a
              href="https://github.com/alexgorbatchev/agentation-cli/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              CLI README
            </a>
            .
          </p>
        </section>

        <section>
          <h2 id="storage">Storage</h2>
          <p>
            By default, data is persisted to SQLite at <code>$XDG_DATA_HOME/agentation/store.db</code> if <code>XDG_DATA_HOME</code> is set,
            otherwise <code>~/.local/share/agentation/store.db</code>. To use in-memory storage:
          </p>
          <CodeBlock language="bash" copyable code={`AGENTATION_STORE=memory agentation start --foreground`} />
        </section>

        <section>
          <h2 id="programmatic-usage">Programmatic Usage</h2>
          <CodeBlock
            language="bash"
            code={`# Start local stack (server + router)
agentation start

# Disable the router for a server-only workflow
AGENTATION_ROUTER_ADDR=0 agentation start

# Target a non-default API endpoint
AGENTATION_BASE_URL=http://127.0.0.1:5757 agentation pending my-project --json

# Watch + reply from a custom agent loop
AGENTATION_BASE_URL=http://127.0.0.1:5757 agentation watch my-project --json
AGENTATION_BASE_URL=http://127.0.0.1:5757 agentation reply <annotation-id> --message "On it"`}
          />
          <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem" }}>
            See <a href="/server">Agentation Server (CLI)</a> for the guided local workflow and lifecycle notes.
          </p>
        </section>
      </article>

      <style>{`
        .props-list {
          display: flex;
          flex-direction: column;
        }
        .prop-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.625rem 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .prop-item:last-child {
          border-bottom: none;
        }
        .prop-header {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .prop-name {
          font-size: 0.8125rem;
          font-family: "SF Mono", "SFMono-Regular", ui-monospace, Consolas, monospace;
          color: rgba(0, 0, 0, 0.8);
        }
        .prop-type {
          font-size: 0.75rem;
          font-family: "SF Mono", "SFMono-Regular", ui-monospace, Consolas, monospace;
          color: rgba(0, 0, 0, 0.4);
        }
        .prop-default {
          font-size: 0.75rem;
          color: rgba(0, 0, 0, 0.4);
        }
        .prop-desc {
          font-size: 0.8125rem;
          font-weight: 450;
          line-height: 1.5;
          color: rgba(0, 0, 0, 0.55);
          margin: 0;
        }
      `}</style>

      <Footer />
    </>
  );
}
