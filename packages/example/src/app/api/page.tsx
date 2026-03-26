import type { JSX } from "react";

import { Footer } from "../Footer";
import { CodeBlock } from "../components/CodeBlock";

export default function APIPage(): JSX.Element {
  return (
    <>
      <article className="article">
        <header>
          <h1>API</h1>
          <p className="tagline">Programmatic access for developers</p>
        </header>

        <section>
          <h2 id="overview">Overview</h2>
          <p>
            Agentation exposes callbacks that let you integrate annotations into
            your own workflows — send to a backend, pipe to terminal, trigger
            automations, or build custom AI integrations.
          </p>
          <ul>
            <li>Sync annotations to a database or backend service</li>
            <li>Build analytics dashboards tracking feedback patterns</li>
            <li>Create custom AI integrations (CLI loops, agent tools)</li>
          </ul>
        </section>

        <section>
          <h2 id="props">Props</h2>
          <p>
            <code>{"<Agentation />"}</code> is a thin public wrapper around the CSS toolbar component. These are the current public props exported by
            <code> @alexgorbatchev/agentation</code>.
          </p>

          <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Required</h3>
          <div className="props-list">
            <div className="prop-item">
              <div className="prop-header">
                <code className="prop-name">projectId</code>
                <span className="prop-type">string</span>
              </div>
              <p className="prop-desc">Required project scope used by the local CLI/server for pending queues, session reuse, and watch flows.</p>
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
              <p className="prop-desc">Optional server URL. If omitted, Agentation probes <code>http://127.0.0.1:4747</code> once and otherwise stays local-only.</p>
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
              <p className="prop-desc">Default webhook target. Auto-send is controlled by toolbar settings, and the manual send action can still target this URL.</p>
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
              <p className="prop-desc">Disable clipboard writes if you want to handle copied output yourself via <code>onCopy</code>.</p>
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
          <p>
            Receive annotation data directly in your code:
          </p>
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
            The <code>Annotation</code> object passed to callbacks. See <a href="/schema">Agentation Format</a> for the full schema.
          </p>
          <CodeBlock
            code={`type Annotation = {
  // Core fields
  id: string;
  x: number;                // % of viewport width
  y: number;                // px from top of document (or viewport if isFixed)
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
  sourceFile?: string;      // e.g. "src/components/Button.tsx:42"
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
};`}
          />
        </section>

        <section>
          <h2 id="http-api">HTTP API</h2>
          <p>
            The local Agentation server (started with <code>agentation start</code>) provides a REST API for programmatic access:
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
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>List all sessions</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>/sessions/:id</td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Get session with annotations</td>
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
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Update annotation</td>
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
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Get pending annotations</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>/pending</td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Get all pending annotations</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginTop: "1.25rem" }}>Events (SSE)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
            <tbody>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem", width: "5rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>/sessions/:id/events</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Session event stream</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>GET</td>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>/events</td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>Global event stream (optionally filter with <code>?domain=...</code>)</td>
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
        </section>

        <section>
          <h2 id="real-time-events">Real-Time Events</h2>
          <p>
            Subscribe to real-time events via Server-Sent Events:
          </p>
          <CodeBlock
            language="bash"
            code={`# Session-level: events for a single page
curl -N http://127.0.0.1:4747/sessions/:id/events

# Global: events across ALL sessions
curl -N http://127.0.0.1:4747/events

# Filtered by domain: events for pages on a specific domain
curl -N "http://127.0.0.1:4747/events?domain=localhost:3001"

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
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Default base URL for CLI data commands such as <code>pending</code>, <code>watch</code>, and <code>resolve</code></td>
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
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_ROUTER_ADDR</td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.6)" }}>Default address for the optional router; set to <code>0</code> to disable it</td>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>127.0.0.1:8787</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 id="storage">Storage</h2>
          <p>
            By default, data is persisted to SQLite at <code>$XDG_DATA_HOME/agentation/store.db</code> if <code>XDG_DATA_HOME</code> is set,
            otherwise <code>~/.local/share/agentation/store.db</code>. To use in-memory storage:
          </p>
          <CodeBlock
            language="bash"
            copyable
            code={`AGENTATION_STORE=memory agentation start --foreground`}
          />
        </section>

        <section>
          <h2 id="programmatic-usage">Programmatic Usage</h2>
          <CodeBlock
            language="bash"
            code={`# Start local stack (server + router)
agentation start

# Or start in foreground while debugging
agentation start --foreground

# Target a non-default API endpoint
AGENTATION_BASE_URL=http://127.0.0.1:5757 agentation pending my-project --json`}
          />
          <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem" }}>
            See <a href="/server">Agentation Server (CLI)</a> for lifecycle and agent-integration workflows.
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
