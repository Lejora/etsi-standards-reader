# Release Process

This project publishes Windows installers through GitHub Releases.

## Required Setup

- Repository: `Lejora/etsi-standards-reader`
- Application id: `io.github.Lejora.etsi-standards-reader`
- Author: `Lejora`
- License: MIT

For GitHub publishing from a local machine, set a `GH_TOKEN` or
`GITHUB_RELEASE_TOKEN` environment variable with permission to create releases
and upload release assets.

Windows code signing is optional for this project at the current stage.
Unsigned installers are acceptable for the first GitHub Releases, but Windows
may show a SmartScreen or security warning when users launch the installer.

If signing becomes necessary later, provide one of the following:

- A PFX/P12 code signing certificate and password, exposed to electron-builder
  as `CSC_LINK` and `CSC_KEY_PASSWORD`.
- A configured Windows signing provider such as Azure Trusted Signing.

Do not block the release solely on signing while the app is still in early
distribution.

## Local Release Build

1. Confirm the working tree contains only intended changes.
2. Update `package.json` version and `CHANGELOG.md`.
3. Run `npm install --package-lock-only` if package metadata changed.
4. Run `npm audit --audit-level=moderate`.
5. Run `npm run build`.
6. Run `npm run dist:win` for a local installer.
7. Run `npm run publish:github` to create a draft GitHub Release and upload the
   Windows installer.

## GitHub Actions Release

The repository includes `.github/workflows/release.yml`.

1. Push a version tag such as `v0.1.0`, or run the workflow manually.
2. Review the generated draft release on GitHub.
3. Publish the draft after the smoke test passes.
4. If a signing certificate is added later, update the workflow to pass the
   signing secrets before publishing the installer.

The workflow uses `npm install` instead of `npm ci` because the current
Tailwind optional WASM package metadata can make `npm ci` reject the lockfile
even after a normal install succeeds.

## GitHub Release Notes

Use the `CHANGELOG.md` section for the release version as the release body.
Attach the generated installer and block map from the `release/` directory.

## Smoke Test Before Publishing

- Install the generated setup on Windows.
- Launch from the Start menu and verify the application name and icon.
- Import a PDF from drag-and-drop and from the import button.
- Open a PDF in Reading mode and Original mode.
- Run a search and confirm highlights appear in the reader.
- Download the managed PDF back to the Downloads folder.
- Remove a document from Home using the three-dot menu.
