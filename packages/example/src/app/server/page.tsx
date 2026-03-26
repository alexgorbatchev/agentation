import type { JSX } from "react";

import { Footer } from "../Footer";
import { CodeBlock } from "../components/CodeBlock";

export default function ServerPage(): JSX.Element {
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
            Agentation uses a local Go CLI + HTTP server workflow. Start the stack locally, point the toolbar at the
            HTTP endpoint, and process annotations from your coding agent via project-scoped CLI commands.
          </p>
          <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            <code>toolbar</code> → <code>agentation server</code> → <code>project-scoped CLI loop</code>
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
            code={`<Agentation projectId="my-project" endpoint="http://127.0.0.1:4747" />`}
          />
          <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            In the common local workflow you can omit <code>endpoint</code> and let the toolbar probe the default local
            server automatically. <code>projectId</code> is still required so the CLI can scope sessions, queues, and
            watch flows correctly.
          </p>

          <h3 id="project-scoped-agent-loops">3. Discover the project and process annotations</h3>
          <CodeBlock
            language="bash"
            copyable
            code={`# discover recently active project IDs
agentation projects --json

# inspect one project's sessions + annotation counts
agentation project my-project --json

# fetch pending work for exactly one project
agentation pending my-project --json

# block until new project-scoped work arrives
agentation watch my-project --timeout 300 --json`}
          />
          <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            Load the UI at least once before running <code>projects</code> or <code>watch</code>. The browser registers
            the <code>projectId</code> with the local server, and that registration is what makes project discovery and
            project-scoped agent loops work.
          </p>

          <h3>4. Act on annotations</h3>
          <CodeBlock
            language="bash"
            copyable
            code={`# acknowledge that the agent picked the item up
agentation ack <annotation-id>

# reply in the annotation thread
agentation reply <annotation-id> --message "Working on it"

# resolve with an optional summary
agentation resolve <annotation-id> --summary "Updated spacing in Hero.tsx"

# dismiss with a required reason
agentation dismiss <annotation-id> --reason "Out of scope for this change"`}
          />
        </section>

        <section>
          <h2 id="service-configuration">Service Configuration</h2>
          <p>
            The local server is required for synced sessions, CLI commands, and real-time agent workflows. If you only
            want local copy/paste output, the browser toolbar can still run without it. The router remains optional and
            can be disabled by setting its address to <code>0</code>.
          </p>
          <CodeBlock
            language="bash"
            copyable
            code={`# disable router only
AGENTATION_ROUTER_ADDR=0 agentation start

# custom addresses
agentation start --server-addr 127.0.0.1:4747 --router-addr 127.0.0.1:8787

# require auth for router mutations and /open forwarding
AGENTATION_ROUTER_TOKEN=secret-token agentation start`}
          />
          <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            When <code>AGENTATION_ROUTER_TOKEN</code> is set, mutating router calls such as <code>/register</code>,
            <code>/unregister</code>, and <code>/open</code> must provide the token.
          </p>
        </section>

        <section>
          <h2 id="lifecycle-isolation">Lifecycle Isolation</h2>
          <p>
            If you run multiple local Agentation stacks on the same machine — for example during integration tests or
            when working on several repos at once — set an explicit PID file and log paths so each stack has its own
            lifecycle scope.
          </p>
          <CodeBlock
            language="bash"
            copyable
            code={`AGENTATION_PID_FILE=/tmp/agentation-my-project.pid \
AGENTATION_LOG_FILE=/tmp/agentation-my-project.stack.log \
AGENTATION_SERVER_LOG_FILE=/tmp/agentation-my-project.server.log \
AGENTATION_ROUTER_LOG_FILE=/tmp/agentation-my-project.router.log \
agentation start --background`}
          />
        </section>

        <section>
          <h2 id="http-api">HTTP API</h2>
          <p>
            The local server exposes endpoints for sessions, annotations, pending work, action requests, and event
            streams. See the <a href="/api">API page</a> for the HTTP surface and public React props.
          </p>
          <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            For the exhaustive CLI package, install, environment-variable, and release reference, see the{" "}
            <a
              href="https://github.com/alexgorbatchev/agentation-cli/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              agentation-cli README
            </a>
            .
          </p>
        </section>
      </article>

      <Footer />
    </>
  );
}
