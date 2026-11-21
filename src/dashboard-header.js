// Dashboard Header — illustrated dashboard headers for Home Assistant, matching the ha-* cards.
//
// A dashboard resource (no card): on every dashboard whose YAML carries a top-level `dashboard_header:` block, it
// replaces the look of the top bar (title and view tabs) with a 90 px illustrated band and a row of text tabs, or a
// compact bar with pill tabs. Home Assistant's own toolbar stays in place, restyled: the sidebar button, search,
// Assist and the dashboard menu keep working exactly as before. In edit mode, on subviews and on dashboards without
// the block, the native header is left untouched.
(() => {
  const VERSION = "__VERSION__";
  const TAG = "dashboard-header-banner";
  const STYLE_ID = "dashboard-header-style";
  const BAND = 90; // illustrated band, ground bar included
  const TABS = 48; // tab row under the band
  const COMPACT = 64; // compact bar
  const COLLAPSE_AT = 24; // scroll offset (px) where an illustrated header folds to its compact bar
  const EXPAND_AT = 8; // and where it unfolds again (hysteresis: no flicker around one value)

  // The status palette of the ha-* cards (light / dark), shared with the ha-neutral theme.
  const PALETTE = {
    light: { green: "#1d7f46", amber: "#9a5a00", blue: "#2459bd", cyan: "#08707f", violet: "#6b3fc0", red: "#bf2b2b", gray: "#5f6670" },
    dark: { green: "#4cc57f", amber: "#f0a43a", blue: "#79a6f6", cyan: "#3cc3d9", violet: "#a98bf0", red: "#f06a6a", gray: "#9aa1ab" },
  };
  const COLOR_ALIASES = { purple: "violet", grey: "gray", orange: "amber", yellow: "amber", teal: "cyan", success: "green", warning: "amber", error: "red", info: "blue" };

  // Scene colors, day (light theme) and night (dark theme).
  const SKY = {
    light: {
      sky: "#dce8f6", text: "#1d2127", sub: "#46505e", glass: "rgba(255,255,255,0.85)", stars: 0, sun: "#f4b73e", cloud: "#ffffff",
      hill: "#b9d3b0", tree: "#7fa877", house: "#f7f3ec", roof: "#8b95a5", winOn: "#f2c15a", winOff: "#c9d6e6", door: "#a7b1bf",
      grass: "#86a97b", wall: "#ece7df", wall2: "#e4e8ee", floor: "#d9c3a3", floor2: "#c6ccd4", floorBar: "#9aa2ad", wood: "#a9875e",
      deck: "#c9a77c", appl: "#f7f5f1", line: "#8b95a5", paper: "#ffffff", asphalt: "#8e939b", road: "#6f757e", glassWin: "#c9d6e6",
      tyre: "#3a3f47", rack: "#3a4152", unit: "#566079", lamp: "#c9d0db", lampOn: "#f2c15a", clay: "#c27c55", white: "#e6e8eb",
    },
    dark: {
      sky: "#1b2333", text: "#eceef1", sub: "#b4bccb", glass: "rgba(30,33,39,0.8)", stars: 1, sun: "#e8e3cf", cloud: "#2a3447",
      hill: "#243049", tree: "#1f3a33", house: "#3a4256", roof: "#2c3242", winOn: "#f2c15a", winOff: "#4a5368", door: "#232838",
      grass: "#3d4a3f", wall: "#262a33", wall2: "#1f232b", floor: "#3a3229", floor2: "#2a2e36", floorBar: "#3b414c", wood: "#5a4632",
      deck: "#4a3a2a", appl: "#3a4256", line: "#7a849a", paper: "#c9d0db", asphalt: "#2c3038", road: "#3b414c", glassWin: "#4a5368",
      tyre: "#0f1115", rack: "#11141a", unit: "#2a2f3a", lamp: "#59627a", lampOn: "#f2c15a", clay: "#8a5a3c", white: "#d9dce1",
    },
  };

  const STRINGS = {
    en: { views: "Views" },
    fr: { views: "Vues" },
    de: { views: "Ansichten" },
    es: { views: "Vistas" },
    it: { views: "Viste" },
    nl: { views: "Weergaven" },
    pt: { views: "Vistas" },
    pl: { views: "Widoki" },
    sr: { views: "Прикази" },
    "sr-Latn": { views: "Prikazi" },
    ro: { views: "Vizualizări" },
    da: { views: "Visninger" },
    sv: { views: "Vyer" },
    bg: { views: "Изгледи" },
    ru: { views: "Представления" },
    uk: { views: "Подання" },
    hu: { views: "Nézetek" },
    sk: { views: "Zobrazenia" },
    cs: { views: "Zobrazení" },
    sl: { views: "Pogledi" },
    lv: { views: "Skati" },
    el: { views: "Προβολές" },
  };
  const langOf = (hass) => {
    const l = hass?.locale?.language || hass?.language || "en";
    if (STRINGS[l]) return l;
    const base = String(l).split("-")[0];
    return STRINGS[base] ? base : "en";
  };
  const t = (hass, key) => (STRINGS[langOf(hass)] || STRINGS.en)[key] ?? STRINGS.en[key];

  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  // ---- Values: a literal, an entity id (its state) or a template ({{ … }}, rendered by Home Assistant) ----
  const ENTITY_ID = /^[a-z_]+\.[a-z0-9_]+$/;
  const isTemplate = (v) => typeof v === "string" && /\{\{|\{%/.test(v);
  const TRUE_STATES = new Set(["on", "true", "yes", "open", "opening", "home", "cleaning", "running", "active", "playing", "heat", "detected", "problem", "1"]);
  const truthy = (v) => {
    if (v === true) return true;
    if (v === false || v == null) return false;
    if (typeof v === "number") return v > 0;
    const s = String(v).trim().toLowerCase();
    if (TRUE_STATES.has(s)) return true;
    if (s.startsWith("armed_")) return true;
    const n = Number(s);
    return s !== "" && !Number.isNaN(n) && n > 0;
  };

  // A palette name (green, amber, blue, cyan, violet, red, gray and their aliases) or any CSS color.
  // A CSS color as written goes into style attributes: one value only (no ";", braces, url() or quotes), so that a
  // template or a sensor's state cannot add other declarations (a background image fetched from elsewhere…).
  const cssColor = (s) => (/^[#\w\s(),.%+-]+$/.test(s) && !/url\s*\(|expression/i.test(s) ? s : null);
  const colorOf = (v, mode, fallback) => {
    if (v == null || v === "") return fallback;
    const s = String(v).trim();
    const key = COLOR_ALIASES[s.toLowerCase()] || s.toLowerCase();
    return PALETTE[mode][key] || cssColor(s) || fallback;
  };

  // Tempo day color, in French or English (state of the RTE Tempo / Linky sensors).
  const tempoColor = (v, mode, sky) => {
    const s = String(v ?? "").toLowerCase();
    if (/bleu|blue/.test(s)) return PALETTE[mode].blue;
    if (/blanc|white/.test(s)) return sky.white;
    if (/rouge|red/.test(s)) return PALETTE[mode].red;
    return PALETTE[mode].gray;
  };

  // Waste bin color (named in French or English, or a CSS color); no bin when empty / off.
  const BIN_COLORS = { jaune: "#f2c94c", yellow: "#f2c94c", vert: "#3f9a5a", green: "#3f9a5a", bleu: "#3a74c9", blue: "#3a74c9", marron: "#8a5a3c", brown: "#8a5a3c", gris: "#7d848e", gray: "#7d848e", grey: "#7d848e", noir: "#30343b", black: "#30343b" };
  const binColor = (v) => {
    if (v == null || v === false) return null;
    const s = String(v).trim().toLowerCase();
    if (!s || s === "off" || s === "false" || s === "none" || s === "unknown" || s === "unavailable") return null;
    if (s === "on" || s === "true") return BIN_COLORS.jaune;
    for (const [name, c] of Object.entries(BIN_COLORS)) if (s.includes(name)) return c;
    return cssColor(String(v).trim()) || BIN_COLORS.gris;
  };

  // ---- Scenes ----
  // Each scene draws an SVG (viewBox 1250 × 90 on phones, 1600 × 90 on wider screens, anchored right) from its state keys and the colors. The decor sits
  // in the right half so that the title on the left stays on a calm background; the ground bar is always 4 px.
  const ground = (fill) => `<rect x="0" y="86" width="1600" height="4" fill="${fill}"/>`;
  const stars = (c, pts) => `<g fill="#ffffff" opacity="${c.stars}">${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`;
  // Hills drawn to x 1400, carried on flat to 1600 (the extra sky wide screens show under the buttons).
  const hills = (c, d) => `<path d="${d.replace(/ (\d+) V90 H0z$/, " $1 L1600 $1 V90 H0z")}" fill="${c.hill}"/>`;
  const house = (c, { x = 1094, lit = false, lit2 = false, door = c.door, led } = {}) =>
    `<rect x="${x}" y="50" width="104" height="36" fill="${c.house}"/>` +
    `<polygon points="${x - 10},52 ${x + 52},18 ${x + 114},52" fill="${c.roof}"/>` +
    `<rect x="${x + 12}" y="58" width="18" height="14" rx="2" fill="${lit ? c.winOn : c.winOff}"/>` +
    `<rect x="${x + 74}" y="58" width="18" height="14" rx="2" fill="${lit2 ? c.winOn : c.winOff}"/>` +
    `<rect x="${x + 42}" y="62" width="20" height="24" rx="2" fill="${door}"/>` +
    (led ? `<circle class="${led.blink ? "blink" : ""}" cx="${x + 57}" cy="75" r="2.2" fill="${led.color}"/>` : "");
  // The sun (or moon). On phones the band shows only the right end of the 1250-wide viewBox, as wide as the screen,
  // so a sun at a fixed x of the wide layout lands under the title and the icon: it is anchored to the right instead,
  // just left of the house, above the subtitle and clear of Home Assistant's buttons, whatever the phone's width.
  const sun = (c, narrow, x, y, r) => `<circle cx="${narrow ? 1046 : x}" cy="${narrow ? 18 : y}" r="${narrow ? 11 : r}" fill="${c.sun}"/>`;
  const tree = (c, x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.tree}"/><rect x="${x - 2}" y="${y + 4}" width="4" height="${86 - y - 4}" fill="${c.tree}"/>`;
  const pylon = (c, x) => `<path d="M${x - 10} 86 L${x} 24 L${x + 10} 86 M${x - 6} 60 H${x + 6} M${x - 4} 44 H${x + 4} M${x - 14} 30 H${x + 14}" fill="none" stroke="${c.line}" stroke-width="2"/>`;
  // The roadside of ha-vehicle-card (rnSceneSvg / RN_SCENE_STYLE), at its own scale: its sky gradient, sun or moon,
  // drifting clouds, two hills, street lamp (lit at night), bush and 10 px road; the cars park on the road.
  const VC = {
    light: { far: "#a7d39f", hill: "#86c27f", bush: "#4f9a3a", pole: "#5f6b7a", bulb: "#e8e0d0", glass: "#cfe6f7", tyre: "#22262b",
      road: "#858c94", roadLine: "#6f767d", dash: 0.85, cloud: 0.92, drive: "#c4c9cf", canopy: "#f4f6f8", pump: "#f7f5f1", board: "#2e3440", boardText: "#e6e8eb" },
    dark: { far: "#1d3a4a", hill: "#17303d", bush: "#1e3d2a", pole: "#7d8793", bulb: "#ffd27a", glass: "#3b4b5e", tyre: "#22262b",
      road: "#2c323b", roadLine: "#3a414c", dash: 0.5, cloud: 0.1, drive: "#272c34", canopy: "#3a4256", pump: "#3a4256", board: "#11141a", boardText: "#c9d0db" },
  };
  const VC_SKY = {
    light: "linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 34%, #b9def8 70%, #9fd0f3 100%)",
    dark: "linear-gradient(90deg, #1b2f52 0%, #15284a 36%, #0f1f3d 72%, #0a1830 100%)",
  };
  const VC_CLOUD = "M-14,4 C-17,4 -18,0 -14.5,-1 C-14,-5 -8,-6 -6,-3 C-4,-8 4,-8 5,-2 C9,-3 12,0 10,4 Z";
  // ha-vehicle-card's plain car (rnSceneCar), drawn when a vehicle has no picture.
  const plainCar = (v, color, x, y = 79) =>
    `<g transform="translate(${x} ${y}) scale(2.1)"><path d="M0 -6 Q1 -11 8 -12 L14 -16 H26 L33 -12 Q40 -11 40 -6 V-2 H0Z" fill="${color}"/>` +
    `<path d="M15 -15 H25 L30 -12 H11Z" fill="${v.glass}"/><circle cx="9" cy="-2" r="3.4" fill="${v.tyre}"/><circle cx="31" cy="-2" r="3.4" fill="${v.tyre}"/></g>`;
  const streetLamp = (v, x, night) =>
    (night ? `<circle cx="${x + 7.6}" cy="40" r="16" fill="#ffd27a" opacity="0.3"/>` : "") +
    `<rect x="${x}" y="38" width="1.4" height="42" fill="${v.pole}"/>` +
    `<path d="M${x + 0.6} 39 Q${x + 0.6} 36 ${x + 4.6} 36 H${x + 8.6}" fill="none" stroke="${v.pole}" stroke-width="1.2"/>` +
    `<rect x="${x + 4.6}" y="36" width="7" height="2.4" rx="1" fill="${v.pole}"/>` +
    `<rect x="${x + 5.6}" y="38.2" width="5" height="1.2" rx="0.6" fill="${v.bulb}"/>`;
  // Where each picture parks on the road (x of its 124 × 66 box, as in ha-vehicle-card), for one to three vehicles.
  const PARKING = { 1: [1150], 2: [1066, 1196], 3: [1000, 1116, 1232] };
  // The vehicles of the cars scene: a list of picture entities (image.*, or any entity with an entity_picture, e.g.
  // the device tracker), picture URLs, or { picture } objects; or a number of plain cars. At most three.
  const vehicleList = (raw, hass, val) => {
    const picture = (v) => {
      if (v && typeof v === "object") return picture(v.picture ?? v.entity ?? v.image);
      // (an entity id of a tracker or sensor without a picture gives no picture: the plain car is drawn)
      if (typeof v !== "string" || !v) return null;
      if (ENTITY_ID.test(v)) return hass?.states?.[v]?.attributes?.entity_picture || null;
      return /^(https?:\/\/|\/)/.test(v) ? v : null;
    };
    // An object can also tell whether the car is at home ({ home: device_tracker / binary sensor / template value })
    // and whether its tank is low ({ low: … }), for the driveway and station layouts.
    const flag = (v) => {
      if (v == null) return undefined;
      if (isTemplate(v)) return val ? val(v) : undefined;
      if (typeof v === "string" && ENTITY_ID.test(v)) return hass?.states?.[v]?.state;
      return v;
    };
    if (Array.isArray(raw))
      return raw.slice(0, 3).map((v) => {
        const o = v && typeof v === "object" ? v : {};
        const home = flag(o.home);
        return { img: picture(v), away: home !== undefined && !(home === "home" || truthy(home)), low: truthy(flag(o.low)) };
      });
    const n = Math.max(1, Math.min(3, Number.parseInt(raw ?? 2, 10) || 2));
    return Array.from({ length: n }, () => ({ img: null, away: false, low: false }));
  };

  const SCENES = {
    maison: {
      icon: "mdi:home-assistant",
      accent: "blue",
      bg: "sky",
      keys: ["lights"],
      draw: (c, st, _p, _mode, _hass, _val, narrow) =>
        stars(c, [[620, 18, 1.2], [760, 36, 1], [900, 14, 1.4], [1310, 22, 1.2]]) +
        sun(c, narrow, 860, 30, 13) +
        `<g fill="${c.cloud}"><ellipse cx="660" cy="30" rx="34" ry="9"/><ellipse cx="682" cy="24" rx="20" ry="9"/><ellipse cx="1290" cy="40" rx="28" ry="7"/></g>` +
        hills(c, "M0 72 Q175 54 350 68 T700 64 T1050 70 T1400 62 V90 H0z") +
        tree(c, 1040, 64, 11) +
        tree(c, 1236, 60, 13) +
        house(c, { lit: truthy(st.lights), lit2: truthy(st.lights) }) +
        ground(c.grass),
    },
    equipements: {
      icon: "mdi:devices",
      accent: "violet",
      bg: "wall",
      keys: ["vacuum", "appliance", "printer"],
      draw: (c, st, p) => {
        const away = /clean|return|moving|mowing/.test(String(st.vacuum ?? "").toLowerCase());
        const running = truthy(st.appliance);
        const printerAlert = truthy(st.printer);
        return (
          `<rect x="0" y="72" width="1600" height="14" fill="${c.floor}"/>` +
          `<rect x="1000" y="50" width="70" height="24" rx="5" fill="${c.appl}" stroke="${c.line}"/>` +
          `<rect x="1012" y="40" width="46" height="12" fill="${c.paper}" stroke="${c.line}"/>` +
          `<rect x="1012" y="64" width="46" height="4" fill="${c.line}"/>` +
          `<circle class="${printerAlert ? "blink" : ""}" cx="1062" cy="57" r="2.2" fill="${printerAlert ? p.red : p.green}"/>` +
          `<g class="${away ? "robot-away" : ""}"><ellipse cx="1130" cy="77" rx="24" ry="7" fill="${c.line}"/>` +
          `<ellipse cx="1130" cy="73" rx="24" ry="7" fill="${c.appl}" stroke="${c.line}"/><circle cx="1130" cy="71" r="4" fill="${c.line}"/></g>` +
          `<rect x="1162" y="44" width="30" height="34" rx="6" fill="${c.appl}" stroke="${c.line}"/>` +
          `<circle cx="1177" cy="52" r="2.5" fill="${away ? p.amber : p.green}"/>` +
          `<rect x="1230" y="28" width="54" height="56" rx="4" fill="${c.appl}" stroke="${c.line}"/>` +
          `<rect x="1236" y="34" width="42" height="6" rx="2" fill="${c.line}"/>` +
          (running ? `<rect class="progress" x="1236" y="44" width="28" height="3" rx="1.5" fill="${p.amber}"/>` : "") +
          `<circle cx="1257" cy="64" r="12" fill="none" stroke="${c.line}" stroke-width="2"/>` +
          ground(c.wood)
        );
      },
    },
    voitures: {
      icon: "mdi:car",
      accent: "cyan",
      band: (mode) => VC_SKY[mode],
      keys: ["vehicles", "layout", "prices"],
      // ha-vehicle-card's roadside; each car is its own picture (the official photo of ha-renault-picture, the
      // integration's image entity…) or ha-vehicle-card's plain car. Three layouts: on the road, on the driveway of
      // the house (a car away leaves its spot empty), at the station (price totem, the low car at the pump).
      draw: (c, st, p, mode, hass, val) => {
        const v = VC[mode];
        const night = mode === "dark";
        const cars = vehicleList(st.vehicles, hass, val);
        const layout = /drive|allee|allée|home|maison/.test(String(st.layout ?? "").toLowerCase())
          ? "driveway"
          : /station|fuel|pump|carbu/.test(String(st.layout ?? "").toLowerCase())
            ? "station"
            : "road";
        const colors = [p.cyan, p.amber, p.violet];
        const car = (k, x, y = 20) =>
          cars[k].img
            ? `<image href="${esc(cars[k].img)}" x="${x}" y="${y}" width="124" height="66" preserveAspectRatio="xMidYMax meet"/>`
            : plainCar(v, colors[k], x + 20, y + 59);
        const sky =
          (night
            ? [[1012, 8], [1044, 18], [1096, 6], [1132, 26], [1166, 8], [1190, 22], [970, 30], [1112, 16], [880, 12], [930, 22]]
                .map(([x, y], i) => `<circle class="${i % 2 ? "twinkle" : ""}" cx="${x}" cy="${y}" r="0.8" fill="#ffffff" opacity="0.8"/>`)
                .join("") +
              `<circle cx="1248" cy="12" r="5.5" fill="#f3eed2"/><circle cx="1250.5" cy="10" r="4.5" fill="#0c1b37"/>`
            : `<circle cx="1248" cy="12" r="9" fill="#ffd65a" opacity="0.28"/><circle cx="1248" cy="12" r="6" fill="#ffd65a"/>`) +
          `<path class="drift" transform="translate(1126 14)" d="${VC_CLOUD}" fill="#ffffff" opacity="${v.cloud}"/>` +
          `<path class="drift slow" transform="translate(1174 24) scale(.75)" d="${VC_CLOUD}" fill="#ffffff" opacity="${v.cloud}"/>` +
          `<path d="M880,80 C960,70 1020,64 1100,66 C1180,68 1260,60 1340,62 C1420,64 1500,60 1600,62 L1600,80Z" fill="${v.far}"/>` +
          `<path d="M840,80 C960,74 1100,75 1600,72 L1600,80Z" fill="${v.hill}"/>`;
        const road =
          `<rect x="0" y="80" width="1600" height="10" fill="${v.road}"/><rect x="0" y="80" width="1600" height="1" fill="${v.roadLine}"/>` +
          `<path d="M0 85 H1600" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="9 9" opacity="${v.dash}"/>`;
        const bush = (x) => `<g fill="${v.bush}"><circle cx="${x}" cy="72" r="6"/><circle cx="${x - 7}" cy="75" r="5"/></g>`;
        const slots = PARKING[cars.length];

        if (layout === "driveway") {
          // The house and its garage on the left, the cars on the driveway; an away car leaves a dashed spot.
          const spot = (x) => `<rect x="${x + 14}" y="66" width="96" height="13" rx="4" fill="none" stroke="${v.pole}" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.7"/>`;
          return (
            sky +
            `<rect x="890" y="36" width="112" height="44" fill="${c.house}"/>` +
            `<polygon points="880,38 946,10 1012,38" fill="${c.roof}"/>` +
            `<rect x="902" y="46" width="18" height="14" rx="2" fill="${night ? c.winOn : c.winOff}"/>` +
            `<rect x="930" y="52" width="60" height="28" rx="2" fill="${c.door}"/>` +
            `<path d="M930 59 H990 M930 66 H990 M930 73 H990" stroke="${c.house}" stroke-width="1" opacity="0.5"/>` +
            (night ? `<circle cx="996" cy="47" r="9" fill="#ffd27a" opacity="0.3"/>` : "") +
            `<circle cx="996" cy="47" r="2.2" fill="${night ? "#ffd27a" : v.bulb}"/>` +
            `<path d="M990 80 L1010 70 H1380 L1400 80 Z" fill="${v.drive}"/>` +
            bush(1408) +
            road +
            slots.map((x, k) => (cars[k].away ? spot(x) : car(k, x, 16))).join("")
          );
        }

        if (layout === "station") {
          // Price totem, canopy, pump; the car with a low tank (else the first) parks at the pump.
          const prices = st.prices && typeof st.prices === "object" ? Object.entries(st.prices).slice(0, 2) : [];
          const lang = hass?.locale?.language || hass?.language || "en";
          const price = (raw) => {
            const x = val ? val(raw) : raw;
            const n = Number(x);
            return x === "" || x == null || Number.isNaN(n) ? esc(x ?? "") : n.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 3 });
          };
          const atPump = Math.max(0, cars.findIndex((x) => x.low));
          const order = [atPump, ...cars.map((_, k) => k).filter((k) => k !== atPump)];
          const pos = { 1: [1120], 2: [1120, 1250], 3: [1110, 1220, 1330] }[cars.length];
          return (
            sky +
            `<rect x="0" y="76" width="1600" height="4" fill="${v.drive}"/>` +
            (prices.length
              ? `<path d="M985 80 V30" stroke="${v.pole}" stroke-width="3"/><rect x="930" y="10" width="110" height="${prices.length * 17 + 8}" rx="5" fill="${v.board}"/>` +
                prices
                  .map(
                    ([label, raw], i) =>
                      `<text x="938" y="${24 + i * 17}" font-size="9" font-weight="700" fill="${v.boardText}" font-family="inherit">${esc(String(label).slice(0, 9))}</text>` +
                      `<text x="1032" y="${24 + i * 17}" font-size="10" font-weight="700" text-anchor="end" fill="#f2b33a" font-family="ui-monospace, Menlo, monospace">${price(raw)}</text>`,
                  )
                  .join("")
              : "") +
            `<rect x="1050" y="18" width="330" height="7" rx="2" fill="${v.canopy}"/><rect x="1050" y="25" width="330" height="3" fill="${p.cyan}"/>` +
            `<path d="M1070 28 V80 M1360 28 V80" stroke="${v.pole}" stroke-width="4"/>` +
            `<rect x="1084" y="46" width="22" height="34" rx="3" fill="${v.pump}" stroke="${v.pole}"/>` +
            `<rect x="1088" y="51" width="14" height="8" rx="1" fill="${p.cyan}"/>` +
            `<path d="M1106 56 C1118 56 1122 62 1126 70" fill="none" stroke="${v.tyre}" stroke-width="2"/>` +
            road +
            order.map((k, i) => car(k, pos[i])).join("")
          );
        }

        return sky + streetLamp(v, 1010, night) + bush(1352) + road + slots.map((x, k) => car(k, x)).join("");
      },
    },
    energie: {
      icon: "mdi:lightning-bolt",
      accent: "amber",
      bg: "sky",
      keys: ["tempo", "power"],
      draw: (c, st, p, mode, _hass, _val, narrow) =>
        sun(c, narrow, 880, 30, 14) +
        hills(c, "M0 74 Q250 60 500 70 T1000 66 T1400 70 V90 H0z") +
        `<path d="M966 30 C1080 48 1190 48 1286 30 M994 30 C1100 52 1200 52 1314 30" fill="none" stroke="${c.line}" stroke-width="1"/>` +
        pylon(c, 980) +
        pylon(c, 1300) +
        `<rect x="1112" y="50" width="56" height="36" rx="5" fill="${c.appl}" stroke="${c.line}"/>` +
        `<rect x="1119" y="56" width="42" height="12" rx="2" fill="${tempoColor(st.tempo, mode, c)}"/>` +
        `<path class="${truthy(st.power) ? "pulse" : ""}" d="M1142 72 l-4 7h5l-3 6" fill="none" stroke="${truthy(st.power) ? p.amber : c.line}" stroke-width="1.8" stroke-linecap="round"/>` +
        ground(c.grass),
    },
    systeme: {
      icon: "mdi:server",
      accent: "blue",
      bg: "wall2",
      keys: ["alert"],
      draw: (c, st, p) => {
        const a = String(st.alert ?? "").toLowerCase();
        const level = /error|critical|problem|red/.test(a) ? "error" : truthy(st.alert) || /warn|update|amber/.test(a) ? "warning" : "ok";
        const warn = level === "error" ? p.red : p.amber;
        const led = (x, y, i) => {
          const bad = level !== "ok" && i === 3;
          return `<circle class="${bad ? "blink" : ""}" cx="${x}" cy="${y}" r="1.8" fill="${bad ? warn : i % 2 ? p.blue : p.green}"/>`;
        };
        const units = [18, 34, 50, 66];
        return (
          `<rect x="0" y="76" width="1600" height="10" fill="${c.floor2}"/>` +
          `<rect x="1020" y="44" width="50" height="40" rx="4" fill="${c.rack}"/>` +
          [0, 1, 2, 3].map((i) => `<rect x="${1026 + i * 11}" y="50" width="8" height="28" rx="1" fill="${c.unit}"/>${led(1030 + i * 11, 54, i)}`).join("") +
          `<rect x="1100" y="12" width="70" height="72" rx="4" fill="${c.rack}"/>` +
          units.map((y, i) => `<rect x="1106" y="${y}" width="58" height="11" rx="2" fill="${c.unit}"/>${led(1113, y + 5.5, 0)}${led(1120, y + 5.5, i)}`).join("") +
          `<path d="M1170 72 C1190 72 1195 74 1210 74" fill="none" stroke="${c.line}" stroke-width="2"/>` +
          `<rect x="1210" y="66" width="60" height="14" rx="4" fill="${c.appl}" stroke="${c.line}"/>` +
          `<path d="M1220 66 V54 M1260 66 V54" stroke="${c.line}" stroke-width="2"/>` +
          `<path d="M1222 50 a18 18 0 0 1 36 0 M1230 52 a10 10 0 0 1 20 0" fill="none" stroke="${p.blue}" stroke-width="2" stroke-linecap="round"/>` +
          ground(c.floorBar)
        );
      },
    },
    securite: {
      icon: "mdi:shield-home",
      accent: "green",
      bg: "sky",
      keys: ["alarm", "lock", "camera_privacy"],
      draw: (c, st, p) => {
        const alarm = String(st.alarm ?? "").toLowerCase();
        const alarmColor = /triggered/.test(alarm) ? p.red : /pending|arming/.test(alarm) ? p.amber : alarm.startsWith("armed") ? p.green : p.gray;
        const lock = String(st.lock ?? "locked").toLowerCase();
        const lockColor = lock === "locked" ? p.green : /jammed|open$/.test(lock) ? p.red : p.amber;
        return (
          stars(c, [[660, 18, 1.2], [820, 30, 1]]) +
          hills(c, "M0 74 Q200 62 400 72 T800 68 T1400 70 V90 H0z") +
          `<path d="M960 86 V66 M980 86 V66 M1000 86 V66 M1020 86 V66 M1040 86 V66 M954 72 H1046" stroke="${c.roof}" stroke-width="3"/>` +
          house(c, { led: { color: lockColor, blink: lockColor === p.red } }) +
          `<rect x="1196" y="54" width="16" height="9" rx="2" fill="${c.rack}"/><circle cx="1199" cy="58.5" r="2" fill="${truthy(st.camera_privacy) ? p.violet : p.green}"/>` +
          `<path class="${/triggered/.test(alarm) ? "blink" : ""}" d="M1260 30 l14 5v10c0 9-6 14-14 16-8-2-14-7-14-16V35z" fill="${alarmColor}" opacity="0.9"/>` +
          `<path d="M1254 46 l4 4 8-8" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` +
          ground(c.grass)
        );
      },
    },
    famille: {
      icon: "mdi:calendar-heart",
      accent: "red",
      bg: "sky",
      keys: ["school", "bin"],
      draw: (c, st, p, _mode, _hass, _val, narrow) => {
        const school = st.school === undefined ? true : truthy(st.school);
        const bin = binColor(st.bin);
        return (
          sun(c, narrow, 920, 28, 12) +
          `<g fill="${c.cloud}"><ellipse cx="1000" cy="26" rx="26" ry="8"/><ellipse cx="1350" cy="36" rx="30" ry="8"/></g>` +
          hills(c, "M0 74 Q250 60 500 70 T1000 66 T1400 70 V90 H0z") +
          `<path d="M1150 34 V8" stroke="${c.line}" stroke-width="2"/>` +
          `<rect x="1151" y="${school ? 8 : 20}" width="20" height="12" fill="${school ? p.red : c.line}"/>` +
          `<rect x="1072" y="34" width="156" height="8" fill="${c.roof}"/>` +
          `<rect x="1080" y="42" width="140" height="44" fill="${c.house}"/>` +
          [1090, 1114, 1170, 1194].map((x) => `<rect x="${x}" y="50" width="16" height="12" rx="1" fill="${c.winOff}"/>`).join("") +
          `<rect x="1138" y="58" width="24" height="28" rx="2" fill="${c.door}"/>` +
          (bin ? `<rect x="1258" y="60" width="22" height="26" rx="3" fill="${esc(bin)}"/><rect x="1255" y="56" width="28" height="5" rx="2" fill="${esc(bin)}"/>` : "") +
          ground(c.grass)
        );
      },
    },
    exterieur: {
      icon: "mdi:tree",
      accent: "green",
      bg: "sky",
      keys: ["rain", "lamp"],
      draw: (c, st, p) => {
        const rain = truthy(st.rain);
        const lamp = truthy(st.lamp);
        return (
          stars(c, [[740, 18, 1.2], [1200, 22, 1]]) +
          `<g fill="${c.cloud}"><ellipse cx="900" cy="28" rx="38" ry="10"/><ellipse cx="926" cy="21" rx="22" ry="10"/></g>` +
          (rain
            ? `<g class="rain" stroke="${p.cyan}" stroke-width="2" stroke-linecap="round"><path d="M888 42 l-3 7"/><path d="M904 44 l-3 7"/><path d="M920 42 l-3 7"/><path d="M936 45 l-3 7"/></g>`
            : "") +
          (lamp ? `<circle cx="1020" cy="28" r="16" fill="${c.lampOn}" opacity="0.25"/>` : "") +
          `<path d="M1020 76 V32" stroke="${c.line}" stroke-width="3"/>` +
          `<circle cx="1020" cy="28" r="6" fill="${lamp ? c.lampOn : c.lamp}"/>` +
          `<path d="M1100 42 Q1140 18 1180 42 Z" fill="${p.cyan}"/>` +
          `<path d="M1140 42 V76" stroke="${c.line}" stroke-width="2"/>` +
          `<rect x="1116" y="62" width="48" height="4" rx="2" fill="${c.wood}"/>` +
          `<rect x="1240" y="64" width="20" height="12" rx="2" fill="${c.clay}"/>` +
          `<circle cx="1244" cy="58" r="7" fill="${c.tree}"/><circle cx="1256" cy="56" r="8" fill="${c.tree}"/>` +
          `<rect x="0" y="76" width="1600" height="10" fill="${c.deck}"/>` +
          `<path d="M0 81 H1600" stroke="${c.wood}" stroke-width="1" opacity="0.6"/>` +
          ground(c.wood)
        );
      },
    },
  };
  const SCENE_ALIASES = { home: "maison", house: "maison", devices: "equipements", equipment: "equipements", "équipements": "equipements", cars: "voitures", vehicles: "voitures", energy: "energie", "énergie": "energie", system: "systeme", "système": "systeme", security: "securite", "sécurité": "securite", family: "famille", outdoor: "exterieur", "extérieur": "exterieur" };
  const sceneName = (v) => {
    const s = String(v ?? "maison").toLowerCase();
    if (SCENES[s]) return s;
    if (SCENE_ALIASES[s]) return SCENE_ALIASES[s];
    return s === "none" ? "none" : "maison";
  };

  // Every leaf value of a config block (lists and objects included): the entities and templates it reads.
  const deepValues = (o) => (o && typeof o === "object" ? Object.values(o).flatMap(deepValues) : [o]);

  // ---- Configuration ----
  // The dashboard's `dashboard_header:` block, overlaid by the current view's own block (a view can change the
  // scene, the subtitle… or turn the header off with `enabled: false`).
  const resolveConfig = (lovelaceConfig, viewConfig) => {
    const base = lovelaceConfig?.dashboard_header;
    if (!base || typeof base !== "object") return null;
    const view = viewConfig?.dashboard_header && typeof viewConfig.dashboard_header === "object" ? viewConfig.dashboard_header : {};
    const cfg = { ...base, ...view, scene_state: { ...(base.scene_state || {}), ...(view.scene_state || {}) } };
    if (base.status || view.status) cfg.status = { ...(base.status || {}), ...(view.status || {}) };
    if (cfg.enabled === false) return null;
    const scene = sceneName(cfg.scene);
    const mode = cfg.mode === "compact" ? "compact" : "illustrated";
    return {
      scene,
      mode,
      collapse: mode === "illustrated" && cfg.collapse_on_scroll !== false,
      title: cfg.title,
      subtitle: cfg.subtitle,
      icon: cfg.icon || (SCENES[scene] || SCENES.maison).icon,
      accent: cfg.accent || (SCENES[scene] || SCENES.maison).accent,
      status: cfg.status && (cfg.status.text != null || cfg.status.entity) ? cfg.status : null,
      sceneState: cfg.scene_state,
      illustrationTheme: cfg.illustration_theme === "day" || cfg.illustration_theme === "night" ? cfg.illustration_theme : null,
    };
  };

  // Views as Home Assistant shows them as tabs: no subviews, none hidden from the current user.
  const visibleViews = (views, hass) =>
    (views || [])
      .map((view, index) => ({ view, index }))
      .filter(({ view }) => {
        if (view.subview) return false;
        if (view.visible === false) return false;
        if (Array.isArray(view.visible)) return view.visible.some((v) => v?.user === hass?.user?.id);
        return true;
      });

  // ---- Locating Home Assistant's dashboard root ----
  const findRoot = () => {
    const main = document.querySelector("home-assistant")?.shadowRoot?.querySelector("home-assistant-main");
    const panel = main?.shadowRoot?.querySelector("ha-panel-lovelace");
    return panel?.shadowRoot?.querySelector("hui-root") || document.querySelector("hui-root");
  };
  const currentViewIndex = (root, views) => {
    if (typeof root._curView === "number") return root._curView;
    const seg = decodeURIComponent(location.pathname.split("/")[2] || "");
    return Math.max(0, views.findIndex((v, n) => (v.path || String(n)) === seg));
  };

  // The native toolbar is kept (sidebar button, search, Assist, menu) and laid over the band; its own title and
  // tabs are hidden, the banner draws them. The sidebar button is hidden too: the banner draws its own in front of the
  // title, shown whenever Home Assistant's would be (phones, sidebar always hidden), and opening the sidebar the same way.
  const ROOT_CSS = `
    .header { background: var(--dh-top-bg, transparent) !important; box-shadow: none !important; backdrop-filter: none !important;
      color: var(--dh-text) !important; }
    .header > ${TAG} { display: block; }
    .header .toolbar { position: absolute; top: var(--safe-area-inset-top, 0px); left: 0; right: 0; height: var(--dh-bar-h) !important;
      border-bottom: none !important; background: none !important; pointer-events: none; z-index: 2; color: var(--dh-text); }
    .header .toolbar > * { pointer-events: auto; }
    .header .toolbar > ha-tab-group, .header .toolbar > .main-title { display: none !important; }
    .header .toolbar .action-items { margin-inline-start: auto; gap: 6px; }
    .header .toolbar ha-menu-button { display: none !important; }
    .header .toolbar .action-items ha-icon-button {
      --ha-icon-button-size: 44px; --mdc-icon-button-size: 44px; width: 44px; height: 44px; border-radius: 50%;
      background: var(--dh-btn-bg); border: var(--dh-btn-border); color: var(--dh-text); box-sizing: border-box; }
  `;

  // ---- The banner element ----
  class DashboardHeaderBanner extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._tpl = new Map(); // template → { value, unsub }
      this._collapsed = false;
    }

    setup(root, cfg) {
      this._root = root;
      const key = JSON.stringify(cfg);
      if (key !== this._key) {
        this._key = key;
        this._cfg = cfg;
        this._subscribe();
      }
      this.render();
    }

    disconnectedCallback() {
      this._unsubscribeAll();
      this._actionsObserver?.disconnect();
      this._watched = null;
    }

    get hass() {
      return this._root?.hass;
    }

    // Every template the config uses, rendered live by Home Assistant (render_template subscription).
    _templates() {
      const c = this._cfg;
      const list = [c.title, c.subtitle, c.status?.text, c.status?.color, ...deepValues(c.sceneState)];
      return [...new Set(list.filter(isTemplate))];
    }

    _subscribe() {
      const wanted = new Set(this._templates());
      for (const [tpl, entry] of this._tpl) {
        if (!wanted.has(tpl)) {
          entry.unsub?.then?.((u) => u?.())?.catch?.(() => {});
          this._tpl.delete(tpl);
        }
      }
      const conn = this.hass?.connection;
      for (const tpl of wanted) {
        if (this._tpl.has(tpl)) continue;
        const entry = { value: "" };
        this._tpl.set(tpl, entry);
        if (!conn?.subscribeMessage) continue;
        entry.unsub = conn
          .subscribeMessage(
            (msg) => {
              if (msg && "result" in msg) {
                entry.value = msg.result;
                this.render();
              }
            },
            { type: "render_template", template: tpl, report_errors: false },
          )
          .catch(() => {});
      }
    }

    _unsubscribeAll() {
      for (const entry of this._tpl.values()) entry.unsub?.then?.((u) => u?.())?.catch?.(() => {});
      this._tpl.clear();
      this._key = undefined;
    }

    // A config value: template result, entity state, or the literal itself.
    value(v) {
      if (v == null) return v;
      if (isTemplate(v)) return this._tpl.get(v)?.value ?? "";
      if (typeof v === "string" && ENTITY_ID.test(v) && this.hass?.states?.[v]) return this.hass.states[v].state;
      return v;
    }

    // Entities read by the config (their changes redraw the banner).
    entities() {
      const c = this._cfg;
      if (!c) return [];
      const list = [c.status?.entity, ...deepValues(c.sceneState)];
      return list.filter((v) => typeof v === "string" && ENTITY_ID.test(v));
    }

    get dark() {
      if (this._cfg?.illustrationTheme) return this._cfg.illustrationTheme === "night";
      return Boolean(this.hass?.themes?.darkMode);
    }

    set collapsed(v) {
      if (v === this._collapsed) return;
      this._collapsed = v;
      this.render();
    }

    // Total height the view keeps free under the header (its expanded size: folding does not move the content).
    expandedHeight() {
      const tabs = this._tabs().length > 1;
      if (this._cfg.mode === "compact") return COMPACT + (tabs && this._root?.narrow ? TABS : 0);
      return BAND + (tabs ? TABS : 0);
    }

    // Height of the bar the native toolbar is laid over.
    barHeight() {
      return this._cfg.mode === "compact" || this._collapsed ? COMPACT : BAND - 4;
    }

    _tabs() {
      const root = this._root;
      const views = root?.lovelace?.config?.views || [];
      const cur = currentViewIndex(root, views);
      return visibleViews(views, this.hass).map(({ view, index }) => ({
        index,
        path: view.path || String(index),
        title: view.title || "",
        icon: view.icon && !(view.show_icon_and_title && view.title) ? view.icon : null,
        iconAndTitle: Boolean(view.show_icon_and_title && view.icon && view.title),
        active: index === cur,
      }));
    }

    _navigate(path) {
      const root = this._root;
      if (typeof root?._navigateToView === "function") return root._navigateToView(path);
      const prefix = root?.route?.prefix || `/${location.pathname.split("/")[1]}`;
      history.pushState(null, "", `${prefix}/${path}${location.search}`);
      window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    }

    _icon(icon, size) {
      if (customElements.get("ha-icon")) return `<ha-icon icon="${esc(icon)}" style="--mdc-icon-size:${size}px"></ha-icon>`;
      return "";
    }

    render() {
      const cfg = this._cfg;
      const root = this._root;
      if (!cfg || !root) return;
      const hass = this.hass;
      const mode = this.dark ? "dark" : "light";
      const p = PALETTE[mode];
      const c = SKY[mode];
      const scene = SCENES[cfg.scene];
      const accent = colorOf(cfg.accent, mode, p.blue);
      const title = this.value(cfg.title) || root.lovelace?.config?.title || hass?.panels?.[root.route?.prefix?.slice(1)]?.title || "Home Assistant";
      const subtitle = this.value(cfg.subtitle);
      const status = cfg.status;
      const statusText = status ? (status.text != null ? this.value(status.text) : this.value(status.entity)) : "";
      const statusColor = status ? colorOf(this.value(status.color), mode, accent) : accent;
      const tabs = this._tabs();
      const showTabs = tabs.length > 1;
      const compact = cfg.mode === "compact" || this._collapsed;
      const narrow = Boolean(root.narrow);
      const st = {};
      for (const k of scene ? scene.keys : []) st[k] = this.value(cfg.sceneState?.[k]);
      const bandBg = scene ? (scene.band ? scene.band(mode) : c[scene.bg]) : c.sky;
      const views = t(hass, "views");

      const tabHtml = tabs
        .map(
          (tab) =>
            `<a class="tab${tab.active ? " active" : ""}" href="${esc(`${root.route?.prefix || ""}/${tab.path}`)}" data-path="${esc(tab.path)}"` +
            `${tab.active ? ' aria-current="page"' : ""}${tab.icon ? ` aria-label="${esc(tab.title)}" title="${esc(tab.title)}"` : ""}>` +
            `${tab.icon || tab.iconAndTitle ? this._icon(tab.icon || root.lovelace.config.views[tab.index].icon, 18) : ""}` +
            `${tab.icon ? "" : `<span>${esc(tab.title)}</span>`}</a>`,
        )
        .join("");

      const pill = statusText
        ? `<span class="pill" role="status" title="${esc(statusText)}" style="color:${esc(statusColor)}"><span class="dot" style="background:${esc(statusColor)}"></span><span class="label">${esc(statusText)}</span></span>`
        : "";

      // Home Assistant's sidebar button decides when it shows (phones, sidebar always hidden, not with the companion
      // app's own sidebar…); the banner mirrors it, notification dot included.
      const native = root.shadowRoot?.querySelector(".toolbar ha-menu-button");
      const showMenu = native ? (typeof native._show === "boolean" ? native._show : Boolean(native.shadowRoot?.querySelector("ha-icon-button"))) : false;
      const menuDot = showMenu && Boolean(native._hasNotifications);
      const menuLabel = hass?.localize?.("ui.sidebar.sidebar_toggle") || "Menu";
      const menu = showMenu
        ? `<button class="menu" type="button" aria-label="${esc(menuLabel)}" title="${esc(menuLabel)}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"/></svg>${menuDot ? '<span class="menu-dot"></span>' : ""}</button>`
        : "";
      const identity =
        `<div class="identity">${menu}<span class="badge" style="color:${esc(accent)}">${this._icon(cfg.icon, 22)}</span>` +
        `<span class="names"><span class="title">${esc(title)}</span>${subtitle ? `<span class="sub">${esc(subtitle)}</span>` : ""}</span></div>`;

      const body = compact
        ? `<div class="bar compact">${identity}${showTabs && !narrow ? `<nav class="pills" aria-label="${esc(views)}">${tabHtml}</nav>` : ""}${pill}</div>` +
          // On a phone the pills get their own scrolling row under the bar.
          (showTabs && narrow ? `<nav class="pills row" aria-label="${esc(views)}">${tabHtml}</nav>` : "")
        : `<div class="bar band" style="background:${esc(bandBg)}">` +
          (scene ? `<svg class="scene" viewBox="0 0 ${narrow ? 1250 : 1600} 90" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">${scene.draw(c, st, p, mode, hass, (x) => this.value(x), narrow)}</svg>` : "") +
          `${identity}${pill}</div>` +
          (showTabs ? `<nav class="tabs" aria-label="${esc(views)}">${tabHtml}</nav>` : "");

      const html = `<style>${BANNER_CSS}</style><div class="dh ${mode}${narrow ? " narrow" : ""}${compact ? " is-compact" : ""}${this._collapsed ? " collapsed" : ""}" style="--accent:${esc(accent)};--text:${c.text};--sub:${c.sub};--glass:${c.glass}">${body}</div>`;
      // Redrawn only when something shows differently: running animations and the tab row's scroll are kept.
      if (html !== this._html) {
        this._html = html;
        this.shadowRoot.innerHTML = html;
        for (const a of this.shadowRoot.querySelectorAll("a.tab")) {
          a.addEventListener("click", (ev) => {
            if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
            ev.preventDefault();
            this._navigate(a.dataset.path);
          });
        }
        this.shadowRoot.querySelector("button.menu")?.addEventListener("click", () =>
          this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true })),
        );
        // The current tab in sight in a scrolling tab row (without scrolling the page).
        const nav = this.shadowRoot.querySelector("nav");
        const act = nav?.querySelector(".tab.active");
        if (nav && act) {
          const l = act.offsetLeft;
          if (l < nav.scrollLeft || l + act.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = Math.max(0, l - 16);
        }
      }

      // The native toolbar follows: its height, text color and the button surface, plus the page background behind
      // the notch (safe area) on phones.
      const s = root.style;
      s.setProperty("--dh-bar-h", `${this.barHeight()}px`);
      s.setProperty("--dh-text", compact ? "var(--primary-text-color)" : c.text);
      s.setProperty("--dh-btn-bg", compact ? "transparent" : c.glass);
      s.setProperty("--dh-btn-border", compact ? "1px solid var(--divider-color, rgba(0,0,0,.12))" : "none");
      s.setProperty("--dh-top-bg", compact ? "var(--card-background-color, #fff)" : bandBg);
      s.setProperty("--header-height", `${this.expandedHeight()}px`);
      this._measureActions();
    }

    // Room left for the native buttons (search, Assist, menu) at the right. Measured again whenever that row changes
    // width: Home Assistant adds some of its buttons after the page is drawn (a measure taken before let the status
    // pill run under them).
    _measureActions() {
      const bar = this.shadowRoot.querySelector(".bar");
      const tb = this._root?.shadowRoot?.querySelector(".toolbar");
      if (!bar || !tb) return;
      const actions = tb.querySelector(".action-items");
      const right = actions ? actions.getBoundingClientRect().width : 0;
      bar.style.setProperty("--right", `${Math.ceil(right) + 16}px`);
      if (actions !== this._watched && typeof ResizeObserver === "function") {
        this._actionsObserver ??= new ResizeObserver(() => this._measureActions());
        this._actionsObserver.disconnect();
        if (actions) this._actionsObserver.observe(actions);
        this._watched = actions;
      }
    }

  }

  const BANNER_CSS = `
    :host { display: block; }
    .dh { font-family: inherit; color: var(--primary-text-color); }
    .bar { position: relative; display: flex; align-items: center; gap: 12px; box-sizing: border-box;
      padding: 0 calc(var(--right, 16px)) 0 16px; }
    .band { height: ${BAND}px; overflow: hidden; padding-bottom: 4px; color: var(--text); }
    .scene { position: absolute; inset: 0; width: 100%; height: 100%; }
    .identity { position: relative; display: flex; align-items: center; gap: 12px; min-width: 0; flex: 0 1 auto; }
    .badge { width: 40px; height: 40px; border-radius: 50%; flex: none; display: inline-flex; align-items: center; justify-content: center;
      background: var(--glass); }
    .is-compact .badge { background: color-mix(in srgb, var(--accent) 14%, transparent); }
    .menu { position: relative; flex: none; width: 44px; height: 44px; margin-inline-start: -6px; margin-inline-end: -4px; border-radius: 50%;
      border: none; padding: 0; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text);
      background: transparent; }
    .is-compact .menu { color: var(--primary-text-color); }
    .menu:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .menu-dot { position: absolute; top: 8px; right: 8px; width: 10px; height: 10px; border-radius: 50%; background: var(--accent-color, #ff9800);
      border: 2px solid var(--card-background-color, #fff); box-sizing: border-box; }
    .names { display: flex; flex-direction: column; min-width: 0; }
    .title { font-size: 20px; font-weight: 700; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sub { font-size: 13px; line-height: 1.3; color: var(--sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .is-compact .title { font-size: 17px; }
    .is-compact .sub { font-size: 12.5px; color: var(--secondary-text-color); }
    .pill { position: relative; margin-inline-start: auto; flex: none; display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px;
      border-radius: 999px; background: var(--glass); font-size: 12px; font-weight: 600; white-space: nowrap; }
    .is-compact .pill { background: color-mix(in srgb, currentColor 12%, transparent); }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .tabs { display: flex; gap: 2px; padding: 0 8px; overflow-x: auto; scrollbar-width: none; background: var(--card-background-color, #fff);
      border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12)); }
    .tabs::-webkit-scrollbar, .pills::-webkit-scrollbar { display: none; }
    .tab { flex: none; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; cursor: pointer; }
    .tabs .tab { min-height: ${TABS - 1}px; padding: 0 14px; font-size: 14px; font-weight: 500; color: var(--secondary-text-color);
      border-bottom: 2px solid transparent; box-sizing: border-box; }
    .tabs .tab.active { color: var(--primary-text-color); font-weight: 600; border-bottom-color: var(--accent); }
    .compact { height: ${COMPACT}px; background: var(--card-background-color, #fff); border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12)); }
    .collapsed .compact { box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .pills { display: flex; gap: 6px; flex: 1 1 auto; min-width: 0; overflow-x: auto; scrollbar-width: none; }
    .pills .tab { min-height: 36px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--divider-color, rgba(0,0,0,.12));
      font-size: 13px; font-weight: 600; color: var(--primary-text-color); box-sizing: border-box; }
    .pills .tab.active { color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
    .pills.row { height: ${TABS}px; align-items: center; padding: 0 12px; box-sizing: border-box; background: var(--card-background-color, #fff);
      border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.12)); }
    .narrow .compact { border-bottom: none; }
    .narrow .title { font-size: 18px; }
    .identity { flex: 1 1 0; }
    .is-compact .identity { flex: 0 1 auto; }
    .narrow.is-compact .identity { flex: 1 1 0; }
    .narrow .pill { width: 26px; height: 26px; padding: 0; justify-content: center; }
    .narrow .pill .label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .tab:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; border-radius: 8px; }
    .blink { animation: dh-blink 1.2s steps(2, jump-none) infinite; }
    .pulse { animation: dh-pulse 1.6s ease-in-out infinite; }
    .rain path { animation: dh-rain 0.9s linear infinite; }
    .rain path:nth-child(2) { animation-delay: -0.3s; }
    .rain path:nth-child(3) { animation-delay: -0.6s; }
    .rain path:nth-child(4) { animation-delay: -0.45s; }
    .robot-away { animation: dh-robot 6s ease-in-out infinite alternate; }
    .drift { animation: dh-drift 6s ease-in-out infinite alternate; }
    .drift.slow { animation-duration: 8s; }
    .twinkle { animation: dh-twinkle 3.2s ease-in-out infinite alternate; }
    .progress { animation: dh-progress 3s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: left center; }
    @keyframes dh-blink { 0% { opacity: 1; } 100% { opacity: 0.25; } }
    @keyframes dh-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
    @keyframes dh-rain { 0% { transform: translateY(-6px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(18px); opacity: 0; } }
    @keyframes dh-robot { 0% { transform: translateX(0); } 100% { transform: translateX(-150px); } }
    @keyframes dh-drift { 0% { translate: 0 0; } 100% { translate: 6px 0; } }
    @keyframes dh-twinkle { 0% { opacity: 0.8; } 100% { opacity: 0.2; } }
    @keyframes dh-progress { 0% { transform: scaleX(0.3); } 100% { transform: scaleX(1); } }
    @media (prefers-reduced-motion: reduce) { .blink, .pulse, .rain path, .robot-away, .progress, .drift, .twinkle { animation: none; } }
  `;

  if (!customElements.get(TAG)) customElements.define(TAG, DashboardHeaderBanner);

  // ---- Wiring: follow the current dashboard, its view, edit mode and scrolling ----
  const state = { root: null, banner: null, observer: null, unsubEvents: null, conn: null, watchKey: null, queued: false };

  const deactivate = (root) => {
    if (!root) return;
    root.shadowRoot?.getElementById(STYLE_ID)?.remove();
    root.shadowRoot?.querySelector(TAG)?.remove();
    for (const v of ["--header-height", "--dh-bar-h", "--dh-text", "--dh-btn-bg", "--dh-btn-border", "--dh-top-bg"]) root.style.removeProperty(v);
  };

  // Only the entities the banner reads (subscribe_entities with their ids): a state_changed subscription would bring
  // every state change of the whole home to the browser a second time. Subscribed again when the list changes (another
  // view, a dashboard edit); none without entities.
  const watchStates = (banner) => {
    const conn = banner.hass?.connection;
    const ids = [...new Set(banner.entities())].sort();
    const key = ids.join(",");
    if (conn === state.conn && key === state.watchKey) return;
    state.unsubEvents?.then?.((u) => u?.())?.catch?.(() => {});
    state.unsubEvents = null;
    state.conn = conn;
    state.watchKey = key;
    if (!conn?.subscribeMessage || !ids.length) return;
    // The first message only carries the current states, which the banner has just drawn: not drawn again, so the
    // banner does not change while Home Assistant is still laying out the page (see relayout).
    let initial = true;
    state.unsubEvents = conn
      .subscribeMessage(
        () => {
          if (initial) {
            initial = false;
            return;
          }
          const b = state.banner;
          if (b?.isConnected) b.render();
        },
        { type: "subscribe_entities", entity_ids: ids },
      )
      .catch(() => {});
  };

  // Safari sometimes keeps a dashboard laid out for the width it had before the sidebar took its place, the banner
  // having come in while Home Assistant was still laying out the page: the view and the header then run a sidebar's
  // width past the window (the toolbar's buttons out of sight) until the page is laid out again, as leaving the edit
  // mode does. A little after the banner comes in, the root's style sheet is put back and a resize sent, so the page
  // is laid out again with the sidebar in place.
  const relayout = (root) => {
    if (state.root !== root || !root.isConnected) return;
    const style = root.shadowRoot?.getElementById(STYLE_ID);
    if (style) root.shadowRoot.appendChild(style);
    void root.offsetWidth;
    window.dispatchEvent(new Event("resize"));
  };

  const sync = () => {
    state.queued = false;
    const root = findRoot();
    if (state.root && state.root !== root) deactivate(state.root);
    if (root !== state.root) {
      state.observer?.disconnect();
      state.observer = null;
      state.root = root;
    }
    if (!root?.shadowRoot || !root.lovelace?.config) return;
    if (!state.observer) {
      state.observer = new MutationObserver(queue);
      state.observer.observe(root.shadowRoot, { childList: true, subtree: true });
    }
    const views = root.lovelace.config.views || [];
    const viewCfg = views[currentViewIndex(root, views)];
    const cfg = root.lovelace.editMode || viewCfg?.subview ? null : resolveConfig(root.lovelace.config, viewCfg);
    const header = root.shadowRoot.querySelector(".header");
    if (!cfg || !header) return deactivate(root);
    if (!root.shadowRoot.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = ROOT_CSS;
      root.shadowRoot.appendChild(style);
    }
    let banner = header.querySelector(TAG);
    if (!banner) {
      banner = document.createElement(TAG);
      header.insertBefore(banner, header.firstChild);
      for (const ms of [400, 1500]) setTimeout(() => relayout(root), ms);
    }
    state.banner = banner;
    if (!cfg.collapse) banner.collapsed = false;
    else if (window.scrollY > COLLAPSE_AT) banner.collapsed = true;
    else if (window.scrollY < EXPAND_AT) banner.collapsed = false;
    banner.setup(root, cfg);
    watchStates(banner);
  };

  // Several triggers can fire in one frame (a navigation re-renders hui-root): one sync per frame.
  function queue(mutations) {
    if (mutations && Array.isArray(mutations) && mutations.every((m) => m.target === state.banner || m.target?.tagName === "STYLE")) return;
    if (state.queued) return;
    state.queued = true;
    requestAnimationFrame(sync);
  }

  window.addEventListener("location-changed", () => queue());
  window.addEventListener("popstate", () => queue());
  window.addEventListener("resize", () => queue());
  window.addEventListener(
    "scroll",
    () => {
      const b = state.banner;
      if (!b?.isConnected || !b._cfg?.collapse) return;
      const y = window.scrollY;
      if (y > COLLAPSE_AT) b.collapsed = true;
      else if (y < EXPAND_AT) b.collapsed = false;
    },
    { passive: true },
  );
  // Theme switches (dark mode) and dashboard edits arrive with a new hass / lovelace without any DOM change.
  setInterval(() => {
    if (document.visibilityState === "visible") queue();
  }, 1500);
  queue();

  window.dashboardHeader = { VERSION, SCENES, vehicleList, PALETTE, STRINGS, resolveConfig, visibleViews, truthy, colorOf, tempoColor, binColor, sceneName, isTemplate, sync, watchStates, relayout, state };
  console.info(`%c DASHBOARD-HEADER %c ${VERSION} `, "color:#fff;background:#2459bd;font-weight:700", "color:#2459bd;background:#fff");
})();
