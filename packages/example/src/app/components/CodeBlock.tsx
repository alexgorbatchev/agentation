import type { JSX } from "react";

import { CodeBlockCopyButton } from "./CodeBlockCopyButton";
import { getHighlightedCodeHtml } from "../lib/getHighlightedCodeHtml";

interface ICodeBlockProps {
  code: string;
  language?: string;
  copyable?: boolean;
}

export async function CodeBlock({
  code,
  language = "tsx",
  copyable = false,
}: ICodeBlockProps): Promise<JSX.Element> {
  const trimmedCode = code.trim();
  const highlightedCodeHtml = await getHighlightedCodeHtml(trimmedCode, language);

  return (
    <div style={{ position: "relative" }}>
      <div className="code-block" dangerouslySetInnerHTML={{ __html: highlightedCodeHtml }} />
      {copyable && <CodeBlockCopyButton text={trimmedCode} />}
    </div>
  );
}
