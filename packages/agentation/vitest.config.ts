import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * Rewrites the storybook addon-vitest setup file path from the deep pnpm
 * store path to a local wrapper, working around pnpm + vitest browser mode
 * incompatibility where the browser can't fetch files from .pnpm paths.
 */
function rewriteStorybookSetupFile(): Plugin {
  const localSetup = path.resolve(__dirname, ".storybook/vitest.setup.ts");
  return {
    name: "rewrite-storybook-setup",
    enforce: "post",
    config(config) {
      const setupFiles = config.test?.setupFiles;
      if (Array.isArray(setupFiles)) {
        for (let i = 0; i < setupFiles.length; i++) {
          if (
            typeof setupFiles[i] === "string" &&
            setupFiles[i].includes("@storybook/addon-vitest") &&
            setupFiles[i].includes("setup-file")
          ) {
            setupFiles[i] = localSetup;
          }
        }
      }
    },
  };
}

const shouldSkipBrowserProjectForCoverage = process.argv.includes("--coverage");

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        define: {
          __VERSION__: JSON.stringify("test"),
        },
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          css: true,
          include: ["src/**/*.test.{ts,tsx}"],
        },
      },
      ...(shouldSkipBrowserProjectForCoverage
        ? []
        : [
            {
              plugins: [
                react(),
                storybookTest({ configDir: ".storybook" }),
                rewriteStorybookSetupFile(),
              ],
              define: {
                __VERSION__: JSON.stringify("test"),
              },
              test: {
                name: "storybook",
                globals: true,
                browser: {
                  enabled: true,
                  headless: true,
                  provider: playwright({
                    launchOptions: { headless: true },
                  }),
                  instances: [{ browser: "chromium" }],
                },
              },
            },
          ]),
    ],
  },
});
