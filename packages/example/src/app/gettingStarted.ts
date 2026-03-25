interface IGettingStarted {
  installCommand: string;
  installCommandBlock: string;
  startCommand: string;
  devCommand: string;
  piCommand: string;
  browserUrl: string;
  componentSnippet: string;
}

export const gettingStarted: IGettingStarted = {
  installCommand:
    "npm install -D @alexgorbatchev/agentation @alexgorbatchev/agentation-cli @alexgorbatchev/pi-agentation",
  installCommandBlock: `npm install -D \\
  @alexgorbatchev/agentation \\
  @alexgorbatchev/agentation-cli \\
  @alexgorbatchev/pi-agentation`,
  startCommand: "npx agentation start",
  devCommand: "npm run dev",
  piCommand: "npx pi-agentation",
  browserUrl: "http://localhost:3000",
  componentSnippet: `import { Agentation } from "@alexgorbatchev/agentation";

export function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === "development" ? (
        <Agentation projectId="my-project" />
      ) : null}
    </>
  );
}`,
};
