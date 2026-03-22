import "server-only";

import { cache } from "react";
import { codeToHtml, type BundledLanguage } from "shiki";

const DEFAULT_CODE_LANGUAGE: BundledLanguage = "tsx";
const SHIKI_THEME = "github-light";

const CODE_LANGUAGE_ALIASES: Readonly<Record<string, BundledLanguage>> = {
  bash: "bash",
  json: "json",
  markdown: "markdown",
  md: "md",
  tsx: "tsx",
  typescript: "typescript",
};

function resolveCodeLanguage(language: string): BundledLanguage {
  const normalizedLanguage = language.toLowerCase();

  return CODE_LANGUAGE_ALIASES[normalizedLanguage] ?? DEFAULT_CODE_LANGUAGE;
}

export const getHighlightedCodeHtml = cache(
  async (code: string, language: string = DEFAULT_CODE_LANGUAGE): Promise<string> => {
    return codeToHtml(code.trim(), {
      lang: resolveCodeLanguage(language),
      theme: SHIKI_THEME,
    });
  },
);
