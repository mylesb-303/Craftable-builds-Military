# v1.6.0 In-Game Test Checklist

Use a **copy** of your world. Remove the older Craftable Builds packs, import `Cavira_Craftable_Builds_1.6.0_Airfield_Dishes_ChunkLoading.mcaddon`, and activate both packs.

## 1. Super-Heavy Hangar (the bug you reported)
- [ ] Stand where you were before, then choose Tablet → Air Force → Super-Heavy Aircraft Hangar. You should see "Large site — loading the whole build area…", and then the preview should appear.
- [ ] Construct it. Note roughly how many seconds it takes.
- [ ] Run `/tickingarea list`. There should be **no** `cavira_build_*` areas left.

## 2. Runway (Tablet → Runways & Taxiways)
- [ ] Build **Runway Threshold & Designator**, enter `38R`, and check the number reads correctly from the blast-pad end.
- [ ] Build a **Runway Touchdown Zone** and use **Snap to End of Runway Threshold**. It should line up seamlessly.
- [ ] Snap on a few **Runway Straights**, then a **Runway / Taxiway Junction**.
- [ ] Build a second **Runway Threshold** (e.g. `20L`) using **Snap to End**. It should face the other way.
- [ ] Build a **Taxiway Straight** and use **Snap to Taxiway Exit**. Then snap on a **Holding Point**, a **Taxiway Curve** and another straight.
- [ ] Taxi a plane along the centrelines. Check the lights glow at night and the edge lamps sit flush.

## 3. Dishes
- [ ] Build each standalone dish and each dish station. Compare the colours with your reference images.

## Report back
Send screenshots, plus any `[CAVIRA]` content-log lines.
