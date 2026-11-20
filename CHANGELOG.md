# Changelog

## 1.3.1 - 2026-11-20

### Fixes
- No sidebar button (☰) in the header: the banner no longer draws one in front of the title, and Home Assistant's own stays hidden.

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
