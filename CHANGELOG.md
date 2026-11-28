# Changelog

## 1.7.2 - 2026-11-28

### Fixes
- Subviews: the banner's back button works again (#27). Since Home Assistant made its back arrow a link to `back_path`, a click sent to the hidden arrow was ignored; the button now calls Home Assistant's own back (`back_path`, else the page you came from), or clicks the link inside the arrow.

## 1.7.1 - 2026-11-27

### Fixes
- The banner no longer checks the page every 1.5 s: a theme switch (applied on the page's root element), a dashboard saved, a panel added or a theme edited (Home Assistant's `lovelace_updated`, `panels_updated` and `themes_updated` events, open to every user) and coming back to the tab redraw it when they happen.

## 1.7.0 - 2026-11-27

### Features
- New scenes: `pool` (outdoor: ripples while the pump runs, underwater light, heat pump fan, robot cleaner, cover rolled to its position), `game_room` (neon sign in its color, arcade cabinet, pool table under its lamp, TV and console), `living_room` (floor lamp, sofa, TV, roller shutter), `kitchen` (lights under the cabinets, hob steaming while cooking, oven lit, hood fan, dishwasher programme) and `dining_room` (pendant lamp and candle, roller shutter). French names work too: `piscine`, `salle_de_jeux`, `salon`, `cuisine`, `salle_a_manger`.
- Seven more: `cellar` (wine racks, water heater, humidity drops, leak sensor), `attic` (roof window and its shutter), `guest_room` (a suitcase when a guest stays), `home_cinema` (projector beam, film on the screen, sound waves), `gym` (treadmill belt, standing fan), `workshop` (3D printer at work, table saw) and `veranda` (roof blinds, ceiling fan, hanging lights) — also `cave`, `grenier`, `chambre_d_amis`, `cinema`, `salle_de_sport`, `atelier`.
- Scene names may contain an apostrophe (`chambre d'amis`).

## 1.6.0 - 2026-11-26

