"use client";

import { Footer } from "../Footer";
import { CodeBlock } from "../components/CodeBlock";

export default function McpPage() {
  return (
    <>
      <article className="article">
        <header>
          <h1>Agentation Server (CLI)</h1>
          <p className="tagline">
            Run the local Agentation stack and connect your toolbar + coding agent in real time.
          </p>
        </header>

        <section>
          <h2 id="overview">Overview</h2>
          <p>
            Agentation now uses a Go CLI and HTTP server workflow. Start the stack locally, point the toolbar at the
            HTTP endpoint, and process annotations from your coding agent via CLI commands.
          </p>
          <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            <code>toolbar</code> → <code>agentation server</code> → <code>agentation CLI loop</code>
          </p>
        </section>

        <section>
          <h2 id="quick-start">Quick Start</h2>

          <h3>1. Start the local stack</h3>
          <CodeBlock
            language="bash"
            copyable
            code={`# starts both HTTP server + router (single PID)
agentation start

# run in background
agentation start --background

# status / stop
agentation status
agentation stop`}
          />

          <h3>2. Configure the toolbar endpoint</h3>
          <CodeBlock
            language="tsx"
            copyable
            code={`<Agentation endpoint="http://127.0.0.1:4747" />`}
          />

          <h3>3. Process annotations from your agent</h3>
          <CodeBlock
            language="bash"
            copyable
            code={`# fetch pending
agentation pending --json

# watch for new feedback
agentation watch --timeout 300 --batch-window 10 --json

# resolve loop actions
agentation ack <annotation-id>
agentation resolve <annotation-id> --summary "Updated spacing in Hero.tsx"`}
          />
        </section>

        <section>
          <h2 id="service-configuration">Service Configuration</h2>
          <p>
            Both services start by default. You can disable either by setting its address to <code>0</code>.
          </p>
          <CodeBlock
            language="bash"
            copyable
            code={`# disable server
AGENTATION_SERVER_ADDR=0 agentation start

# disable router
AGENTATION_ROUTER_ADDR=0 agentation start

# custom addresses
agentation start --server-addr 127.0.0.1:4747 --router-addr 127.0.0.1:8787`}
          />
        </section>

        <section>
          <h2 id="environment-variables">Environment Variables</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", marginTop: "1rem" }}>
            <thead>
              <tr>
                <th style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.1)", textAlign: "left", fontWeight: 500 }}>Variable</th>
                <th style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.1)", textAlign: "left", fontWeight: 500 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_BASE_URL</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Default API URL for CLI data commands</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_SERVER_ADDR</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Server address for start (set <code>0</code> to disable)</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_ROUTER_ADDR</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Router address for start (set <code>0</code> to disable)</td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_STORE</td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.6)" }}>Storage mode: <code>sqlite</code> (default) or <code>memory</code></td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.6875rem" }}>AGENTATION_DB_PATH</td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.6)" }}>Override SQLite path</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 id="http-api">HTTP API</h2>
          <p>
            The local server exposes endpoints for sessions, annotations, pending work, and event streams.
            See the <a href="/api">API page</a> for endpoint details.
          </p>
        </section>
      </article>

      <Footer />
    </>
  );
}
