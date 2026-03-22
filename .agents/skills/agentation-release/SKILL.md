---
name: agentation-release
description: Publish the `@alexgorbatchev/agentation` component from this repository. Use when preparing a patch, minor, or major release, updating the site changelog, pushing the release tag, watching the GitHub Actions trusted publishing workflow, confirming npm publication, or cleaning up failed unpublished tags.
---

# Agentation Release

Use this skill for package releases, not website-only edits.

## Workflow overview

1. Determine the release scope.
2. Update the package version and changelog.
3. Validate the package and docs app.
4. Commit the release prep.
5. Push `main` and the release tag.
6. Watch the publish workflow.
7. Confirm npm publication.
8. Clean up failed unpublished tags if needed.

Read `references/troubleshooting.md` if the release workflow fails.

## Determine the release scope

- Read `packages/agentation/CLAUDE.md` and `.github/workflows/release.yml`.
- Treat runtime behavior changes as release-significant even if the API surface is unchanged.
- Keep the changelog entry aligned with the actual change.

## Update the release files

- Bump `packages/agentation/package.json` to the intended version.
- Update `packages/example/src/app/changelog/page.tsx`.
- Preserve `packages/agentation/package.json#repository.url`; trusted publishing depends on it.
- Do not change public exports casually.

## Validate before tagging

Run these commands from the repo root:

```bash
pnpm --filter @alexgorbatchev/agentation build
pnpm --filter feedback-tool-example build
```

Run additional targeted tests when the change touches runtime behavior.

## Commit the release prep

Keep release prep separate from unrelated fixes when possible.

## Push the release

```bash
git push origin main
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

Do not run local `npm publish` unless the user explicitly asks for a fallback.

## Watch the publish workflow

```bash
gh run list -R alexgorbatchev/agentation --workflow release.yml --limit 5
gh run watch -R alexgorbatchev/agentation <run-id> --exit-status
gh run view -R alexgorbatchev/agentation <run-id> --log-failed
```

## Confirm publication

```bash
npm view @alexgorbatchev/agentation version
npm view @alexgorbatchev/agentation versions --json
```

If the site changelog changed and production needs verification, use the `agentation-vercel` skill afterward.

## Clean up failed unpublished tags

If the workflow failed before npm accepted the release, delete the tag before cutting a replacement version:

```bash
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
```

Only delete tags that never published to npm.
