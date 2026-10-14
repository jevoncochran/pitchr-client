# pitchr-client

React + Vite frontend for the Pitchr CRM. Talks only to `../pitchr-server` (NestJS), never directly to `../pitchr-ai`. Confirmation dialogs use `src/components/ui/ConfirmModal.tsx`, not `window.confirm`.

## Docs

- **Specs** (in the repo that owns most of the feature, usually pitchr-server or pitchr-ai) describe how a feature works **now** and why. Keep the status line current (Draft → Building → Built). When you change a feature's behavior, update its spec in the same change; once built, remove open questions and rewrite plans as plain descriptions.
- **Build plans** (next to the spec) record how a feature was built, step by step. Update them while building; once the feature ships, mark them complete and leave them as history.
- List new docs in the README's **Docs** section.
