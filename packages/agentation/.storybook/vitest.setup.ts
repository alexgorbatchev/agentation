import { afterEach, beforeAll, vi } from "vitest";
import { setProjectAnnotations } from "@storybook/react";
import { Channel } from "storybook/internal/channels";
import * as previewAnnotations from "./preview";

// Replicate @storybook/addon-vitest setup-file locally so browser mode does not depend on an internal node_modules path
const transport = { setHandler: vi.fn(), send: vi.fn() };
globalThis.__STORYBOOK_ADDONS_CHANNEL__ ??= new Channel({ transport });

// Project annotations from preview config
const annotations = setProjectAnnotations([previewAnnotations]);
beforeAll(annotations.beforeAll);

// Error message enhancement for storybook test failures
afterEach(({ task }) => {
  const meta = (task as any).meta;
  if (
    task.type === "test" &&
    task.result?.state === "fail" &&
    meta?.storyId &&
    task.result.errors?.[0]
  ) {
    const currentError = task.result.errors[0];
    const storyUrl = `http://localhost:6006/?path=/story/${meta.storyId}`;
    currentError.message = `\n\x1B[34mClick to debug in Storybook: ${storyUrl}\x1B[39m\n\n${currentError.message}`;
  }
});
