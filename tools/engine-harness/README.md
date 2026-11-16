# Engine harness

Offline regression test for the construction system. It runs every registered
structure, in all four rotations, through the staged construction engine against
a mocked `@minecraft/server`, and checks:

- the staged result is block-for-block identical to the legacy single-tick build
- undo restores the original terrain exactly
- an unloaded chunk aborts the build before any block changes
- the world-height check
- preview persistence, crash recovery, and that recovery never touches a live preview

This proves the logic, not real Bedrock behaviour. In-game testing is still required.

```bash
rm -rf tools/engine-harness/scripts
cp -r Cavira_Craftable_Builds_BP/scripts tools/engine-harness/scripts
cd tools/engine-harness && node test.mjs
```
