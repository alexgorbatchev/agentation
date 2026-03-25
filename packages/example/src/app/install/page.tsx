import type { JSX } from "react";

import { Footer } from "../Footer";
import { CodeBlock } from "../components/CodeBlock";
import { gettingStarted } from "../gettingStarted";

export default function GettingStartedPage(): JSX.Element {
  return (
    <>
      <article className="article getting-started-article">
        <header>
          <h1>Getting Started</h1>
          <p className="tagline">Install Agentation, run the local stack, and let Pi pick up browser feedback</p>
        </header>

        <section>
          <h2>Install the happy path</h2>
          <p>
            Install the frontend package, the local Agentation CLI, and the Pi integration package as development
            dependencies in the same project.
          </p>
          <CodeBlock code={gettingStarted.installCommandBlock} language="bash" copyable />
          <p
            style={{
              fontSize: "0.875rem",
              color: "rgba(0,0,0,0.55)",
              marginTop: "0.5rem",
            }}
          >
            Install all three as project-local development dependencies. That is the supported happy path for the
            local Agentation + Pi workflow.
          </p>
        </section>

        <section>
          <h2>Mount the component</h2>
          <p>
            Only <code>projectId</code> is required on <code>{"<Agentation />"}</code>. Everything else is optional
            unless you need to override the default local workflow.
          </p>
          <CodeBlock code={gettingStarted.componentSnippet} language="tsx" />
          <p
            style={{
              fontSize: "0.875rem",
              color: "rgba(0,0,0,0.55)",
              marginTop: "0.5rem",
            }}
          >
            Gate the component behind <code>NODE_ENV</code> so it only renders in development. By default, Agentation
            probes the local server automatically, so props like <code>endpoint</code>, <code>sessionId</code>, and
            <code> onSessionCreated</code> are optional for the common setup.
          </p>
        </section>

        <section>
          <h2>Run the workflow</h2>
          <ol>
            <li>
              Start the local Agentation server:
              <CodeBlock code={gettingStarted.startCommand} language="bash" copyable />
            </li>
            <li>
              Start your web app. We will assume the usual development command:
              <CodeBlock code={gettingStarted.devCommand} language="bash" copyable />
            </li>
            <li>
              Open <code>{gettingStarted.browserUrl}</code> so the mounted <code>{"<Agentation />"}</code> component
              connects to the local server and registers your <code>projectId</code>.
            </li>
            <li>
              After the project has registered, start Pi&apos;s Agentation loop:
              <CodeBlock code={gettingStarted.piCommand} language="bash" copyable />
            </li>
          </ol>
          <p
            style={{
              fontSize: "0.875rem",
              color: "rgba(0,0,0,0.55)",
              marginTop: "0.5rem",
            }}
          >
            Run these commands from the project root. <code>pi-agentation</code> bundles the Agentation Pi skill, but
            on a fresh install it can only discover projects that the UI has already registered with the server.
          </p>
        </section>

        <section>
          <h2>Leave a comment and watch it work</h2>
          <ol>
            <li>With the page loaded, use the toolbar to leave a comment on your UI.</li>
            <li>Watch <code>pi-agentation</code> detect the annotation batch and begin working on it.</li>
          </ol>
          <p>
            The important contract is that the <code>projectId</code> in <code>{"<Agentation />"}</code> must match the
            project Pi resolves from this repository. The UI registers that project with the local server when it
            connects, and the server keeps a list of active projects for 24 hours after their last activity. That means
            a brand-new install must load the UI at least once before <code>pi-agentation</code> can discover the
            project.
          </p>
        </section>

        <section>
          <h2>Advanced configuration</h2>
          <p>
            Most teams do not need extra props to get started. If you want to override endpoints, sessions, webhooks,
            or editor integration, use the <a href="/api">API reference</a>.
          </p>
        </section>
      </article>

      <Footer />
    </>
  );
}
