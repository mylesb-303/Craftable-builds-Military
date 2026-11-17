# v1.7.2 in-game test — sectioned runways

1. Build the **Short** runway with the number `09`.
   - The chat should say it is built in 3 sections.
   - The action bar should count sections 1/3 → 3/3.
2. Fly the length of the runway and check:
   - There are no gaps or seams where two sections meet.
   - The far end reads 27.
3. Undo it. All three sections should come back as the original terrain.
4. Build the **Long** runway (14 sections).
   - Note how long it takes and whether the game stutters.
   - Run `/tickingarea list` while it builds. Only one `cavira_build_*` area should be there at a time.
5. Undo the Long runway.
6. Repeat step 4 on Xbox.
