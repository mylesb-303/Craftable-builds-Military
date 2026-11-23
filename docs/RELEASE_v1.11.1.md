# Cavira Craftable Builds — v1.11.1 "Map Table Frames"

## Operations Map Room
- **2-wide walkways all the way round the map table.**
  - The table is now 21 × 9 (map area 19 × 7).
  - The stools that blocked the side aisles are gone.
  - The aisle between the table and the briefing dais is 2 wide.
- **Item frames on the table:** 133 up-facing frames cover the whole map area, so you can drop your own maps straight in. Neighbouring maps line up into one big map.
- **The coloured land map stays underneath:** live terrain where the land was loaded, the designed theatre map elsewhere. You can see it through the empty frames.
  - The raised hills on the table are gone, because the frames need that layer.
- **Rim markers:** the "you are here" / unit candles have moved to the table rim.

## Validation (static/automated, not in-game)
- **Build test:** passes in all 4 rotations.
- **Map room check (all 6 cases):** 133 frames, table fully filled, live scan still works.
- **Walkway check:** the new check finds 0 blocked cells in the 2-wide ring round the table.
- **Access/light pass:** 0 unreached, 0 dark.
- **Hologram check:** pass.
