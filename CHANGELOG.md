# Changelog

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
