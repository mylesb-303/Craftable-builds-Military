# CAVIRA Craftable Builds — Military

Minecraft Bedrock add-on for craftable, deployable military-base infrastructure built entirely from vanilla Minecraft blocks.

## Prototype v0.1.0

Development branch: `codex/initial-construction-system`

Implemented in this first vertical slice:

- Behavior Pack + Resource Pack manifests
- `cavira_builds:construction_tablet`
- Crafting recipe for the Construction Tablet
- Construction category UI:
  - Core Base
  - Army
  - Air Force
  - Navy
  - Strategic / Joint
  - Logistics & Support
  - Modular Base
- Reusable structure registry
- Guard Post prototype
- Four-direction rotation
- Flat-ground and obstruction validation
- Confirmation screen before construction
- GitHub Actions packaging workflow

The Guard Post uses vanilla blocks only. No custom building blocks are introduced.

## Safety / branch policy

`main` is the protected baseline.

Do not merge development work until it has been tested successfully in Minecraft Bedrock on the user's target devices, especially iPad and Xbox.

## Minecraft target

- Bedrock stable 26.40+
- `@minecraft/server` 2.9.0
- `@minecraft/server-ui` 2.1.0
- No experimental toggles intentionally required by this prototype

## Test

See [`docs/TESTING.md`](docs/TESTING.md).
