# v1.4.1 In-Game Test Checklist

Use a **copy** of your world. Remove the v1.4.0 packs, import
`Cavira_Craftable_Builds_1.4.1_Staged_Construction.mcaddon`, and activate both
packs. Turn on the same experiments you used for v1.4.0.

Note your device (Xbox / iPad / Windows / Realm) next to each result.

## 1. Staged construction — the main fix
- [ ] Build a **Guard Post**. It should complete almost instantly, and the action bar should show progress and then "complete".
- [ ] Build the **Large Strategic Satellite Array** (the biggest build). The game should stay responsive and the % should count up. **Write down roughly how many seconds it takes.**
- [ ] While that big build is running, use the tablet. You should see "Construction job in progress — …%" and no menu.
- [ ] Walk around during a big build. There should be no freeze or "script hang" error.
- [ ] Check that doors, ladders and pressure plates are all present (they are placed last).

## 2. Undo
- [ ] Undo the large build. The progress should show "Restoring", and the terrain should return exactly, including grass and flowers.
- [ ] Build next to the sea (Seawall, Pier, Submarine Pen), then undo. The water should come back, and no water should be left trapped inside the build.

## 3. Preview protection
- [ ] In **Survival**, start a preview and try to mine a lime or cyan marker. It should not break, and an action-bar message should appear.
- [ ] Start a preview, then **leave the world** and rejoin. All markers should be gone.
- [ ] Start a preview, then **force-close Minecraft** and reopen the world. Within about 5 seconds the markers should be gone.
- [ ] Start a preview, go through a Nether portal and back, then cancel. The markers should be removed in the Overworld.

## 4. Regression (should behave exactly like v1.4.0)
- [ ] Reposition, rotate left/right and cancel all work.
- [ ] Each category menu opens. Pick one build per category and construct it.
- [ ] Try a build that would go above the height limit. You should get a clear world-height message.

## Report back
Send the device, any failing step, a screenshot, and any content-log errors that start with `[CAVIRA]`.
