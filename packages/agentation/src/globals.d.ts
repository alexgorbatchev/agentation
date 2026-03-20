// Build-time constants injected by tsup
declare const __VERSION__: string;

interface ImportMetaEnv {
  readonly STORYBOOK_AGENTATION_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
