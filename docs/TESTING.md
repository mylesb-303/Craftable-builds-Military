# Prototype v0.1.0 — Minecraft Test Plan

## Import

1. Obtain `Cavira_Craftable_Builds_0.1.0.mcaddon`.
2. Open it with Minecraft Bedrock.
3. Confirm both **CAVIRA Craftable Builds - Military BP** and **RP** import successfully.
4. Create a fresh Creative test world.
5. Activate the Behavior Pack. Its Resource Pack dependency should activate the matching RP.
6. Experimental toggles should not be necessary for this prototype.

## Tablet

1. Run:
   `/give @s cavira_builds:construction_tablet`
2. Confirm the tablet has a custom inventory icon and the name **CAVIRA Construction Tablet**.
3. Hold it and use/interact.
4. Confirm the category menu opens and lists:
   Core Base, Army, Air Force, Navy, Strategic / Joint, Logistics & Support, Modular Base.
5. Open Army or another future category and confirm the prototype reports that no structures are available yet.
6. Open **Core Base** and select **Guard Post**.

## Guard Post placement

1. Find a flat area at least 8×8 blocks.
2. Stand within 12 blocks and look directly at a ground block where the north-west corner of the build should begin.
3. Use the Construction Tablet.
4. Choose **Core Base → Guard Post**.
5. Confirm the confirmation page reports coordinates, facing direction, and footprint.
6. Select **Construct**.
7. Confirm an 8×8 modern guard post appears.
8. Verify the build uses vanilla blocks only.
9. Repeat while facing North, East, South and West and confirm the entrance rotates with the building.

## Validation tests

- Try placing with a tree, wall, chest, or other solid block inside the 8×8×8 volume. Construction should be rejected.
- Try placing across a hole or water. Construction should be rejected because the footprint lacks solid level support.
- Change the area after opening the confirmation form, then press Construct. The script should validate a second time and reject the placement if it is no longer clear.

## iPad / Xbox focus

- Verify the form buttons can be selected reliably with touch controls on iPad.
- Verify the form buttons can be navigated with a controller on Xbox.
- Confirm no input lock occurs after closing or cancelling a form.
- Confirm the pack imports without experimental feature warnings.
- Confirm construction does not cause a noticeable freeze.

## Known prototype limitations

- Only the Guard Post is implemented.
- Placement preview/ghost blocks are not implemented yet.
- Materials are not deducted yet.
- Terrain levelling is intentionally not automatic.
- Structure placement is synchronous because the first build is only 8×8×8; large structures will require staged/batched construction.
- The Guard Post entrance is intentionally open in v0.1.0 to avoid directional door-state complexity until the rotation framework has been tested in-game.