### Features
- Subviews get the banner (#22): no tabs, a back button in place of the sidebar button — it clicks Home Assistant's own back arrow, so `back_path` keeps working —, the subview's title and icon, the dashboard's title as subtitle. A subview may have its own `dashboard_header:` block (`enabled: false` turns it off there); `subviews: false` in the dashboard's block keeps the native header on subviews. Subviews used to keep the native header: set `subviews: false` to keep it that way.
- `mode: auto` (#22): compact where Home Assistant lays the page out for a phone, illustrated elsewhere, switched live on rotation and resizing. `compact_below: <px>` sets the window width to switch at instead.

## 1.5.0 - 2026-11-26

### Features
- Thirteen new scenes: the rooms of the house — `bathroom` (bath steaming with the humidity, extractor fan), `toilet` (free / occupied sign), `bedroom` (bedside lamps, roller shutter, sleep), `nursery` (night light, mobile turning with the music), `kids_room`, `teen_room` (PC screen, LED strip in its color), `garage` (sectional door at its position, car inside or away), `hallway` (motion sensor), `office` (screens, desk lamp, "on air" light), `laundry` (washer and dryer drums turning) —, `entrance` (outside: porch light, doorbell, letterbox flag, parcel), `entryway` (inside: lock LED, alarm keypad) and `garden` (sprinkler, robot mower, garden lamps).
- The new scenes have English names, with their French names as aliases (`salle_de_bain`, `chambre_bebe`, `jardin`…). Scene names may be written with spaces, dashes and accents (`Salle de bain`, `chambre-bébé`).
- `entrance` now picks the new outside `entrance` scene (it was an alias of `couloir`); the hallway shows a room door instead of the front door.

## 1.4.1 - 2026-11-24

### Maintenance
- The card source is split into ES modules: `src/` (entry `src/index.js`), cut at its sections, with the translations in one file per language (`i18n/<lang>.js`). `scripts/bundle.mjs` concatenates them back, in their original order, into the same single file and per-language files as before; the tests evaluate that bundle.

## 1.4.0 - 2026-11-22

### Features
- App panels: add-on pages opened from the sidebar (ingress, e.g. Terminal & SSH at `/core_ssh`) get a banner too, set by URL path under `dashboard_header.panels:` of any dashboard. The banner takes the place of the panel's small header, sidebar button included, and the app's frame keeps the rest of the height; kiosk mode is left untouched. Load the file with `frontend: extra_module_url` too for app pages opened first.
- Energy panel: the built-in `/energy` panel gets the full banner (its tabs, buttons and folding), set under `panels: energy:` with a block per tab under `views:`.
- Energy scene layouts for its tabs (`scene_state.layout`): `overview` (grid line, gas meter and water tap with today's use), `electricity` (Linky in the Tempo color, solar panels, battery) and `now` (power running from the grid and the panels to the house, back to the grid when exporting).
- Loaded twice (dashboard resource and `extra_module_url`), only the first copy runs.

## 1.3.4 - 2026-11-21

### Fixes
- Phones: the sun of the Home, Energy and Family scenes no longer sits under the title and the icon (or half out of the band). On narrow screens it is anchored to the right, just left of the house, whatever the phone's width.

## 1.3.3 - 2026-11-21

### Fixes
- The room kept for Home Assistant's buttons at the right of the band is measured again whenever their row changes width: some of them come after the page is drawn, and the status pill could run under them (the + and search buttons).

## 1.3.2 - 2026-11-20

### Fixes
- Safari: the dashboard no longer stays laid out a sidebar's width wider than the window now and then after loading (the right column and the toolbar's buttons, the edit pencil among them, out of sight until a trip through the edit mode). The banner is no longer redrawn by the first message of its states subscription, which only repeats what it has just drawn, and a little after it comes in the page is laid out again with the sidebar in place.

## 1.3.1 - 2026-11-20

### Fixes
- A CSS color given to `accent`, `status.color` (a template or an entity state too) or `scene_state.bin` stays a single value: one carrying `;`, braces, `url()` or quotes is ignored and the scene's color is used.

### Performance
- The banner follows only the entities its configuration reads (`subscribe_entities`), instead of every state change of the home.

## 1.3.0 - 2026-11-20

### Features
- Cars scene layouts: `driveway` (the cars in front of the house and its garage, a car away leaves a dashed spot) and `station` (price totem, canopy, the car with a low tank at the pump); vehicles accept `{ picture, home, low }`, prices `{ label: entity / template / value }`.

### Fixes
- The sidebar button is back on phones: the banner draws it in front of the title whenever Home Assistant's would show (notification dot included) and opens the sidebar the same way.

## 1.2.0 - 2026-11-19

### Features
- Cars scene: the roadside of ha-vehicle-card (sky gradient, sun or moon, drifting clouds, hills, street lamp lit at night, bush, 10 px road) and each car drawn as its own picture — `scene_state.vehicles` takes picture entities (`image.*`, ha-renault-picture, a device tracker with a picture) or URLs, up to three; plain cars as in ha-vehicle-card otherwise.

## 1.1.0 - 2026-11-19

### Features
- The icon badge is back in front of the dashboard title (per-scene MDI icon, `icon` option to choose another).

## 1.0.1 - 2026-11-19

### Fixes
- No icon badge in front of the dashboard title any more: the title starts the header (the `icon` option is removed).

## 1.0.0 - 2026-11-19

### Features
- Illustrated dashboard headers in the style of the ha-* cards, set per dashboard with a top-level `dashboard_header:` block: a 90 px scene with the dashboard's title, a live subtitle, a status pill and text tabs.
- Eight scenes: house, devices, cars, energy, system, security, family and outdoor, each following the home through `scene_state` (lit windows, robot vacuum, Tempo color, rack LEDs, alarm and lock, school flag and bin, rain and terrace lamp).
- Compact mode (one bar, pill tabs), and an illustrated header that folds to the compact bar when scrolling.
- Title, subtitle, status text and color, and scene states from entities or templates, followed live.
- Day and night scenes from the Home Assistant theme, or forced with `illustration_theme`.
- Home Assistant's own toolbar kept and restyled (sidebar button, search, Assist, dashboard menu); native header in edit mode, on subviews, on views with `enabled: false` and on dashboards without the block.
- Per-view overrides, phone layout (scene under the buttons, status dot, scrolling tabs), 22 languages.
