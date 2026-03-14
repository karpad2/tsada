HEIST — Custom Texture Folder
==============================

Drop PNG files here to override the default procedural textures.

File naming (must match exactly):
  Floors:
    floor_tile.png        — checkerboard tile (bank, office)
    floor_marble.png      — marble (jewelry, penthouse, museum)
    floor_wood.png        — wood planks (pawn, hotel)
    floor_carpet.png      — dark carpet (office suites)
    floor_casino.png      — red casino carpet
    floor_metal.png       — metal grating (warehouse, plant)
    floor_asphalt.png     — outdoor asphalt (armored, dockyard)
    floor_concrete.png    — rough concrete (prison, bunker)
    floor_linoleum.png    — clean linoleum (techlab, police)
    floor_stone.png       — stone tiles (museum wings)

  Walls:
    wall_plaster.png      — white plaster (bank, hotel)
    wall_brick.png        — red brick (pawn, warehouse)
    wall_concrete.png     — bare concrete (prison, bunker, military)
    wall_panel.png        — office drywall panels
    wall_metal.png        — corrugated metal (industrial)
    wall_marble.png       — marble cladding (casino, penthouse)
    wall_tile.png         — bathroom/lab tiles

Recommended PNG size: 128×128 or 256×256 pixels, seamlessly tileable.

To enable PNG mode, open src/game/levels/textures.js
and change the first line to:
  const MODE = 'png'
