# Project Launcher

Project Launcher is a Raycast extension for opening saved project paths with your configured apps.

## Commands

- `Open Path`: Search saved paths and recent launches, then open with a configured app.
- `Manage Paths`: Add, edit, and remove saved project paths.
- `Manage Apps`: Configure the apps available in the launcher.

## Development & Testing

### Prerequisites

- macOS
- [Raycast](https://www.raycast.com/) installed and signed in
- Node.js
- npm

Raycast extension development also requires the Raycast app to be available locally when you run the development server.

### Setup

Clone the repository, install dependencies, and start Raycast development mode:

```bash
git clone <your-repo-url>
cd project-launcher-raycast-ext
npm install
npm run dev
```

In this repo, `npm run dev` runs `ray develop`. That starts the extension in Raycast development mode, imports the local extension into Raycast if needed, and keeps it available for local iteration while the process is running.

### Interactive Testing In Raycast

After `npm run dev` is running:

1. Open Raycast.
2. Search for `Project Launcher` or one of the command names.
3. Open `Open Path`, `Manage Paths`, and `Manage Apps`.
4. Verify that each command renders and the basic flows work as expected.

This is the main way to test the extension UI and end-to-end command behavior during development.

### Scripts

- `npm run dev`: Starts local Raycast development mode with `ray develop`.
- `npm run test`: Runs the automated Vitest suite with `vitest run`.
- `npm run lint`: Runs Raycast linting with `ray lint`.
- `npm run build`: Validates the extension build with `ray build -e dist`.

### Automated Tests

Automated tests in this repo are Vitest unit tests for library logic under `src/lib/__tests__`.

- Test runner: `vitest run`
- Environment: Node
- Include pattern: `src/lib/__tests__/**/*.test.ts`

These tests help cover internal logic, but they do not replace interactive testing inside Raycast. There are no end-to-end UI tests documented in this repo today.
