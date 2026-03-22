import type { JSX } from "react";

import { Footer } from "../Footer";
import { CodeBlock } from "../components/CodeBlock";
import { CopyablePackageManager } from "./CopyablePackageManager";

export default function InstallPage(): JSX.Element {
  return (
    <>
      <article className="article">
        <header>
          <h1>Installation</h1>
          <p className="tagline">Get started with Agentation in your project</p>
        </header>

        <section>
          <h2>Choose your setup</h2>
          <ul>
            <li><strong>Standard setup</strong> &rarr; Install the package, install the CLI, and run <code>agentation start</code></li>
            <li><strong>Using Pi?</strong> &rarr; Install the maintained Agentation fix-loop skill for Pi to consume pending annotations automatically</li>
            <li><strong>Building a custom agent?</strong> &rarr; Use the CLI commands for pending, watch, acknowledge, and resolve workflows</li>
          </ul>
          <p style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.5)", marginTop: "0.5rem" }}>
            The local Agentation server is the supported setup for synced sessions, agent loops, and threads. If no local server is discovered,
            the toolbar still falls back to local-only copy/paste mode.
          </p>
        </section>

        <section>
          <h2>Install the package</h2>
          <CodeBlock code="npm install @alexgorbatchev/agentation -D" language="bash" copyable />
          <p
            style={{
              fontSize: "0.875rem",
              color: "rgba(0,0,0,0.5)",
              marginTop: "0.5rem",
            }}
          >
            Or use{" "}
            <CopyablePackageManager name="yarn" command="yarn add @alexgorbatchev/agentation --dev" />,{" "}
            <CopyablePackageManager name="pnpm" command="pnpm add @alexgorbatchev/agentation -D" />, or{" "}
            <CopyablePackageManager name="bun" command="bun add @alexgorbatchev/agentation -d" />.
          </p>
        </section>

        <section>
          <h2>Install the CLI</h2>
          <CodeBlock code="npm install -g @alexgorbatchev/agentation-cli" language="bash" copyable />
          <p
            style={{
              fontSize: "0.875rem",
              color: "rgba(0,0,0,0.5)",
              marginTop: "0.5rem",
            }}
          >
            The CLI runs the local Agentation server and powers pending queues, watch flows, and agent integrations.
          </p>
        </section>

        <section>
          <h2>Add to your app</h2>
          <p>
            Add the component anywhere in your React app, ideally at the root
            level. The <code>NODE_ENV</code> check ensures it only loads in
            development.
          </p>
          <CodeBlock
            code={`import { Agentation } from "@alexgorbatchev/agentation";

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === "development" && <Agentation projectId="my-project" />}
    </>
  );
}`}
            language="tsx"
          />
        </section>

        <section>
          <h2>Agent skills</h2>
          <p>
            This fork no longer ships the older one-command Claude Code setup skill. The maintained automation lives in
            <code> @alexgorbatchev/agentation-skills</code> and is aimed at the fix loop once Agentation is already installed.
          </p>
          <CodeBlock
            code="npx skills add alexgorbatchev/agentation-skills --skill agentation-fix-loop --agent pi"
            language="bash"
            copyable
          />
          <p
            style={{
              fontSize: "0.8125rem",
              color: "rgba(0,0,0,0.45)",
              marginTop: "0.375rem",
            }}
          >
            That skill wraps the current CLI workflow (<code>agentation pending</code>, <code>watch</code>, <code>ack</code>,
            <code>reply</code>, <code>resolve</code>) for Pi. Other agents should use the same CLI commands directly.
          </p>
        </section>

        <section>
          <h2>Agent Integration <span className="sketchy-underline" style={{ "--marker-color": "#febc2e" } as React.CSSProperties}>Required</span></h2>
          <p>
            Run the local Agentation stack and let your coding agent consume annotations via CLI commands.
            This is the supported setup and enables real-time annotation syncing and bidirectional communication.
          </p>

          <h3>1. Start Agentation</h3>
          <p>
            Start the local stack (single PID, server + router):
          </p>
          <CodeBlock code={`agentation start`} language="bash" copyable />
          <p
            style={{
              fontSize: "0.8125rem",
              color: "rgba(0,0,0,0.45)",
              marginTop: "0.375rem",
            }}
          >
            By default this starts both services. The server is required; advanced setups may disable the router, but not the server.
          </p>

          <h3>2. Verify setup</h3>
          <p>
            Check that everything is running:
          </p>
          <CodeBlock code="agentation status" language="bash" copyable />

          <h3>3. Connect the component</h3>
          <p>
            Point the React component to your server:
          </p>
          <CodeBlock
            code={`<Agentation
  projectId="my-project"
  endpoint="http://127.0.0.1:4747"
  onSessionCreated={(sessionId) => {
    console.log("Session started:", sessionId);
  }}
/>`}
            language="tsx"
          />
          <p
            style={{
              fontSize: "0.875rem",
              color: "rgba(0,0,0,0.5)",
              marginTop: "0.5rem",
            }}
          >
            Annotations are created in the browser UI and synced against the local server, which is the supported source of truth.
          </p>

          <ul style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.6)", marginTop: "0.75rem", paddingLeft: "1.25rem" }}>
            <li style={{ marginBottom: "0.375rem" }}><strong>Server-backed sessions</strong> &mdash; The local server keeps annotation state stable across refreshes and agent runs</li>
            <li style={{ marginBottom: "0.375rem" }}><strong>Session continuity</strong> &mdash; Rejoins the same session on page refresh</li>
            <li style={{ marginBottom: "0.375rem" }}><strong>No duplicates</strong> &mdash; Only new annotations are uploaded; existing ones are skipped</li>
            <li><strong>Server authority</strong> &mdash; Agent changes (resolve, dismiss) take precedence on rejoin</li>
          </ul>

          <p
            style={{
              fontSize: "0.8125rem",
              color: "rgba(0,0,0,0.5)",
              marginTop: "0.75rem",
            }}
          >
            This means you can annotate freely, refresh the page, and the agent will see a continuous server-backed session
            rather than fragmented duplicates.
          </p>

          <p style={{ marginTop: "1.5rem" }}>
            <strong>Agent loop:</strong> In your coding agent session, use
            <code> agentation pending</code>, <code>agentation watch</code>, <code>agentation ack</code>, and <code>agentation resolve</code>
            to process feedback continuously.
          </p>
        </section>

        <section>
          <h2>Requirements</h2>
          <ul>
            <li>
              <strong>React 18+</strong> &mdash; Uses modern React features
            </li>
            <li>
              <strong>Client-side only</strong> &mdash; Requires DOM access
            </li>
            <li>
              <strong>Desktop only</strong> &mdash; Not optimized for mobile
              devices
            </li>
            <li>
              <strong>Zero dependencies</strong> &mdash; No runtime deps beyond
              React
            </li>
          </ul>
        </section>

        <section>
          <h2>Props</h2>
          <p>
            Most props are optional once the local Agentation server is running. The component can auto-discover the default local endpoint.
          </p>

          <h3 style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>Callbacks</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <tbody>
              <tr>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", width: "35%" }}>
                  <code>onAnnotationAdd</code>
                </td>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Fired when an annotation is added
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <code>onAnnotationDelete</code>
                </td>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Fired when an annotation is deleted
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <code>onAnnotationUpdate</code>
                </td>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Fired when an annotation comment is edited
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <code>onAnnotationsClear</code>
                </td>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Fired when all annotations are cleared
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <code>onCopy</code>
                </td>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Fired when copy button is clicked (receives markdown)
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0" }}>
                  <code>onSubmit</code>
                </td>
                <td style={{ padding: "0.5rem 0", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Fired when &quot;Send Annotations&quot; is clicked
                </td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>Behavior</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <tbody>
              <tr>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", width: "35%" }}>
                  <code>copyToClipboard</code>
                </td>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Auto-copy on add (default: <code style={{ color: "rgba(0,0,0,0.7)" }}>true</code>)
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", width: "35%" }}>
                  <code>className</code>
                </td>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Custom class for positioning or z-index adjustments
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", width: "35%" }}>
                  <code>navigateToUrl</code>
                </td>
                <td style={{ padding: "0.5rem 0", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Override component-source navigation side effects (advanced)
                </td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>Agent Sync</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <tbody>
              <tr>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", width: "35%" }}>
                  <code>endpoint</code>
                </td>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Server URL (e.g., <code style={{ color: "rgba(0,0,0,0.7)" }}>&quot;http://127.0.0.1:4747&quot;</code>)
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <code>sessionId</code>
                </td>
                <td style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Join an existing session (optional)
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0" }}>
                  <code>onSessionCreated</code>
                </td>
                <td style={{ padding: "0.5rem 0", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Fired when new session is created (receives <code style={{ color: "rgba(0,0,0,0.7)" }}>sessionId: string</code>)
                </td>
              </tr>
            </tbody>
          </table>

          <p style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
            See <a href="/api">API</a> for full props reference and HTTP endpoints.
          </p>

        </section>

        <section>
          <h2>Security notes</h2>
          <p>
            Agentation runs in your browser and reads DOM content to generate feedback. By default, it does <strong>not</strong>
            send anything to third-party services. If a local Agentation server is running, the toolbar may auto-discover
            <code> http://127.0.0.1:4747</code> and sync there.
          </p>
          <ul>
            <li>
              <strong>No third-party requests by default</strong> &mdash; output stays in the browser unless you configure a webhook or another destination
            </li>
            <li>
              <strong>Local server only</strong> &mdash; when using the built-in sync flow, data is sent to your local machine only (<code>127.0.0.1</code> by default)
            </li>
            <li>
              <strong>No hosted Agentation backend</strong> &mdash; this fork ships a local CLI/server workflow, not a managed cloud service
            </li>
            <li>
              <strong>Production is opt-in</strong> &mdash; render <code>{"<Agentation />"}</code> only where you explicitly want it
            </li>
          </ul>
        </section>
      </article>

      <Footer />
    </>
  );
}
