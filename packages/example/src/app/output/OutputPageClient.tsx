"use client";

import { useCallback, useEffect, useRef, useState, type JSX } from "react";

type OutputFormat = "compact" | "standard" | "detailed" | "forensic";

interface IOutputPageClientProps {
  highlightedOutputExamples: Record<OutputFormat, string>;
}

interface ICodeBlockProps {
  highlightedCodeHtml: string;
  textOpacity?: number;
}

interface IAnimatedCodeBlockProps {
  highlightedCodeHtml: string;
}

const FORMAT_STORAGE_KEY = "agentation-output-format";

function isOutputFormat(value: string): value is OutputFormat {
  return (
    value === "compact" ||
    value === "standard" ||
    value === "detailed" ||
    value === "forensic"
  );
}

function CodeBlock({ highlightedCodeHtml, textOpacity = 1 }: ICodeBlockProps): JSX.Element {
  return (
    <div className="code-block">
      <div
        style={{ opacity: textOpacity, transition: "opacity 0.15s ease-out" }}
        dangerouslySetInnerHTML={{ __html: highlightedCodeHtml }}
      />
    </div>
  );
}

function AnimatedCodeBlock({ highlightedCodeHtml }: IAnimatedCodeBlockProps): JSX.Element {
  const [textOpacity, setTextOpacity] = useState(1);
  const [displayedHighlightedCodeHtml, setDisplayedHighlightedCodeHtml] = useState(highlightedCodeHtml);
  const pendingHighlightedCodeHtml = useRef<string | null>(null);
  const isFirstRender = useRef(true);
  const fadeOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeInTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (fadeOutTimer.current) {
      clearTimeout(fadeOutTimer.current);
      fadeOutTimer.current = null;
    }

    if (fadeInTimer.current) {
      clearTimeout(fadeInTimer.current);
      fadeInTimer.current = null;
    }

    pendingHighlightedCodeHtml.current = highlightedCodeHtml;
    setTextOpacity(0);

    fadeOutTimer.current = setTimeout(() => {
      const nextHighlightedCodeHtml = pendingHighlightedCodeHtml.current;

      if (!nextHighlightedCodeHtml) {
        return;
      }

      setDisplayedHighlightedCodeHtml(nextHighlightedCodeHtml);
      pendingHighlightedCodeHtml.current = null;
      fadeOutTimer.current = null;
      fadeInTimer.current = setTimeout(() => {
        setTextOpacity(1);
        fadeInTimer.current = null;
      }, 20);
    }, 150);

    return () => {
      if (fadeOutTimer.current) {
        clearTimeout(fadeOutTimer.current);
        fadeOutTimer.current = null;
      }

      if (fadeInTimer.current) {
        clearTimeout(fadeInTimer.current);
        fadeInTimer.current = null;
      }
    };
  }, [highlightedCodeHtml]);

  return <CodeBlock highlightedCodeHtml={displayedHighlightedCodeHtml} textOpacity={textOpacity} />;
}

export function OutputPageClient({ highlightedOutputExamples }: IOutputPageClientProps): JSX.Element {
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("standard");

  useEffect(() => {
    const savedFormat = localStorage.getItem(FORMAT_STORAGE_KEY);

    if (savedFormat && isOutputFormat(savedFormat)) {
      setOutputFormat(savedFormat);
    }
  }, []);

  const handleFormatChange = useCallback((format: OutputFormat): void => {
    setOutputFormat(format);
    localStorage.setItem(FORMAT_STORAGE_KEY, format);
    window.dispatchEvent(new CustomEvent("agentation-format-change", { detail: format }));
  }, []);

  return (
    <article className="article">
      <header>
        <h1>Output</h1>
        <p className="tagline">How Agentation structures feedback for AI agents</p>
      </header>

      <section>
        <p>
          When you copy, you get structured markdown that agents can parse and act on. Four formats are available:
        </p>
        <div className="format-toggle" style={{ marginTop: "0.75rem" }}>
          <button
            className={outputFormat === "compact" ? "active" : ""}
            onClick={() => handleFormatChange("compact")}
          >
            Compact
          </button>
          <button
            className={outputFormat === "standard" ? "active" : ""}
            onClick={() => handleFormatChange("standard")}
          >
            Standard
          </button>
          <button
            className={outputFormat === "detailed" ? "active" : ""}
            onClick={() => handleFormatChange("detailed")}
          >
            Detailed
          </button>
          <button
            className={outputFormat === "forensic" ? "active" : ""}
            onClick={() => handleFormatChange("forensic")}
          >
            Forensic
          </button>
        </div>
        <AnimatedCodeBlock highlightedCodeHtml={highlightedOutputExamples[outputFormat]} />
      </section>

      <section>
        <h2>When to use each format</h2>
        <ul>
          <li><strong>Compact</strong> &mdash; Quick feedback with minimal context. Good for small fixes.</li>
          <li><strong>Standard</strong> &mdash; Balanced detail for most use cases. Includes location and classes.</li>
          <li><strong>Detailed</strong> &mdash; Full context with bounding boxes and nearby text. Good for complex issues.</li>
          <li><strong>Forensic</strong> &mdash; Maximum detail including computed styles. For debugging layout/style issues.</li>
        </ul>
      </section>

      <section>
        <h2>React component detection</h2>
        <p>
          In React apps, the output includes the component tree for each annotated element
          (e.g., <code>&lt;App&gt; &lt;Dashboard&gt; &lt;SubmitButton&gt;</code>).
          The level of detail adapts to your output format: Compact omits React data,
          Standard shows filtered components, Detailed uses smart matching, and Forensic shows everything.
          Toggle React detection on/off in settings.
        </p>
      </section>

      <section>
        <h2>Source file detection</h2>
        <p>
          In development mode, Agentation automatically detects the source file and line number
          for annotated elements (e.g., <code>src/components/Button.tsx:42</code>).
          This works with Vite, Next.js, Webpack, and Turbopack. Agents can use the <strong>Source</strong> line
          to jump directly to the right file instead of searching.
        </p>
      </section>

      <section>
        <h2>Why structured output?</h2>
        <p>
          Selectors and class names let agents <code>grep</code> your codebase directly instead of guessing which
          element you mean. See <a href="/">how it works</a> for more.
        </p>
      </section>

      <section>
        <h2>Customizing output</h2>
        <p>
          The copied output is plain markdown. Feel free to edit it before pasting into your agent:
        </p>
        <ul>
          <li><strong>Add context</strong> &mdash; prepend with &ldquo;I&rsquo;m working on the dashboard page...&rdquo;</li>
          <li><strong>Prioritize</strong> &mdash; reorder annotations by importance</li>
          <li><strong>Remove noise</strong> &mdash; delete annotations that aren&rsquo;t relevant</li>
          <li><strong>Add instructions</strong> &mdash; append &ldquo;Fix these issues and run the tests&rdquo;</li>
        </ul>
      </section>
    </article>
  );
}
