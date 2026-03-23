# Agentation Release Troubleshooting

## Current release path

- Package: `@alexgorbatchev/agentation`
- Version source of truth before tagging: `packages/agentation/package.json`
- Release workflow: `.github/workflows/release.yml`
- Publish method: GitHub Actions trusted publishing with `npm publish --provenance`

## Known failure modes

### `oven-sh/setup-bun` version drift

Symptom:

- CI or release behaves differently locally vs GitHub Actions because Bun versions do not match.

Fix:

- Keep `.github/workflows/release.yml` and `package.json#packageManager` pinned to the same Bun version.
- Regenerate `bun.lock` with that Bun version when dependency metadata changes.

### npm provenance `E422` repository mismatch

Symptom:

- npm rejects the publish because the sigstore provenance bundle does not match `repository.url`.

Fix:

- Set `packages/agentation/package.json` to:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/alexgorbatchev/agentation"
}
```

### Tag exists but npm version does not

Symptom:

- The tag is present in GitHub, but `npm view @alexgorbatchev/agentation versions --json` does not include that version.

Fix:

1. Inspect the failed run with `gh run view -R alexgorbatchev/agentation <run-id> --log-failed`.
2. Confirm the version never published.
3. Delete the failed tag locally and remotely.
4. Cut a new patch version instead of reusing the failed one.

## Release sanity checks

Run these checks after the workflow succeeds:

```bash
npm view @alexgorbatchev/agentation version
git tag --list 'v*'
gh run list -R alexgorbatchev/agentation --workflow release.yml --limit 5
```
