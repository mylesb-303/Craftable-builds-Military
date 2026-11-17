# v1.7.1 in-game test — Full Runways

1. Load a flat creative world on iPad or Xbox. Type `/tickingarea list` and check there are fewer than 4 ticking areas.
2. Tablet → Runways & Taxiways → **Full Runway — Fighter (Short)** → enter `09`.
   - The preview footprint appears. Walk to the far end and check that it is outlined.
   - Choose Construct Here. The progress bar finishes, and the far end reads **27** when seen from its approach.
3. Spawn an F-22 on the near threshold. Take off northbound and land back on the same runway.
   - Taxi off using the rapid exit, then down the parallel taxiway to the holding point.
4. Use the tablet's Snap (out) with **Taxiway Straight** selected. It should attach to the east apron link stub.
5. Undo the runway. All terrain should come back.
6. Repeat with the **Medium** runway, using `27L`. The far end should read **09R**. Test with a C-130J or KC-135.
7. Repeat with the **Long** runway, using `36`. The far end should read **18**.
   - Taxi a C-5M from a holding bay to the runway. Check that the wings clear the signs and lights.
   - Take off, then land.
8. Night check: stay on the Long runway until midnight and check that no hostile mobs spawn on the paved areas or the grass strips.
9. Report the build time for the Long runway on each device, and any frame drops while it builds.
