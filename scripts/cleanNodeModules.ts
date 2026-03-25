import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

function addCandidateDirectories(filePath: string, candidateDirectories: Set<string>): void {
  if (filePath === 'package.json' || filePath.endsWith('/package.json')) {
    candidateDirectories.add(join(dirname(filePath), 'node_modules'));
  }

  const segments = filePath.split('/');
  const nodeModulesIndex = segments.indexOf('node_modules');
  if (nodeModulesIndex !== -1) {
    candidateDirectories.add(segments.slice(0, nodeModulesIndex + 1).join('/'));
  }
}

async function consumeNullSeparatedStream(
  stream: ReadableStream<Uint8Array>,
  handleFilePath: (filePath: string) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let bufferedText = '';

  try {
    while (true) {
      const result = await reader.read();
      if (result.done) {
        break;
      }

      bufferedText += decoder.decode(result.value, { stream: true });
      const filePaths = bufferedText.split('\0');
      bufferedText = filePaths.pop() ?? '';

      for (const filePath of filePaths) {
        if (filePath.length > 0) {
          handleFilePath(filePath);
        }
      }
    }

    bufferedText += decoder.decode();
    if (bufferedText.length > 0) {
      handleFilePath(bufferedText);
    }
  } finally {
    reader.releaseLock();
  }
}

function collapseNestedDirectories(candidateDirectories: Iterable<string>): string[] {
  const sortedDirectories = [...candidateDirectories].sort((left, right) => {
    if (left.length !== right.length) {
      return left.length - right.length;
    }

    return left.localeCompare(right);
  });

  const collapsedDirectories: string[] = [];
  for (const directory of sortedDirectories) {
    const hasParentDirectory = collapsedDirectories.some((parentDirectory) => {
      return directory === parentDirectory || directory.startsWith(`${parentDirectory}/`);
    });

    if (!hasParentDirectory) {
      collapsedDirectories.push(directory);
    }
  }

  return collapsedDirectories;
}

async function discoverNodeModulesDirectories(): Promise<string[]> {
  const candidateDirectories = new Set<string>();
  const rgProcess = Bun.spawn(['rg', '-uuu', '--files', '-0'], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  if (rgProcess.stdout === null || typeof rgProcess.stdout === 'number') {
    throw new Error('rg did not provide a readable stdout stream.');
  }

  if (rgProcess.stderr === null || typeof rgProcess.stderr === 'number') {
    throw new Error('rg did not provide a readable stderr stream.');
  }

  const stderrPromise = new Response(rgProcess.stderr).text();
  await consumeNullSeparatedStream(rgProcess.stdout, (filePath) => {
    addCandidateDirectories(filePath, candidateDirectories);
  });

  const exitCode = await rgProcess.exited;
  const stderrOutput = (await stderrPromise).trim();
  if (exitCode !== 0) {
    throw new Error(stderrOutput.length > 0 ? stderrOutput : `rg exited with code ${exitCode}.`);
  }

  return collapseNestedDirectories(candidateDirectories);
}

function isDryRun(): boolean {
  return Bun.argv.includes('--dry-run');
}

export async function cleanNodeModules(): Promise<void> {
  const directories = await discoverNodeModulesDirectories();
  const dryRun = isDryRun();

  if (directories.length === 0) {
    console.log('No node_modules directories found.');
    return;
  }

  for (const directory of directories) {
    if (!dryRun) {
      rmSync(directory, { recursive: true, force: true });
    }

    console.log(`${dryRun ? '[dry-run] ' : ''}${directory}`);
  }

  console.log(
    `${dryRun ? 'Would remove' : 'Removed'} ${directories.length} node_modules ` +
      `director${directories.length === 1 ? 'y' : 'ies'}.`,
  );
}

if (import.meta.main) {
  await cleanNodeModules();
}
