// Dashboard Header — illustrated dashboard headers for Home Assistant, matching the ha-* cards.
//
// A dashboard resource (no card): on every dashboard whose YAML carries a top-level `dashboard_header:` block, it
// replaces the look of the top bar (title and view tabs) with a 90 px illustrated band and a row of text tabs, or a
// compact bar with pill tabs. Home Assistant's own toolbar stays in place, restyled: the sidebar button, search,
// Assist and the dashboard menu keep working exactly as before. Subviews get the banner with a back button (Home
// Assistant's own, so back_path is kept). In edit mode and on dashboards without the block, the native header is left
// untouched. App panels (add-on ingress, e.g. /core_ssh) get a banner too when a
// dashboard lists them under `dashboard_header.panels:`.
(() => {
  // Loaded twice (dashboard resource and frontend extra_module_url): the first copy does the work.
  if (window.dashboardHeader) return;
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

  // The Energy scene's meter between two pylons: today's Tempo color on its screen, a flash when power is drawn.
  const energyMeter = (c, st, p, mode, narrow) =>
    sun(c, narrow, 880, 30, 14) +
    hills(c, "M0 74 Q250 60 500 70 T1000 66 T1400 70 V90 H0z") +
    `<path d="M966 30 C1080 48 1190 48 1286 30 M994 30 C1100 52 1200 52 1314 30" fill="none" stroke="${c.line}" stroke-width="1"/>` +
    pylon(c, 980) +
    pylon(c, 1300) +
    `<rect x="1112" y="50" width="56" height="36" rx="5" fill="${c.appl}" stroke="${c.line}"/>` +
    `<rect x="1119" y="56" width="42" height="12" rx="2" fill="${tempoColor(st.tempo, mode, c)}"/>` +
    `<path class="${truthy(st.power) ? "pulse" : ""}" d="M1142 72 l-4 7h5l-3 6" fill="none" stroke="${truthy(st.power) ? p.amber : c.line}" stroke-width="1.8" stroke-linecap="round"/>` +
    ground(c.grass);

  // ---- The Energy panel's layouts (scene_state.layout: overview, electricity, now) ----
  const energyLayout = (v) => {
    const s = String(v ?? "").toLowerCase();
    if (/overview|ensemble|vue/.test(s)) return "overview";
    if (/electric|élec|elec/.test(s)) return "electricity";
    if (/now|live|maintenant|direct|power/.test(s)) return "now";
    return null;
  };
  const numOf = (v) => {
    if (v == null || v === "" || typeof v === "boolean") return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  // A value with its unit (the entity's own, else the given one); text (a template's result) as it is.
  const amount = (v, unit, hass) => {
    const n = numOf(v);
    if (n === null) return v == null || v === "" ? "" : String(v);
    const lang = hass?.locale?.language || hass?.language || "en";
    const a = Math.abs(n);
    const digits = a >= 100 ? 0 : a >= 10 ? 1 : 2;
    let text;
    try {
      text = n.toLocaleString(lang, { maximumFractionDigits: digits });
    } catch {
      text = String(Math.round(n * 10 ** digits) / 10 ** digits);
    }
    return unit ? `${text} ${unit}` : text;
  };
  const svgText = (x, y, text, fill, size = 10.5, anchor = "middle") =>
    text ? `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" fill="${fill}" text-anchor="${anchor}" font-family="inherit">${esc(text)}</text>` : "";
  const housePlain = (c, x, lit) =>
    `<rect x="${x}" y="50" width="104" height="36" fill="${c.house}"/>` +
    `<polygon points="${x - 10},52 ${x + 52},18 ${x + 114},52" fill="${c.roof}"/>` +
    `<rect x="${x + 12}" y="58" width="18" height="14" rx="2" fill="${lit ? c.winOn : c.winOff}"/>` +
    `<rect x="${x + 74}" y="58" width="18" height="14" rx="2" fill="${lit ? c.winOn : c.winOff}"/>` +
    `<rect x="${x + 42}" y="62" width="20" height="24" rx="2" fill="${c.door}"/>`;
  // Solar panels: along a roof slope, or on ground racks.
  const solarPanels = (x, y, n, dark, roof) => {
    const fill = dark ? "#2a3a5c" : "#34507e";
    const edge = dark ? "#4d6694" : "#9db4da";
    let out = "";
    for (let i = 0; i < n; i++) {
      if (roof) {
        const px = x + i * 13;
        const py = y - i * 7;
        out += `<polygon points="${px},${py} ${px + 12},${py - 6.5} ${px + 16},${py - 3} ${px + 4},${py + 3.5}" fill="${fill}" stroke="${edge}" stroke-width="0.8"/>`;
      } else {
        const px = x + i * 22;
        out += `<path d="M${px + 9} ${y} V${y - 8}" stroke="${edge}" stroke-width="1.5"/><polygon points="${px},${y - 8} ${px + 18},${y - 8} ${px + 14},${y - 18} ${px + 4},${y - 18}" fill="${fill}" stroke="${edge}" stroke-width="0.8"/>`;
      }
    }
    return out;
  };
  // Dots running along a wire (an animated dash pattern): reversed when the power goes the other way.
  const flowLine = (d, color, reverse) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" opacity="0.35"/>` +
    `<path class="flow${reverse ? " rev" : ""}" d="${d}" fill="none" stroke="${color}" stroke-width="5"/>`;
  // On phones only the right end of the band shows, under the title and the buttons: the layouts keep the house
  // where the other scenes have it (as on the Home scene) and leave out the wires and the values (the subtitle and
  // the status pill carry them).
  const has = (v) => v != null && v !== "";
  // A home battery filled to its charge, red under 20 %, amber under 50 %.
  const batteryBox = (c, p, x, pct) => {
    const h = Math.round((Math.max(0, Math.min(100, pct)) / 100) * 21);
    return (
      `<rect x="${x}" y="60" width="18" height="26" rx="3" fill="${c.appl}" stroke="${c.line}"/><rect x="${x + 5}" y="57" width="8" height="3" fill="${c.line}"/>` +
      `<rect x="${x + 4}" y="${83 - h}" width="10" height="${h}" rx="1" fill="${pct < 20 ? p.red : pct < 50 ? p.amber : p.green}"/>`
    );
  };

  const ENERGY_LAYOUTS = {
    // Overview: the grid line to the house, the gas meter and the water tap, each with today's use.
    overview: (c, st, p, _mode, hass, narrow) =>
      sun(c, narrow, 860, 28, 13) +
      hills(c, "M0 74 Q250 60 500 70 T1000 66 T1400 70 V90 H0z") +
      (narrow
        ? housePlain(c, 1094, st.lights === undefined || truthy(st.lights)) +
          (has(st.gas)
            ? `<path d="M1204 86 V74 H1214" fill="none" stroke="${p.amber}" stroke-width="3"/><rect x="1212" y="64" width="16" height="14" rx="2" fill="${c.appl}" stroke="${c.line}"/><circle cx="1220" cy="71" r="3.5" fill="none" stroke="${p.amber}" stroke-width="1.5"/>`
            : "") +
          (has(st.water) ? `<path d="M1236 86 V64 H1246" fill="none" stroke="${p.cyan}" stroke-width="3"/><path d="M1246 70 q-4 6 0 8 q4 -2 0 -8z" fill="${p.cyan}"/>` : "")
        : pylon(c, 960) +
          `<path d="M960 30 C1010 40 1050 44 1092 56" fill="none" stroke="${c.line}" stroke-width="1"/>` +
          housePlain(c, 1100, st.lights === undefined || truthy(st.lights)) +
          svgText(1018, 22, amount(st.electricity, st.units?.electricity ?? "kWh", hass), c.text) +
          (has(st.gas)
            ? `<path d="M1216 86 V70 H1240" fill="none" stroke="${p.amber}" stroke-width="3"/><rect x="1238" y="60" width="18" height="16" rx="2" fill="${c.appl}" stroke="${c.line}"/><circle cx="1247" cy="68" r="4" fill="none" stroke="${p.amber}" stroke-width="1.6"/>` +
              svgText(1247, 52, amount(st.gas, st.units?.gas ?? "m³", hass), c.text)
            : "") +
          (has(st.water)
            ? `<path d="M1280 86 V62 H1296 V66" fill="none" stroke="${p.cyan}" stroke-width="3"/><path d="M1296 70 q-4 6 0 8 q4 -2 0 -8z" fill="${p.cyan}"/>` +
              svgText(1300, 54, amount(st.water, st.units?.water ?? "L", hass), c.text)
            : "")) +
      ground(c.grass),
    // Electricity: the grid to the house, the Linky on its wall in today's Tempo color, solar panels and battery.
    electricity: (c, st, p, mode, hass, narrow) => {
      const tempo = tempoColor(st.tempo, mode, c);
      const label = [st.tempo, st.period].filter(has).join(" · ");
      const solar = has(st.solar) && (numOf(st.solar) === null ? truthy(st.solar) : true);
      const battery = numOf(st.battery);
      return (
        sun(c, narrow, 900, 26, 13) +
        hills(c, "M0 74 Q250 60 500 70 T1000 66 T1400 70 V90 H0z") +
        (narrow
          ? housePlain(c, 1094, st.lights === undefined || truthy(st.lights)) +
            (solar ? solarPanels(1108, 46, 3, mode === "dark", true) : "") +
            `<rect x="1072" y="62" width="14" height="20" rx="2" fill="#7fbf6a"/><rect x="1074" y="65" width="10" height="5" fill="${tempo}"/>` +
            (battery !== null ? batteryBox(c, p, 1214, battery) : "")
          : pylon(c, 980) +
            `<path d="M980 30 C1030 40 1060 46 1100 60" fill="none" stroke="${c.line}" stroke-width="1"/>` +
            housePlain(c, 1110, st.lights === undefined || truthy(st.lights)) +
            (solar ? solarPanels(1124, 46, 3, mode === "dark", true) : "") +
            `<rect x="1088" y="62" width="14" height="20" rx="2" fill="#7fbf6a"/><rect x="1090" y="65" width="10" height="5" fill="${tempo}"/>` +
            svgText(1014, 20, label, has(st.tempo) ? tempo : c.text) +
            (battery !== null ? batteryBox(c, p, 1232, battery) + svgText(1241, 52, amount(battery, st.units?.battery ?? "%", hass), c.text, 10) : "")) +
        ground(c.grass)
      );
    },
    // Now: power running from the grid and the panels to the house (back to the grid when exporting), the total on the roof.
    now: (c, st, p, mode, hass, narrow) => {
      const grid = numOf(st.grid);
      const solar = numOf(st.solar);
      const unit = st.units?.grid || st.units?.solar || st.units?.total || "kW";
      const total = has(st.total) ? st.total : grid !== null && solar !== null ? grid + solar : grid ?? solar;
      const gridOn = grid === null ? truthy(st.grid) : Math.abs(grid) > 0;
      const solarOn = solar === null ? truthy(st.solar) : solar > 0;
      const showSolar = has(st.solar);
      return (
        sun(c, narrow, 870, 24, 12) +
        hills(c, "M0 74 Q250 60 500 70 T1000 66 T1400 70 V90 H0z") +
        (narrow
          ? housePlain(c, 1094, true) +
            (showSolar ? solarPanels(1206, 86, 2, mode === "dark") : "") +
            (showSolar && solarOn ? flowLine("M1206 74 C1200 74 1196 72 1192 72", p.green) : "")
          : pylon(c, 940) +
            (showSolar ? solarPanels(1010, 86, 3, mode === "dark") : "") +
            housePlain(c, 1150, true) +
            (gridOn ? flowLine("M940 30 C1000 40 1080 50 1146 62", grid !== null && grid < 0 ? p.green : p.amber, grid !== null && grid < 0) : `<path d="M940 30 C1000 40 1080 50 1146 62" fill="none" stroke="${c.line}" stroke-width="1"/>`) +
            (showSolar && solarOn ? flowLine("M1060 66 C1095 66 1120 66 1146 70", p.green) : "") +
            svgText(1030, 22, amount(grid ?? st.grid, st.units?.grid ?? unit, hass), grid !== null && grid < 0 ? p.green : p.amber) +
            (showSolar ? svgText(1032, 64, amount(st.solar, st.units?.solar ?? unit, hass), p.green) : "") +
            (has(total) ? `<rect x="1168" y="24" width="68" height="20" rx="10" fill="${c.glass}"/>${svgText(1202, 38, amount(total, st.units?.total ?? unit, hass), c.text, 11)}` : "")) +
        ground(c.grass)
      );
    },
  };

  // ---- Rooms (interior scenes): a wall, a floor strip and the room's furniture, its lights and devices ----
  // A window's (or shutter's, garage door's) closed share, 0 (open) to 1 (closed), from a cover state or position (100 = open).
  const closedShare = (v) => {
    if (v == null || v === "") return 0;
    const n = numOf(v);
    if (n !== null) return 1 - Math.max(0, Math.min(100, n)) / 100;
    const s = String(v).toLowerCase();
    if (/closed|ferm|off|false|down/.test(s)) return 1;
    if (/opening|closing/.test(s)) return 0.5;
    return 0;
  };
  // Humid: a humidity of 70 % or more, or an on state (a shower running, a humidity binary sensor).
  const humid = (v) => {
    const n = numOf(v);
    return n === null ? truthy(v) : n >= 70;
  };
  const floorStrip = (c, fill = c.floor) => `<rect x="0" y="72" width="1600" height="14" fill="${fill}"/>`;
  // A window on the wall: day or night outside (the theme), a roller shutter down to its closed share.
  const roomWindow = (c, mode, x, y, w, h, shut = 0) => {
    const night = mode === "dark";
    const out = night ? "#16223a" : "#bcdcf5";
    const sh = Math.round((h - 4) * Math.max(0, Math.min(1, shut)));
    let slats = "";
    for (let yy = y + 2 + 4; yy < y + 2 + sh; yy += 4) slats += `<path d="M${x + 2} ${yy} H${x + w - 2}" stroke="${c.line}" stroke-width="0.6" opacity="0.6"/>`;
    return (
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${c.appl}" stroke="${c.line}"/>` +
      `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" fill="${out}"/>` +
      (night
        ? `<circle cx="${x + w * 0.3}" cy="${y + h * 0.3}" r="0.9" fill="#ffffff"/><circle cx="${x + w * 0.7}" cy="${y + h * 0.5}" r="0.8" fill="#ffffff"/><circle cx="${x + w * 0.72}" cy="${y + h * 0.26}" r="3.2" fill="#f3eed2"/>`
        : `<circle cx="${x + w * 0.72}" cy="${y + h * 0.3}" r="3.6" fill="#ffd65a"/>`) +
      `<path d="M${x + w / 2} ${y + 2} V${y + h - 2} M${x + 2} ${y + h / 2} H${x + w - 2}" stroke="${c.appl}" stroke-width="1.6"/>` +
      (sh > 0 ? `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${sh}" fill="${c.floor2}"/>${slats}` : "") +
      `<rect x="${x - 3}" y="${y + h}" width="${w + 6}" height="3" rx="1" fill="${c.line}"/>`
    );
  };
  // A ceiling light hanging from the top edge: a cone of warm light when on.
  const ceilingLamp = (c, x, on, len = 14) =>
    `<path d="M${x} 0 V${len}" stroke="${c.line}" stroke-width="1.2"/>` +
    (on ? `<path d="M${x - 8} ${len + 6} L${x - 34} 72 H${x + 34} L${x + 8} ${len + 6}Z" fill="${c.lampOn}" opacity="0.14"/>` : "") +
    `<path d="M${x - 9} ${len + 7} Q${x} ${len - 4} ${x + 9} ${len + 7}Z" fill="${on ? c.lampOn : c.lamp}"/>`;
  // A bedside / desk lamp: a shade on a stand, a glow when on.
  const tableLamp = (c, x, y, on) =>
    (on ? `<circle cx="${x}" cy="${y - 4}" r="14" fill="${c.lampOn}" opacity="0.22"/>` : "") +
    `<path d="M${x} ${y} V${y - 6}" stroke="${c.line}" stroke-width="1.6"/><rect x="${x - 5}" y="${y}" width="10" height="2" rx="1" fill="${c.line}"/>` +
    `<path d="M${x - 6} ${y - 6} L${x - 4} ${y - 14} H${x + 4} L${x + 6} ${y - 6}Z" fill="${on ? c.lampOn : c.lamp}"/>`;
  // "z z Z" rising over a sleeper.
  const sleepZ = (x, y, color) =>
    `<g class="zzz" fill="${color}" font-family="inherit" font-weight="700"><text x="${x}" y="${y}" font-size="8">z</text>` +
    `<text x="${x + 7}" y="${y - 7}" font-size="10">z</text><text x="${x + 16}" y="${y - 16}" font-size="12">Z</text></g>`;
  // An extractor fan in its grille, spinning when on.
  const extractor = (c, x, y, on) =>
    `<circle cx="${x}" cy="${y}" r="9" fill="${c.appl}" stroke="${c.line}"/>` +
    `<g class="${on ? "spin" : ""}"><path d="M${x} ${y} L${x} ${y - 7} A7 7 0 0 1 ${x + 5} ${y - 5}Z M${x} ${y} L${x + 7} ${y} A7 7 0 0 1 ${x + 5} ${y + 5}Z M${x} ${y} L${x} ${y + 7} A7 7 0 0 1 ${x - 5} ${y + 5}Z M${x} ${y} L${x - 7} ${y} A7 7 0 0 1 ${x - 5} ${y - 5}Z" fill="${c.line}"/></g>`;
  const plant = (c, x, y = 72) =>
    `<rect x="${x - 6}" y="${y - 12}" width="12" height="12" rx="2" fill="${c.clay}"/>` +
    `<g fill="${c.tree}"><ellipse cx="${x - 5}" cy="${y - 18}" rx="4" ry="7" transform="rotate(-20 ${x - 5} ${y - 18})"/><ellipse cx="${x + 5}" cy="${y - 18}" rx="4" ry="7" transform="rotate(20 ${x + 5} ${y - 18})"/><ellipse cx="${x}" cy="${y - 22}" rx="3.5" ry="8"/></g>`;
  // A bed seen from the side: headboard on the left, mattress, duvet of the given color, pillows.
  const bed = (c, x, w, duvet, { pillows = 1, foot = true } = {}) =>
    `<rect x="${x}" y="40" width="8" height="36" rx="2" fill="${c.wood}"/>` +
    (foot ? `<rect x="${x + w - 6}" y="56" width="6" height="20" rx="2" fill="${c.wood}"/>` : "") +
    `<rect x="${x + 6}" y="60" width="${w - 10}" height="10" rx="2" fill="${c.paper}"/>` +
    `<rect x="${x + 6}" y="70" width="${w - 10}" height="4" fill="${c.wood}"/>` +
    `<path d="M${x + 6 + w * 0.3} 60 Q${x + 6 + w * 0.3} 54 ${x + 14 + w * 0.3} 54 H${x + w - 8} Q${x + w - 4} 54 ${x + w - 4} 60 V68 H${x + 6 + w * 0.3}Z" fill="${duvet}"/>` +
    Array.from({ length: pillows }, (_, i) => `<rect x="${x + 10 + i * 6}" y="${52 - i * 3}" width="22" height="9" rx="4.5" fill="${c.white}" stroke="${c.line}" stroke-width="0.6"/>`).join("") +
    `<rect x="${x + 6}" y="74" width="3" height="4" fill="${c.wood}"/><rect x="${x + w - 7}" y="74" width="3" height="4" fill="${c.wood}"/>`;
  const frame = (c, x, y, w, h, inner) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${c.wood}"/><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" fill="${inner}"/>`;
  // Soft per-mode colors of the room scenes (duvets, toys, towels).
  const ROOM = {
    light: { duvet: "#b9c4ec", baby: "#f5c9d3", babyWall: "#f6eef0", kid: "#f2c94c", kid2: "#e86f5c", kid3: "#5b9bd5", teen: "#6b5bd6", towel: "#5fb8c9", tile: "#d8e4ea", bath: "#ffffff",
      water: "#7ccfe4", glow: "#c4f4ff", cover: "#8fa3b8", felt: "#2f8a58", sofa: "#8fa6c9" },
    dark: { duvet: "#3b4470", baby: "#6a4652", babyWall: "#2a2529", kid: "#9a7f2a", kid2: "#8a4337", kid3: "#2f5a82", teen: "#4a3fa0", towel: "#2d6e7a", tile: "#2a333b", bath: "#c9d0db",
      water: "#1f5f73", glow: "#3fb6d4", cover: "#3a4658", felt: "#1d5a3a", sofa: "#3f4d6a" },
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
      keys: ["tempo", "power", "layout", "electricity", "gas", "water", "lights", "period", "solar", "battery", "grid", "total"],
      // The meter between two pylons, or one of the three layouts made for the Energy panel's tabs.
      draw: (c, st, p, mode, hass, _val, narrow) => {
        const layout = energyLayout(st.layout);
        if (layout) return ENERGY_LAYOUTS[layout](c, st, p, mode, hass, narrow);
        return energyMeter(c, st, p, mode, narrow);
      },
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
    bathroom: {
      icon: "mdi:shower",
      accent: "cyan",
      bg: "wall2",
      keys: ["light", "humidity", "fan"],
      // A bathtub (steam rising when the air is humid), the sink under its mirror, a towel, the extractor fan.
      draw: (c, st, p, mode) => {
        const r = ROOM[mode];
        let tiles = "";
        for (let x = 0; x <= 1600; x += 14) tiles += `<path d="M${x} 40 V72" stroke="${c.line}" stroke-width="0.5" opacity="0.35"/>`;
        return (
          `<rect x="0" y="40" width="1600" height="32" fill="${r.tile}"/>${tiles}<path d="M0 54 H1600" stroke="${c.line}" stroke-width="0.5" opacity="0.35"/>` +
          floorStrip(c, c.floor2) +
          ceilingLamp(c, 1140, truthy(st.light), 6) +
          extractor(c, 980, 22, truthy(st.fan)) +
          (humid(st.humidity)
            ? `<g class="steam" fill="none" stroke="${p.cyan}" stroke-width="2" stroke-linecap="round" opacity="0.7"><path d="M1030 50 q-5 -6 0 -12 q5 -6 0 -12"/><path d="M1050 48 q-5 -6 0 -12 q5 -6 0 -12"/><path d="M1070 50 q-5 -6 0 -12 q5 -6 0 -12"/></g>`
            : "") +
          `<path d="M1006 52 V44 Q1006 40 1012 40 H1018" fill="none" stroke="${c.line}" stroke-width="2"/>` +
          `<path d="M1000 54 H1100 V66 Q1100 76 1088 76 H1012 Q1000 76 1000 66Z" fill="${r.bath}" stroke="${c.line}"/>` +
          `<path d="M1012 76 l-3 6 M1088 76 l3 6" stroke="${c.line}" stroke-width="2.4" stroke-linecap="round"/>` +
          `<ellipse cx="1180" cy="34" rx="16" ry="20" fill="${c.glassWin}" stroke="${c.line}" stroke-width="1.5"/>` +
          `<path d="M1172 26 l8 -6 M1172 34 l12 -10" stroke="#ffffff" stroke-width="1.4" opacity="0.6"/>` +
          `<rect x="1156" y="58" width="48" height="5" rx="2" fill="${r.bath}" stroke="${c.line}"/><path d="M1180 58 V53 H1186" fill="none" stroke="${c.line}" stroke-width="2"/>` +
          `<rect x="1160" y="63" width="40" height="15" rx="2" fill="${c.wood}"/><path d="M1180 63 V78" stroke="${c.wall2}" stroke-width="1"/>` +
          `<path d="M1226 40 H1256" stroke="${c.line}" stroke-width="2"/><rect x="1230" y="40" width="22" height="26" rx="2" fill="${r.towel}"/><path d="M1230 60 H1252" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>` +
          plant(c, 1278) +
          ground(c.floorBar)
        );
      },
    },
    toilet: {
      icon: "mdi:toilet",
      accent: "green",
      bg: "wall2",
      keys: ["light", "occupied", "fan"],
      // The toilet and its paper roll under a high window, the door with its free / occupied sign.
      draw: (c, st, p, mode) => {
        const r = ROOM[mode];
        const busy = truthy(st.occupied);
        return (
          `<rect x="0" y="48" width="1600" height="24" fill="${r.tile}"/>` +
          floorStrip(c, c.floor2) +
          ceilingLamp(c, 1110, truthy(st.light), 6) +
          roomWindow(c, mode, 1020, 18, 26, 22) +
          extractor(c, 1210, 18, truthy(st.fan)) +
          `<rect x="1092" y="38" width="26" height="22" rx="3" fill="${r.bath}" stroke="${c.line}"/><rect x="1100" y="34" width="10" height="4" rx="1.5" fill="${c.line}"/>` +
          `<path d="M1086 60 H1140 Q1140 70 1126 72 L1124 80 H1104 L1102 72 Q1086 70 1086 60Z" fill="${r.bath}" stroke="${c.line}"/>` +
          `<rect x="1084" y="58" width="58" height="3" rx="1.5" fill="${c.line}"/>` +
          `<path d="M1160 54 H1172" stroke="${c.line}" stroke-width="2"/><circle cx="1166" cy="58" r="6" fill="${c.white}" stroke="${c.line}" stroke-width="0.8"/><path d="M1166 64 V70" stroke="${c.white}" stroke-width="5"/>` +
          plant(c, 1194) +
          `<rect x="1226" y="20" width="44" height="58" rx="2" fill="${c.door}"/><circle cx="1262" cy="52" r="2" fill="${c.line}"/>` +
          `<rect x="1236" y="28" width="24" height="10" rx="5" fill="${c.rack}"/><circle class="${busy ? "pulse" : ""}" cx="1248" cy="33" r="3" fill="${busy ? p.red : p.green}"/>` +
          ground(c.floorBar)
        );
      },
    },
    bedroom: {
      icon: "mdi:bed-king",
      accent: "violet",
      bg: "wall",
      keys: ["lights", "shutter", "sleep"],
      // A double bed between two bedside lamps, a picture above it, the window and its roller shutter.
      draw: (c, st, p, mode) => {
        const on = truthy(st.lights);
        return (
          floorStrip(c) +
          roomWindow(c, mode, 960, 20, 40, 40, closedShare(st.shutter)) +
          `<rect x="1022" y="58" width="26" height="18" rx="2" fill="${c.wood}"/><path d="M1022 66 H1048" stroke="${c.wall}" stroke-width="1"/>` +
          tableLamp(c, 1035, 56, on) +
          frame(c, 1112, 18, 46, 26, mode === "dark" ? "#33405c" : "#cfe0d0") +
          `<path d="M1116 40 L1128 30 L1136 36 L1146 26 L1154 40Z" fill="${c.tree}"/>` +
          bed(c, 1058, 176, ROOM[mode].duvet, { pillows: 2 }) +
          `<rect x="1244" y="58" width="26" height="18" rx="2" fill="${c.wood}"/><path d="M1244 66 H1270" stroke="${c.wall}" stroke-width="1"/>` +
          tableLamp(c, 1257, 56, on) +
          (truthy(st.sleep) ? sleepZ(1092, 44, p.violet) : "") +
          ground(c.wood)
        );
      },
    },
    nursery: {
      icon: "mdi:teddy-bear",
      accent: "violet",
      band: (mode) => ROOM[mode].babyWall,
      keys: ["night_light", "sleep", "music"],
      // A crib with its mobile (turning while the music plays), a night light on the dresser, a teddy bear.
      draw: (c, st, p, mode) => {
        const r = ROOM[mode];
        const glow = truthy(st.night_light);
        let bars = "";
        for (let x = 1076; x <= 1176; x += 8) bars += `<path d="M${x} 52 V74" stroke="${c.white}" stroke-width="2.4"/>`;
        return (
          floorStrip(c) +
          `<g fill="${r.baby}" opacity="0.9"><path d="M990 26 l2 5 5 0.5 -4 3 1.5 5 -4.5 -3 -4.5 3 1.5 -5 -4 -3 5 -0.5z"/><path d="M1020 44 l1.5 3.5 3.5 0.4 -2.8 2 1 3.5 -3.2 -2 -3.2 2 1 -3.5 -2.8 -2 3.5 -0.4z"/><circle cx="1240" cy="20" r="3"/></g>` +
          `<path d="M1126 0 V10" stroke="${c.line}" stroke-width="1"/>` +
          `<g class="${truthy(st.music) ? "sway" : ""}"><path d="M1106 12 H1146 M1106 12 V24 M1126 12 V28 M1146 12 V22" stroke="${c.line}" stroke-width="1" fill="none"/>` +
          `<circle cx="1106" cy="27" r="3.5" fill="${p.amber}"/><path d="M1126 28 l3 5 h-6z" fill="${p.cyan}"/><path d="M1146 22 q4 2 0 7 q-4 -3 0 -7z" fill="${r.baby}"/></g>` +
          `<rect x="1068" y="44" width="5" height="34" rx="2" fill="${c.white}"/><rect x="1180" y="44" width="5" height="34" rx="2" fill="${c.white}"/>` +
          `<rect x="1072" y="62" width="108" height="8" rx="2" fill="${r.baby}"/><path d="M1072 50 H1180" stroke="${c.white}" stroke-width="3"/>` +
          `<path d="M1072 74 H1180" stroke="${c.white}" stroke-width="3"/>${bars}` +
          `<ellipse cx="1150" cy="61" rx="18" ry="5" fill="${c.white}" opacity="0.85"/><circle cx="1096" cy="58" r="5" fill="${c.white}"/>` +
          `<rect x="1208" y="54" width="44" height="22" rx="2" fill="${c.white}" stroke="${c.line}" stroke-width="0.8"/><path d="M1208 65 H1252" stroke="${c.line}" stroke-width="0.6"/>` +
          (glow ? `<circle cx="1230" cy="46" r="16" fill="${p.amber}" opacity="0.22"/>` : "") +
          `<path d="M1222 54 Q1222 38 1230 38 Q1238 38 1238 54Z" fill="${glow ? c.lampOn : c.lamp}"/>` +
          `<g fill="${c.wood}"><circle cx="1278" cy="70" r="7"/><circle cx="1278" cy="58" r="5.5"/><circle cx="1273.5" cy="53.5" r="2.2"/><circle cx="1282.5" cy="53.5" r="2.2"/></g>` +
          `<circle cx="1278" cy="70" r="3.5" fill="${r.baby}"/>` +
          (truthy(st.sleep) ? sleepZ(1150, 46, p.violet) : "") +
          ground(c.wood)
        );
      },
    },
    kids_room: {
      icon: "mdi:toy-brick",
      accent: "amber",
      bg: "wall",
      keys: ["lights", "sleep", "shutter"],
      // A rocket poster, toy blocks and a toy box, a single bed with a bright duvet, a star lamp.
      draw: (c, st, p, mode) => {
        const r = ROOM[mode];
        const on = truthy(st.lights);
        return (
          floorStrip(c) +
          roomWindow(c, mode, 960, 22, 34, 34, closedShare(st.shutter)) +
          frame(c, 1022, 16, 30, 38, mode === "dark" ? "#16223a" : "#dfeefc") +
          `<path d="M1037 22 Q1043 30 1043 40 H1031 Q1031 30 1037 22Z" fill="${r.kid2}"/><circle cx="1037" cy="32" r="2.2" fill="${c.glassWin}"/>` +
          `<path d="M1031 40 l-3 6 h4 Z M1043 40 l3 6 h-4 Z" fill="${r.kid3}"/><path d="M1035 42 l2 6 l2 -6z" fill="${p.amber}"/>` +
          `<rect x="1068" y="68" width="10" height="10" fill="${r.kid2}"/><rect x="1080" y="68" width="10" height="10" fill="${r.kid3}"/><rect x="1074" y="58" width="10" height="10" fill="${r.kid}"/>` +
          `<rect x="1100" y="58" width="34" height="20" rx="3" fill="${r.kid3}"/><rect x="1098" y="55" width="38" height="5" rx="2" fill="${r.kid}"/>` +
          ceilingLamp(c, 1190, on, 10) +
          bed(c, 1150, 116, r.kid, { pillows: 1 }) +
          (on ? `<circle cx="1284" cy="44" r="12" fill="${c.lampOn}" opacity="0.25"/>` : "") +
          `<path d="M1284 36 l2.4 5 5.4 0.6 -4 3.6 1.2 5.3 -5 -2.8 -5 2.8 1.2 -5.3 -4 -3.6 5.4 -0.6z" fill="${on ? c.lampOn : c.lamp}"/>` +
          (truthy(st.sleep) ? sleepZ(1180, 46, p.amber) : "") +
          ground(c.wood)
        );
      },
    },
    teen_room: {
      icon: "mdi:gamepad-variant",
      accent: "violet",
      bg: "wall2",
      keys: ["lights", "pc", "led"],
      // A desk with a gaming PC (screen lit when on), its chair, a LED strip along the ceiling in its color, a bed.
      draw: (c, st, p, mode) => {
        const r = ROOM[mode];
        const pc = truthy(st.pc);
        const ledRaw = st.led;
        const ledColor = ledRaw == null || ledRaw === "" || /^(off|false|0|none|unavailable|unknown)$/i.test(String(ledRaw)) ? null : truthy(ledRaw) ? p.violet : colorOf(ledRaw, mode, p.violet);
        return (
          floorStrip(c, c.floor2) +
          (ledColor ? `<rect x="0" y="0" width="1600" height="22" fill="${esc(ledColor)}" opacity="0.12"/><rect x="0" y="2" width="1600" height="3" fill="${esc(ledColor)}"/>` : `<rect x="0" y="2" width="1600" height="3" fill="${c.line}" opacity="0.5"/>`) +
          ceilingLamp(c, 1220, truthy(st.lights), 8) +
          frame(c, 982, 18, 28, 38, mode === "dark" ? "#2e2347" : "#efe7fb") +
          `<path d="M988 50 L996 24 L1004 50 M990 44 H1002" fill="none" stroke="${r.teen}" stroke-width="2"/>` +
          (pc ? `<ellipse cx="1074" cy="40" rx="40" ry="18" fill="${p.cyan}" opacity="0.14"/>` : "") +
          `<rect x="1046" y="26" width="56" height="32" rx="2" fill="${c.rack}"/><rect x="1049" y="29" width="50" height="24" fill="${pc ? (mode === "dark" ? "#18344a" : "#cfe9f5") : c.unit}"/>` +
          (pc ? `<path d="M1054 46 l8 -8 6 5 10 -10 8 6 8 -6" fill="none" stroke="${p.cyan}" stroke-width="1.6"/><circle cx="1090" cy="35" r="2" fill="${p.violet}"/>` : "") +
          `<path d="M1074 58 V62 M1066 62 H1082" stroke="${c.rack}" stroke-width="2.4"/>` +
          `<rect x="1110" y="38" width="16" height="24" rx="2" fill="${c.rack}"/><circle cx="1118" cy="44" r="1.6" fill="${pc ? p.violet : c.line}"/><path d="M1113 52 H1123" stroke="${pc ? r.teen : c.unit}" stroke-width="2"/>` +
          `<rect x="1036" y="62" width="94" height="4" rx="1" fill="${c.wood}"/><path d="M1040 66 V78 M1126 66 V78" stroke="${c.wood}" stroke-width="3"/>` +
          `<rect x="1054" y="60" width="30" height="3" rx="1.5" fill="${c.line}"/>` +
          `<path d="M1150 40 Q1150 34 1158 34 H1164 Q1170 34 1170 40 V62 H1150Z" fill="${r.teen}"/><rect x="1146" y="62" width="28" height="5" rx="2" fill="${r.teen}"/><path d="M1160 67 V76 M1150 78 H1170" stroke="${c.line}" stroke-width="2.4"/>` +
          bed(c, 1196, 92, r.teen, { pillows: 1, foot: false }) +
          `<path d="M1260 52 a6 6 0 0 1 12 0" fill="none" stroke="${c.rack}" stroke-width="2"/><rect x="1258" y="51" width="4" height="6" rx="1.5" fill="${c.rack}"/><rect x="1270" y="51" width="4" height="6" rx="1.5" fill="${c.rack}"/>` +
          ground(c.floorBar)
        );
      },
    },
    garage: {
      icon: "mdi:garage",
      accent: "gray",
      bg: "wall2",
      keys: ["door", "car", "light"],
      // A workbench under its tool board, the car inside (or its empty spot), the sectional door raised to its position.
      draw: (c, st, p, mode) => {
        const shut = closedShare(st.door);
        const moving = /opening|closing/.test(String(st.door ?? "").toLowerCase());
        const car = st.car === undefined ? true : truthy(st.car);
        const doorH = Math.round(62 * shut);
        let panels = "";
        for (let y = 80 - doorH + 10; y < 80; y += 10) panels += `<path d="M1214 ${y} H1294" stroke="${c.line}" stroke-width="0.8" opacity="0.7"/>`;
        return (
          floorStrip(c, c.asphalt) +
          ceilingLamp(c, 1110, truthy(st.light), 4) +
          `<rect x="972" y="20" width="76" height="30" rx="2" fill="${c.wood}" opacity="0.5"/>` +
          `<path d="M984 26 V42 M980 26 H988" stroke="${c.line}" stroke-width="2"/><path d="M1000 24 V44" stroke="${c.line}" stroke-width="2.6"/><path d="M996 24 H1004 V30 H996Z" fill="${c.line}"/>` +
          `<path d="M1016 26 L1022 44 M1028 26 L1022 44" stroke="${c.line}" stroke-width="2"/><circle cx="1038" cy="32" r="5" fill="none" stroke="${c.line}" stroke-width="2"/>` +
          `<rect x="968" y="56" width="84" height="5" rx="1" fill="${c.wood}"/><path d="M972 61 V78 M1048 61 V78" stroke="${c.wood}" stroke-width="3"/>` +
          `<rect x="978" y="64" width="20" height="12" rx="1.5" fill="${p.red}" opacity="0.85"/><rect x="1020" y="48" width="14" height="8" rx="1.5" fill="${c.line}"/>` +
          (car
            ? plainCar({ glass: c.glassWin, tyre: c.tyre }, mode === "dark" ? "#5e6b80" : "#9aa7ba", 1080, 79)
            : `<rect x="1084" y="74" width="84" height="5" rx="2" fill="none" stroke="${c.line}" stroke-width="1.2" stroke-dasharray="5 4"/>`) +
          `<rect x="1206" y="14" width="96" height="66" fill="${c.rack}"/>` +
          `<rect x="1212" y="18" width="84" height="62" fill="${mode === "dark" ? "#16223a" : "#bcdcf5"}"/>` +
          `<rect x="1212" y="66" width="84" height="14" fill="${c.grass}"/>` +
          (doorH > 0 ? `<rect class="${moving ? "pulse" : ""}" x="1212" y="${80 - doorH}" width="84" height="${doorH}" fill="${c.appl}"/>${panels}` : "") +
          `<rect x="1204" y="12" width="100" height="4" fill="${c.line}"/>` +
          `<circle class="${moving ? "blink" : ""}" cx="1310" cy="22" r="2.4" fill="${moving ? p.amber : shut >= 1 ? p.green : p.blue}"/>` +
          ground(c.road)
        );
      },
    },
    hallway: {
      icon: "mdi:coat-rack",
      accent: "amber",
      bg: "wall",
      keys: ["lights", "motion", "door"],
      // Frames and a console with its lamp and key bowl, a runner on the floor, a coat rack, a room door (ajar
      // when open), a motion sensor in the corner.
      draw: (c, st, p, mode) => {
        const on = truthy(st.lights);
        const motion = truthy(st.motion);
        const open = truthy(st.door);
        return (
          floorStrip(c) +
          `<rect x="980" y="76" width="220" height="5" rx="2" fill="${p.red}" opacity="0.45"/>` +
          ceilingLamp(c, 1010, on, 4) +
          ceilingLamp(c, 1150, on, 4) +
          frame(c, 990, 28, 26, 20, mode === "dark" ? "#2b3a4f" : "#d7e6f4") +
          frame(c, 1024, 22, 20, 26, mode === "dark" ? "#3a2f2a" : "#f1e1cf") +
          `<rect x="1064" y="54" width="60" height="4" rx="1" fill="${c.wood}"/><path d="M1068 58 V76 M1120 58 V76" stroke="${c.wood}" stroke-width="2.6"/>` +
          tableLamp(c, 1078, 54, on) +
          `<path d="M1096 54 Q1104 48 1112 54Z" fill="${c.clay}"/><circle cx="1102" cy="51" r="1.6" fill="${p.amber}"/>` +
          `<path d="M1180 22 V76 M1172 78 H1188 M1170 26 H1190" stroke="${c.wood}" stroke-width="2.6"/>` +
          `<path d="M1170 26 Q1164 40 1166 58 H1176 Q1176 40 1172 26Z" fill="${p.blue}" opacity="0.75"/><path d="M1190 26 Q1196 38 1194 52 H1186 Q1186 38 1188 26Z" fill="${p.amber}" opacity="0.75"/>` +
          `<rect x="1218" y="16" width="56" height="62" rx="2" fill="${c.wood}"/>` +
          (open
            ? `<rect x="1222" y="20" width="48" height="58" fill="${on ? c.winOn : mode === "dark" ? "#2a2f3a" : "#5d5446"}" opacity="${on ? 0.55 : 1}"/><polygon points="1222,20 1236,24 1236,74 1222,78" fill="${c.door}"/>`
            : `<rect x="1222" y="20" width="48" height="58" fill="${c.door}"/><rect x="1228" y="26" width="36" height="20" rx="1" fill="none" stroke="${c.line}" stroke-width="0.8" opacity="0.6"/><rect x="1228" y="52" width="36" height="20" rx="1" fill="none" stroke="${c.line}" stroke-width="0.8" opacity="0.6"/><circle cx="1262" cy="50" r="2" fill="${c.lampOn}"/>`) +
          `<rect x="1292" y="6" width="10" height="8" rx="2" fill="${c.appl}" stroke="${c.line}"/><circle class="${motion ? "blink" : ""}" cx="1297" cy="10" r="2" fill="${motion ? p.red : c.line}"/>` +
          (motion ? `<path d="M1288 18 a10 10 0 0 1 18 0 M1284 24 a16 16 0 0 1 26 0" fill="none" stroke="${p.red}" stroke-width="1.2" opacity="0.6"/>` : "") +
          ground(c.wood)
        );
      },
    },
    office: {
      icon: "mdi:desk",
      accent: "blue",
      bg: "wall",
      keys: ["pc", "lamp", "busy"],
      // A bookcase, a desk with two screens (lit when the computer is on), its lamp and chair, a plant, an "on air"
      // light over the desk during a call.
      draw: (c, st, p, mode) => {
        const pc = truthy(st.pc);
        const busy = truthy(st.busy);
        const screen = pc ? (mode === "dark" ? "#1d3550" : "#d6e6fb") : c.unit;
        const books = [p.blue, p.amber, p.green, p.red, p.violet, p.cyan, p.gray];
        let shelf = "";
        for (const [row, y] of [[0, 24], [1, 44], [2, 64]])
          for (let i = 0; i < 5; i++) shelf += `<rect x="${978 + i * 8 + (row % 2) * 2}" y="${y - (i % 2 ? 12 : 14)}" width="6" height="${i % 2 ? 12 : 14}" fill="${books[(i + row * 2) % books.length]}" opacity="0.8"/>`;
        return (
          floorStrip(c) +
          `<rect x="972" y="8" width="52" height="70" rx="2" fill="${c.wood}"/>` +
          [24, 44, 64].map((y) => `<rect x="974" y="${y}" width="48" height="2" fill="${c.wall}"/>`).join("") +
          shelf +
          `<rect x="1104" y="8" width="40" height="13" rx="3" fill="${c.rack}"/>` +
          `<text class="${busy ? "pulse" : ""}" x="1124" y="17.5" font-size="7.5" font-weight="700" text-anchor="middle" fill="${busy ? p.red : c.line}" font-family="inherit">ON AIR</text>` +
          (pc ? `<ellipse cx="1124" cy="44" rx="56" ry="16" fill="${p.blue}" opacity="0.12"/>` : "") +
          `<rect x="1072" y="30" width="48" height="28" rx="2" fill="${c.rack}"/><rect x="1075" y="33" width="42" height="21" fill="${screen}"/>` +
          `<rect x="1126" y="30" width="48" height="28" rx="2" fill="${c.rack}"/><rect x="1129" y="33" width="42" height="21" fill="${screen}"/>` +
          (pc
            ? `<path d="M1079 38 H1105 M1079 43 H1111 M1079 48 H1099" stroke="${p.blue}" stroke-width="1.6"/><rect x="1134" y="38" width="12" height="12" fill="${p.green}" opacity="0.7"/><rect x="1150" y="42" width="8" height="8" fill="${p.amber}" opacity="0.7"/><rect x="1162" y="36" width="5" height="14" fill="${p.blue}" opacity="0.7"/>`
            : "") +
          `<path d="M1096 58 V62 M1150 58 V62" stroke="${c.rack}" stroke-width="2.4"/>` +
          `<rect x="1060" y="62" width="150" height="4" rx="1" fill="${c.wood}"/><path d="M1064 66 V78 M1206 66 V78" stroke="${c.wood}" stroke-width="3"/>` +
          tableLamp(c, 1194, 62, truthy(st.lamp)) +
          `<rect x="1108" y="59" width="32" height="3" rx="1.5" fill="${c.line}"/>` +
          `<path d="M1218 42 Q1218 36 1226 36 H1232 Q1238 36 1238 42 V62 H1218Z" fill="${c.rack}"/><rect x="1214" y="62" width="28" height="5" rx="2" fill="${c.rack}"/><path d="M1228 67 V76 M1218 78 H1238" stroke="${c.line}" stroke-width="2.4"/>` +
          plant(c, 1270, 78) +
          ground(c.wood)
        );
      },
    },
    laundry: {
      icon: "mdi:washing-machine",
      accent: "cyan",
      bg: "wall2",
      keys: ["washer", "dryer"],
      // A shelf of detergent, the washing machine and the dryer (their drums turning while they run), a laundry basket
      // and a drying rack.
      draw: (c, st, p, mode) => {
        const r = ROOM[mode];
        const machine = (x, run, color) =>
          `<rect x="${x}" y="30" width="54" height="48" rx="4" fill="${c.appl}" stroke="${c.line}"/>` +
          `<rect x="${x + 4}" y="34" width="26" height="6" rx="2" fill="${c.line}" opacity="0.6"/><circle cx="${x + 44}" cy="37" r="2.4" fill="${run ? color : c.line}"/>` +
          `<circle cx="${x + 27}" cy="59" r="14" fill="${c.glassWin}" stroke="${c.line}" stroke-width="2"/>` +
          `<g class="${run ? "spin" : ""}"><circle cx="${x + 27}" cy="59" r="12" fill="none"/><path d="M${x + 19} ${62} q8 -10 16 -2 q-6 8 -16 2z" fill="${color}" opacity="${run ? 0.85 : 0.35}"/><circle cx="${x + 30}" cy="53" r="3" fill="${color}" opacity="${run ? 0.7 : 0.3}"/></g>` +
          (run ? `<rect class="progress" x="${x + 4}" y="43" width="22" height="2.4" rx="1.2" fill="${color}"/>` : "");
        return (
          floorStrip(c, c.floor2) +
          `<rect x="1016" y="16" width="130" height="3" rx="1" fill="${c.wood}"/>` +
          `<rect x="1026" y="2" width="12" height="14" rx="2" fill="${p.blue}" opacity="0.8"/><rect x="1044" y="5" width="10" height="11" rx="2" fill="${p.green}" opacity="0.8"/><rect x="1060" y="4" width="14" height="12" rx="2" fill="${r.towel}"/>` +
          machine(1020, truthy(st.washer), p.cyan) +
          machine(1084, truthy(st.dryer), p.amber) +
          `<path d="M1162 56 H1206 L1200 78 H1168Z" fill="${c.wood}" opacity="0.8"/><path d="M1166 60 H1202 M1168 66 H1200 M1170 72 H1198" stroke="${c.wall2}" stroke-width="1"/>` +
          `<path d="M1168 56 q6 -8 14 -2 q6 -6 16 0" fill="${r.towel}"/>` +
          `<path d="M1222 78 L1244 34 L1266 78 M1210 78 L1244 34 L1278 78 M1226 44 H1262" stroke="${c.line}" stroke-width="1.8" fill="none"/>` +
          `<rect x="1230" y="44" width="10" height="16" rx="1" fill="${p.violet}" opacity="0.6"/><rect x="1244" y="44" width="14" height="12" rx="1" fill="${p.amber}" opacity="0.6"/>` +
          ground(c.floorBar)
        );
      },
    },
    entrance: {
      icon: "mdi:door-closed",
      accent: "amber",
      bg: "sky",
      keys: ["light", "door", "doorbell", "mailbox", "parcel"],
      // The front of the house: the door under its porch light (ringing doorbell, door open), the steps and the path,
      // the letterbox (flag up when there is mail), a parcel left on the doorstep.
      draw: (c, st, p, mode, _hass, _val, narrow) => {
        const lit = truthy(st.light);
        const open = truthy(st.door);
        const ring = truthy(st.doorbell);
        const mail = truthy(st.mailbox);
        return (
          stars(c, [[640, 16, 1.2], [780, 32, 1], [960, 12, 1.3]]) +
          sun(c, narrow, 880, 26, 12) +
          hills(c, "M0 74 Q250 62 500 70 T1000 66 T1400 70 V90 H0z") +
          tree(c, 1010, 60, 13) +
          `<rect x="1080" y="36" width="190" height="50" fill="${c.house}"/><polygon points="1066,38 1175,6 1284,38" fill="${c.roof}"/>` +
          `<rect x="1232" y="18" width="10" height="14" fill="${c.roof}"/>` +
          `<rect x="1094" y="46" width="24" height="18" rx="2" fill="${lit ? c.winOn : c.winOff}"/><rect x="1232" y="46" width="24" height="18" rx="2" fill="${lit ? c.winOn : c.winOff}"/>` +
          `<polygon points="1140,48 1175,40 1210,48" fill="${c.roof}"/>` +
          `<rect x="1152" y="48" width="46" height="32" fill="${c.wood}"/>` +
          (open
            ? `<rect x="1156" y="52" width="38" height="28" fill="${mode === "dark" ? "#2a2f3a" : "#5d5446"}"/><polygon points="1156,52 1166,55 1166,78 1156,80" fill="${c.door}"/>`
            : `<rect x="1156" y="52" width="38" height="28" fill="${c.door}"/><rect x="1167" y="56" width="16" height="8" rx="2" fill="${c.glassWin}"/><circle cx="1188" cy="68" r="1.8" fill="${c.lampOn}"/>`) +
          (lit ? `<circle cx="1142" cy="56" r="14" fill="${c.lampOn}" opacity="0.3"/>` : "") +
          `<rect x="1138" y="52" width="7" height="9" rx="2" fill="${lit ? c.lampOn : c.lamp}" stroke="${c.line}" stroke-width="0.8"/>` +
          `<rect x="1203" y="60" width="6" height="9" rx="1.5" fill="${c.appl}" stroke="${c.line}" stroke-width="0.8"/><circle class="${ring ? "blink" : ""}" cx="1206" cy="64.5" r="1.8" fill="${ring ? p.amber : c.line}"/>` +
          (ring ? `<g class="pulse" fill="none" stroke="${p.amber}" stroke-width="1.4" stroke-linecap="round"><path d="M1213 59 a7 7 0 0 1 0 11"/><path d="M1217 56 a12 12 0 0 1 0 17"/></g>` : "") +
          `<rect x="1144" y="80" width="62" height="3" fill="${c.line}"/><rect x="1138" y="83" width="74" height="3" fill="${c.line}" opacity="0.8"/>` +
          (truthy(st.parcel) ? `<rect x="1194" y="70" width="14" height="10" rx="1" fill="${c.clay}"/><path d="M1194 74 H1208 M1201 70 V80" stroke="${c.wood}" stroke-width="1"/>` : "") +
          `<path d="M1288 86 V60" stroke="${c.line}" stroke-width="2.4"/>` +
          `<path d="M1278 48 H1294 Q1300 48 1300 54 V62 H1278Z" fill="${p.blue}" opacity="0.85"/><rect x="1280" y="54" width="10" height="2" fill="${c.appl}"/>` +
          `<path d="M1300 56 V${mail ? 42 : 56}" stroke="${mail ? p.red : c.line}" stroke-width="1.6"/>` +
          (mail ? `<rect x="1300" y="42" width="8" height="5" fill="${p.red}"/>` : `<rect x="1300" y="54" width="8" height="3" fill="${c.line}"/>`) +
          `<g fill="${c.tree}"><circle cx="1072" cy="78" r="7"/><circle cx="1063" cy="81" r="5"/><circle cx="1228" cy="78" r="6"/></g>` +
          ground(c.grass)
        );
      },
    },
    garden: {
      icon: "mdi:flower",
      accent: "green",
      bg: "sky",
      keys: ["watering", "mower", "lights"],
      // Trees, a shed, flower beds and garden lamps; the sprinkler sprays while watering, the robot mower leaves
      // its station while mowing.
      draw: (c, st, p, mode, _hass, _val, narrow) => {
        const water = truthy(st.watering);
        const mowing = /mow|clean|run|on|active|tonte|leaving/.test(String(st.mower ?? "").toLowerCase()) && !/dock|charg|home|off|paus|idle/.test(String(st.mower ?? "").toLowerCase());
        const lamp = truthy(st.lights);
        const r = ROOM[mode];
        const flowers = (x) =>
          [0, 9, 18, 27].map((d, i) => `<path d="M${x + d} 80 V72" stroke="${c.tree}" stroke-width="1.4"/><circle cx="${x + d}" cy="71" r="3" fill="${[r.kid2, r.kid, r.baby, p.violet][i]}"/>`).join("");
        const gardenLamp = (x) =>
          (lamp ? `<circle cx="${x}" cy="66" r="10" fill="${c.lampOn}" opacity="0.28"/>` : "") +
          `<path d="M${x} 86 V68" stroke="${c.line}" stroke-width="1.6"/><rect x="${x - 3}" y="62" width="6" height="7" rx="1.5" fill="${lamp ? c.lampOn : c.lamp}"/>`;
        return (
          stars(c, [[700, 18, 1.2], [860, 30, 1], [1300, 14, 1.2]]) +
          sun(c, narrow, 900, 24, 12) +
          `<g fill="${c.cloud}"><ellipse cx="1180" cy="20" rx="26" ry="7"/><ellipse cx="1198" cy="15" rx="15" ry="7"/></g>` +
          hills(c, "M0 72 Q200 58 420 68 T860 64 T1400 66 V90 H0z") +
          `<rect x="0" y="76" width="1600" height="10" fill="${c.grass}" opacity="0.6"/>` +
          tree(c, 990, 52, 16) +
          tree(c, 1024, 62, 10) +
          `<rect x="1046" y="50" width="44" height="30" fill="${c.wood}"/><polygon points="1040,52 1068,36 1096,52" fill="${c.roof}"/><rect x="1062" y="60" width="12" height="20" fill="${c.door}"/>` +
          `<rect x="1046" y="80" width="18" height="5" rx="2" fill="${c.line}"/>` +
          `<g class="${mowing ? "robot-away" : ""}"><path d="M1102 82 Q1104 74 1114 74 H1124 Q1132 74 1134 82Z" fill="${p.green}"/><circle cx="1108" cy="83" r="2.6" fill="${c.tyre}"/><circle cx="1128" cy="83" r="2.6" fill="${c.tyre}"/></g>` +
          flowers(1150) +
          `<path d="M1222 86 V78" stroke="${c.line}" stroke-width="2.4"/><circle cx="1222" cy="77" r="2.6" fill="${c.line}"/>` +
          (water
            ? `<g class="spray" fill="${p.cyan}"><circle cx="1206" cy="66" r="1.6"/><circle cx="1196" cy="70" r="1.4"/><circle cx="1214" cy="60" r="1.6"/><circle cx="1230" cy="60" r="1.6"/><circle cx="1240" cy="66" r="1.6"/><circle cx="1248" cy="72" r="1.4"/></g>` +
              `<path d="M1198 76 Q1222 44 1246 76" fill="none" stroke="${p.cyan}" stroke-width="1.2" stroke-dasharray="2 4" opacity="0.7"/>`
            : "") +
          flowers(1252) +
          gardenLamp(1140) +
          gardenLamp(1294) +
          ground(c.grass)
        );
      },
    },
    entryway: {
      icon: "mdi:door-open",
      accent: "green",
      bg: "wall",
      keys: ["lights", "lock", "alarm", "door"],
      // The front door from inside (its lock LED, open when it is), the alarm keypad beside it, coat hooks, a mirror,
      // the key holder, a shoe bench and an umbrella stand on the doormat.
      draw: (c, st, p, mode) => {
        const on = truthy(st.lights);
        const lock = String(st.lock ?? "locked").toLowerCase();
        const lockColor = lock === "locked" ? p.green : /jammed|open$/.test(lock) ? p.red : p.amber;
        const alarm = String(st.alarm ?? "").toLowerCase();
        const alarmColor = /triggered/.test(alarm) ? p.red : /pending|arming/.test(alarm) ? p.amber : alarm.startsWith("armed") ? p.green : p.gray;
        const open = truthy(st.door);
        return (
          floorStrip(c) +
          ceilingLamp(c, 1060, on, 4) +
          `<path d="M968 30 H1032" stroke="${c.wood}" stroke-width="3"/>` +
          [976, 994, 1012, 1028].map((x) => `<circle cx="${x}" cy="33" r="1.8" fill="${c.line}"/>`).join("") +
          `<path d="M974 34 Q968 46 970 62 H980 Q980 46 976 34Z" fill="${p.red}" opacity="0.7"/><path d="M992 34 Q988 44 990 56 H998 Q998 44 994 34Z" fill="${p.blue}" opacity="0.75"/>` +
          `<path d="M1010 34 Q1004 40 1006 50 H1018 Q1020 40 1012 34Z" fill="${p.amber}" opacity="0.7"/>` +
          `<rect x="966" y="64" width="70" height="5" rx="1" fill="${c.wood}"/><rect x="970" y="69" width="62" height="7" fill="${c.wood}" opacity="0.5"/>` +
          `<path d="M974 76 h10 v-3 q-6 0 -8 -3 h-2z M990 76 h10 v-3 q-6 0 -8 -3 h-2z" fill="${c.rack}"/><path d="M1012 76 h12 v-4 q-7 0 -9 -2 h-3z" fill="${p.blue}" opacity="0.8"/>` +
          `<ellipse cx="1080" cy="38" rx="13" ry="18" fill="${c.glassWin}" stroke="${c.wood}" stroke-width="2.5"/><path d="M1074 30 l8 -6 M1074 38 l12 -10" stroke="#ffffff" stroke-width="1.2" opacity="0.6"/>` +
          `<rect x="1110" y="34" width="22" height="12" rx="2" fill="${c.wood}"/><path d="M1115 46 v5 M1121 46 v6 M1127 46 v4" stroke="${p.amber}" stroke-width="1.6"/>` +
          `<rect x="1158" y="18" width="62" height="62" rx="2" fill="${c.wood}"/>` +
          (open
            ? `<rect x="1162" y="22" width="54" height="58" fill="${mode === "dark" ? "#16223a" : "#bcdcf5"}"/><rect x="1162" y="66" width="54" height="14" fill="${c.grass}"/>` +
              `<polygon points="1216,22 1236,16 1236,84 1216,80" fill="${c.door}"/>`
            : `<rect x="1162" y="22" width="54" height="58" fill="${c.door}"/><rect x="1170" y="28" width="38" height="20" rx="2" fill="${mode === "dark" ? "#16223a" : "#bcdcf5"}"/>` +
              `<path d="M1189 28 V48" stroke="${c.door}" stroke-width="2"/><rect x="1206" y="54" width="6" height="12" rx="2" fill="${c.line}"/>` +
              `<circle class="${lockColor === p.red ? "blink" : ""}" cx="1209" cy="58" r="1.8" fill="${lockColor}"/>`) +
          `<rect x="1164" y="80" width="50" height="4" rx="1.5" fill="${c.clay}"/>` +
          `<rect x="1242" y="40" width="20" height="26" rx="3" fill="${c.appl}" stroke="${c.line}"/><rect x="1245" y="43" width="14" height="6" rx="1" fill="${c.rack}"/>` +
          `<circle class="${/triggered|pending|arming/.test(alarm) ? "blink" : ""}" cx="1252" cy="46" r="1.8" fill="${alarmColor}"/>` +
          [0, 1, 2].map((row) => [0, 1, 2].map((col) => `<rect x="${1246 + col * 4.5}" y="${52 + row * 4}" width="3" height="2.5" rx="0.6" fill="${c.line}"/>`).join("")).join("") +
          `<rect x="1270" y="60" width="14" height="18" rx="2" fill="${c.rack}"/><path d="M1274 60 V40 Q1274 36 1278 38 M1280 60 V44" stroke="${p.violet}" stroke-width="2" fill="none"/>` +
          ground(c.wood)
        );
      },
    },
    pool: {
      icon: "mdi:pool",
      accent: "cyan",
      bg: "sky",
      keys: ["pump", "light", "heater", "cleaner", "cover"],
      // The pool in its deck: ripples while the pump runs, an underwater glow when its light is on, the robot cleaner
      // crossing the bottom, the cover rolled over the water to its closed share, the heat pump's fan turning, a
      // parasol and a sun lounger.
      draw: (c, st, p, mode, _hass, _val, narrow) => {
        const r = ROOM[mode];
        const pump = truthy(st.pump);
        const lit = truthy(st.light);
        const heat = truthy(st.heater);
        const clean = truthy(st.cleaner);
        const coverW = Math.round(190 * closedShare(st.cover));
        let slats = "";
        for (let x = 1084 + 8; x < 1084 + coverW; x += 8) slats += `<path d="M${x} 70 V86" stroke="${c.line}" stroke-width="0.6" opacity="0.6"/>`;
        let waves = "";
        for (let x = 1096; x < 1262; x += 12) waves += `<path d="M${x} 75 q3 -2 6 0 t6 0" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.7"/>`;
        return (
          stars(c, [[700, 16, 1.2], [860, 30, 1], [1230, 14, 1.2]]) +
          sun(c, narrow, 900, 24, 12) +
          `<g fill="${c.cloud}"><ellipse cx="1160" cy="22" rx="26" ry="7"/><ellipse cx="1178" cy="17" rx="15" ry="7"/></g>` +
          hills(c, "M0 72 Q220 58 440 68 T880 64 T1400 66 V90 H0z") +
          tree(c, 968, 52, 14) +
          `<rect x="0" y="76" width="1600" height="10" fill="${c.deck}"/>` +
          `<path d="M1010 76 V30" stroke="${c.line}" stroke-width="2"/>` +
          `<path d="M982 36 Q1010 14 1038 36Z" fill="${r.kid2}"/><path d="M1001 34 Q1010 18 1019 34Z" fill="${c.white}" opacity="0.8"/>` +
          `<path d="M1000 68 H1040 L1056 56" fill="none" stroke="${c.wood}" stroke-width="3" stroke-linecap="round"/><path d="M1004 68 V76 M1036 68 V76 M1052 60 V76" stroke="${c.wood}" stroke-width="2"/>` +
          `<rect x="1080" y="68" width="198" height="3" rx="1.5" fill="${c.white}"/>` +
          `<rect x="1084" y="71" width="190" height="15" fill="${r.water}"/>` +
          (lit ? `<ellipse cx="1180" cy="80" rx="58" ry="7" fill="${r.glow}" opacity="0.55"/><circle cx="1180" cy="82" r="2.4" fill="${c.lampOn}"/>` : "") +
          `<g class="${pump ? "ripple" : ""}">${waves}</g>` +
          `<g class="${clean ? "robot-away" : ""}"><rect x="1240" y="80" width="16" height="6" rx="2" fill="${p.violet}"/><path d="M1248 80 V74" stroke="${c.line}" stroke-width="1" opacity="0.7"/></g>` +
          (coverW > 0 ? `<rect x="1084" y="70" width="${coverW}" height="16" fill="${r.cover}"/>${slats}` : "") +
          `<rect x="1072" y="64" width="10" height="22" rx="2" fill="${c.line}"/>` +
          `<path d="M1258 86 V62 Q1258 56 1264 56 M1268 86 V62 Q1268 56 1274 56 M1258 74 H1268 M1258 80 H1268" fill="none" stroke="${c.line}" stroke-width="1.8"/>` +
          `<rect x="1292" y="52" width="38" height="28" rx="3" fill="${c.appl}" stroke="${c.line}"/>` +
          extractor(c, 1306, 66, heat) +
          `<circle cx="1323" cy="58" r="2" fill="${heat ? p.amber : c.line}"/><path d="M1296 80 v4 M1326 80 v4" stroke="${c.line}" stroke-width="2"/>` +
          ground(c.wood)
        );
      },
    },
    game_room: {
      icon: "mdi:billiards",
      accent: "violet",
      bg: "wall2",
      keys: ["lights", "tv", "arcade", "neon"],
      // A neon sign in its color, an arcade cabinet (its screen lit), a pool table under its long lamp, a TV and its
      // console between two bean bags.
      draw: (c, st, p, mode) => {
        const r = ROOM[mode];
        const on = truthy(st.lights);
        const tv = truthy(st.tv);
        const arcade = truthy(st.arcade);
        const neonRaw = st.neon;
        const neon = neonRaw == null || neonRaw === "" || /^(off|false|0|none|unavailable|unknown)$/i.test(String(neonRaw)) ? null : truthy(neonRaw) ? p.violet : colorOf(neonRaw, mode, p.violet);
        const screenOn = mode === "dark" ? "#18344a" : "#cfe9f5";
        return (
          floorStrip(c, c.floor2) +
          (neon ? `<rect x="972" y="10" width="72" height="22" rx="6" fill="${esc(neon)}" opacity="0.14"/>` : "") +
          `<text class="${neon ? "pulse" : ""}" x="1008" y="26" font-size="13" font-weight="700" text-anchor="middle" fill="none" stroke="${neon ? esc(neon) : c.line}" stroke-width="1.4" font-family="inherit">PLAY</text>` +
          (arcade ? `<ellipse cx="1000" cy="48" rx="26" ry="16" fill="${p.cyan}" opacity="0.14"/>` : "") +
          `<path d="M984 78 V40 L990 34 V28 H1012 V34 L1018 40 V78Z" fill="${c.rack}"/>` +
          `<rect x="990" y="36" width="22" height="16" fill="${arcade ? screenOn : c.unit}"/>` +
          (arcade
            ? `<g class="blink" fill="${p.green}"><rect x="994" y="40" width="3" height="3"/><rect x="1000" y="40" width="3" height="3"/><rect x="1006" y="40" width="3" height="3"/></g><rect x="999" y="47" width="5" height="2.4" fill="${p.amber}"/>`
            : "") +
          `<rect x="986" y="56" width="30" height="4" fill="${c.unit}"/><circle cx="994" cy="56" r="2" fill="${p.red}"/><circle cx="1006" cy="57" r="1.6" fill="${p.blue}"/><circle cx="1011" cy="57" r="1.6" fill="${p.amber}"/>` +
          `<path d="M1110 0 V14 M1160 0 V14" stroke="${c.line}" stroke-width="1"/>` +
          (on ? `<path d="M1104 20 L1078 56 H1192 L1166 20Z" fill="${c.lampOn}" opacity="0.14"/>` : "") +
          `<path d="M1100 20 Q1102 14 1110 14 H1160 Q1168 14 1170 20Z" fill="${on ? c.lampOn : c.lamp}"/><rect x="1100" y="19" width="70" height="2" fill="${c.line}"/>` +
          `<rect x="1070" y="54" width="130" height="6" rx="2" fill="${c.wood}"/><rect x="1074" y="54" width="122" height="3" fill="${r.felt}"/>` +
          `<path d="M1078 60 L1080 78 M1192 60 L1190 78" stroke="${c.wood}" stroke-width="5"/><rect x="1086" y="60" width="98" height="6" fill="${c.wood}" opacity="0.7"/>` +
          `<circle cx="1110" cy="51.5" r="2.6" fill="${c.white}"/><circle cx="1146" cy="51.5" r="2.6" fill="${p.red}"/><circle cx="1152" cy="51.5" r="2.6" fill="${p.amber}"/><circle cx="1158" cy="51.5" r="2.6" fill="${c.rack}"/>` +
          `<path d="M1066 30 L1088 52" stroke="${c.wood}" stroke-width="1.8" stroke-linecap="round"/>` +
          (tv ? `<ellipse cx="1254" cy="40" rx="40" ry="18" fill="${p.blue}" opacity="0.14"/>` : "") +
          `<rect x="1222" y="24" width="64" height="36" rx="2" fill="${c.rack}"/><rect x="1225" y="27" width="58" height="30" fill="${tv ? screenOn : c.unit}"/>` +
          (tv ? `<g class="pulse"><path d="M1232 50 l10 -10 8 6 12 -12 10 8" fill="none" stroke="${p.violet}" stroke-width="1.8"/><circle cx="1272" cy="34" r="3" fill="${p.amber}"/></g>` : "") +
          `<rect x="1230" y="66" width="48" height="8" rx="2" fill="${c.wood}"/><rect x="1244" y="62" width="20" height="4" rx="1.5" fill="${c.white}"/><circle cx="1260" cy="64" r="1" fill="${tv ? p.blue : c.line}"/>` +
          `<path d="M1206 78 Q1204 62 1216 62 Q1226 62 1226 78Z" fill="${r.kid3}"/><path d="M1290 78 Q1288 62 1300 62 Q1310 62 1310 78Z" fill="${r.kid2}"/>` +
          ground(c.floorBar)
        );
      },
    },
    living_room: {
      icon: "mdi:sofa",
      accent: "amber",
      bg: "wall",
      keys: ["lights", "tv", "shutter"],
      // The window and its roller shutter, a floor lamp, the sofa under a picture, a coffee table on a rug, the TV on
      // its stand (lit when on), a plant.
      draw: (c, st, p, mode) => {
        const r = ROOM[mode];
        const on = truthy(st.lights);
        const tv = truthy(st.tv);
        return (
          floorStrip(c) +
          `<rect x="1060" y="76" width="130" height="4" rx="2" fill="${p.red}" opacity="0.35"/>` +
          roomWindow(c, mode, 960, 18, 40, 42, closedShare(st.shutter)) +
          (on ? `<circle cx="1026" cy="26" r="18" fill="${c.lampOn}" opacity="0.22"/>` : "") +
          `<path d="M1026 30 V76 M1018 78 H1034" stroke="${c.line}" stroke-width="2"/><path d="M1016 30 L1020 18 H1032 L1036 30Z" fill="${on ? c.lampOn : c.lamp}"/>` +
          frame(c, 1074, 14, 50, 26, mode === "dark" ? "#33405c" : "#cfe0d0") +
          `<path d="M1078 36 L1090 26 L1098 32 L1108 22 L1120 36Z" fill="${c.tree}"/>` +
          `<path d="M1048 48 Q1048 42 1054 42 H1144 Q1150 42 1150 48 V60 H1048Z" fill="${r.sofa}"/>` +
          `<rect x="1042" y="54" width="12" height="20" rx="4" fill="${r.sofa}"/><rect x="1144" y="54" width="12" height="20" rx="4" fill="${r.sofa}"/>` +
          `<rect x="1052" y="58" width="94" height="12" rx="3" fill="${r.sofa}"/><path d="M1099 58 V70" stroke="${c.wall}" stroke-width="1" opacity="0.6"/>` +
          `<rect x="1060" y="48" width="14" height="10" rx="3" fill="${r.kid}"/><rect x="1124" y="48" width="14" height="10" rx="3" fill="${r.kid3}"/>` +
          `<path d="M1048 70 v6 M1150 70 v6" stroke="${c.wood}" stroke-width="2.4"/>` +
          `<rect x="1164" y="64" width="34" height="4" rx="1" fill="${c.wood}"/><path d="M1168 68 V76 M1194 68 V76" stroke="${c.wood}" stroke-width="2"/><rect x="1176" y="60" width="8" height="4" rx="1" fill="${c.clay}"/>` +
          (tv ? `<ellipse cx="1246" cy="38" rx="38" ry="16" fill="${p.blue}" opacity="0.14"/>` : "") +
          `<rect x="1214" y="22" width="64" height="36" rx="2" fill="${c.rack}"/><rect x="1217" y="25" width="58" height="30" fill="${tv ? (mode === "dark" ? "#1d3550" : "#d6e6fb") : c.unit}"/>` +
          (tv ? `<g class="pulse"><path d="M1217 46 Q1236 34 1252 42 T1275 38 V55 H1217Z" fill="${p.green}" opacity="0.5"/><circle cx="1262" cy="33" r="3.2" fill="${p.amber}"/></g>` : "") +
          `<rect x="1210" y="62" width="72" height="14" rx="2" fill="${c.wood}"/><path d="M1246 62 V76" stroke="${c.wall}" stroke-width="1"/><circle cx="1238" cy="69" r="1" fill="${c.line}"/><circle cx="1254" cy="69" r="1" fill="${c.line}"/>` +
          plant(c, 1298, 78) +
          ground(c.wood)
        );
      },
    },
    kitchen: {
      icon: "mdi:stove",
      accent: "red",
      bg: "wall2",
      keys: ["lights", "cooking", "oven", "hood", "dishwasher"],
      // Wall cabinets with lights under them, the hob (steam over the pan while cooking) under its hood (fan turning),
      // the oven (lit inside when on), the dishwasher (a programme bar while it runs), the sink and the fridge.
      draw: (c, st, p, mode) => {
        const r = ROOM[mode];
        const on = truthy(st.lights);
        const cook = truthy(st.cooking);
        const oven = truthy(st.oven);
        const hood = truthy(st.hood);
        const dish = truthy(st.dishwasher);
        let tiles = "";
        for (let x = 964; x <= 1246; x += 12) tiles += `<path d="M${x} 32 V56" stroke="${c.line}" stroke-width="0.5" opacity="0.35"/>`;
        return (
          floorStrip(c, c.floor2) +
          `<rect x="960" y="32" width="290" height="24" fill="${r.tile}"/>${tiles}<path d="M960 44 H1250" stroke="${c.line}" stroke-width="0.5" opacity="0.35"/>` +
          `<rect x="960" y="6" width="90" height="26" rx="2" fill="${c.appl}" stroke="${c.line}"/><path d="M1005 6 V32" stroke="${c.line}"/><path d="M999 24 V28 M1011 24 V28" stroke="${c.line}" stroke-width="1.6"/>` +
          `<rect x="1150" y="6" width="100" height="26" rx="2" fill="${c.appl}" stroke="${c.line}"/><path d="M1200 6 V32" stroke="${c.line}"/><path d="M1194 24 V28 M1206 24 V28" stroke="${c.line}" stroke-width="1.6"/>` +
          (on ? `<path d="M962 33 L952 56 H1058 L1048 33Z M1152 33 L1142 56 H1258 L1248 33Z" fill="${c.lampOn}" opacity="0.1"/>` : "") +
          `<rect x="964" y="32" width="82" height="2" fill="${on ? c.lampOn : c.line}"/><rect x="1154" y="32" width="92" height="2" fill="${on ? c.lampOn : c.line}"/>` +
          `<path d="M1086 0 V12 H1114 V0Z M1074 26 L1086 12 H1114 L1126 26Z" fill="${c.line}"/><rect x="1072" y="26" width="56" height="3" rx="1" fill="${c.line}"/>` +
          `<g class="${hood ? "spin" : ""}"><path d="M1100 19 l-5 -3 M1100 19 l5 -3 M1100 19 v5" stroke="${c.appl}" stroke-width="1.4"/></g>` +
          (cook
            ? `<g class="steam" fill="none" stroke="${p.cyan}" stroke-width="2" stroke-linecap="round" opacity="0.7"><path d="M1092 50 q-4 -5 0 -10 q4 -5 0 -10"/><path d="M1100 48 q-4 -5 0 -10 q4 -5 0 -10"/><path d="M1108 50 q-4 -5 0 -10 q4 -5 0 -10"/></g>`
            : "") +
          `<path d="M1084 52 H1116 V56 Q1116 58 1114 58 H1086 Q1084 58 1084 56Z" fill="${c.rack}"/><path d="M1116 53 H1128" stroke="${c.rack}" stroke-width="2.4"/>` +
          `<rect x="960" y="58" width="290" height="4" rx="1" fill="${c.wood}"/>` +
          `<rect x="1076" y="57" width="48" height="2" fill="${cook ? p.red : c.rack}"/>` +
          `<rect x="962" y="62" width="40" height="16" fill="${c.appl}" stroke="${c.line}"/><path d="M982 62 V78" stroke="${c.line}"/>` +
          `<rect x="1004" y="62" width="40" height="16" fill="${c.appl}" stroke="${c.line}"/><rect x="1008" y="64" width="20" height="2" rx="1" fill="${c.line}"/>` +
          `<circle cx="1038" cy="65" r="1.6" fill="${dish ? p.cyan : c.line}"/>` +
          (dish ? `<rect class="progress" x="1008" y="69" width="28" height="2.4" rx="1.2" fill="${p.cyan}"/>` : "") +
          `<rect x="1046" y="62" width="26" height="16" fill="${c.appl}" stroke="${c.line}"/>` +
          `<rect x="1076" y="62" width="48" height="16" fill="${c.rack}"/>` +
          `<rect x="1080" y="66" width="40" height="10" rx="1" fill="${oven ? c.lampOn : c.unit}" opacity="${oven ? 0.8 : 1}"/><path d="M1082 64.5 H1118" stroke="${c.line}" stroke-width="1.2"/>` +
          (oven ? `<rect class="pulse" x="1080" y="66" width="40" height="10" rx="1" fill="${p.red}" opacity="0.25"/>` : "") +
          `<rect x="1126" y="62" width="40" height="16" fill="${c.appl}" stroke="${c.line}"/><path d="M1146 62 V78" stroke="${c.line}"/>` +
          `<path d="M1170 56 V48 Q1170 44 1176 44 H1180" fill="none" stroke="${c.line}" stroke-width="2"/><rect x="1166" y="56" width="26" height="3" rx="1" fill="${c.line}"/>` +
          `<rect x="1168" y="62" width="40" height="16" fill="${c.appl}" stroke="${c.line}"/><path d="M1188 62 V78" stroke="${c.line}"/>` +
          `<rect x="1210" y="62" width="40" height="16" fill="${c.appl}" stroke="${c.line}"/>` +
          `<rect x="1262" y="8" width="42" height="70" rx="3" fill="${c.appl}" stroke="${c.line}"/><path d="M1262 32 H1304" stroke="${c.line}"/><path d="M1268 16 V26 M1268 38 V52" stroke="${c.line}" stroke-width="2"/>` +
          `<path d="M1268 78 v4 M1298 78 v4" stroke="${c.line}" stroke-width="2"/>` +
          ground(c.floorBar)
        );
      },
    },
    dining_room: {
      icon: "mdi:table-chair",
      accent: "green",
      bg: "wall",
      keys: ["lights", "shutter"],
      // The window and its roller shutter, a sideboard with a vase, the table and its chairs under the pendant lamp,
      // a mirror on the wall.
      draw: (c, st, p, mode) => {
        const on = truthy(st.lights);
        const chair = (x, flip) =>
          `<path d="M${x} 78 V46" stroke="${c.wood}" stroke-width="3"/><path d="M${x} 62 H${x + (flip ? -16 : 16)} V78" fill="none" stroke="${c.wood}" stroke-width="3"/>`;
        return (
          floorStrip(c) +
          roomWindow(c, mode, 960, 18, 40, 42, closedShare(st.shutter)) +
          `<rect x="1016" y="52" width="56" height="26" rx="2" fill="${c.wood}"/><path d="M1016 64 H1072 M1044 52 V78" stroke="${c.wall}" stroke-width="1"/>` +
          `<path d="M1030 52 Q1024 42 1030 36 H1036 Q1042 42 1036 52Z" fill="${p.blue}" opacity="0.7"/><path d="M1033 36 V28" stroke="${c.tree}" stroke-width="1.4"/><circle cx="1033" cy="27" r="3" fill="${p.red}" opacity="0.8"/>` +
          `<ellipse cx="1060" cy="34" rx="10" ry="14" fill="${c.glassWin}" stroke="${c.wood}" stroke-width="2.5"/>` +
          ceilingLamp(c, 1170, on, 16) +
          chair(1106, false) +
          chair(1234, true) +
          `<rect x="1112" y="56" width="116" height="4" rx="1" fill="${c.wood}"/><path d="M1120 60 V78 M1220 60 V78" stroke="${c.wood}" stroke-width="3.2"/>` +
          `<rect x="1150" y="52" width="10" height="4" rx="1" fill="${c.white}"/><rect x="1180" y="52" width="10" height="4" rx="1" fill="${c.white}"/>` +
          `<path d="M1168 56 V46" stroke="${c.white}" stroke-width="2.4"/>` +
          (on ? `<circle cx="1168" cy="44" r="4" fill="${c.lampOn}" opacity="0.5"/>` : "") +
          `<path d="M1166.5 46 Q1168 42 1169.5 46Z" fill="${on ? p.amber : c.line}"/>` +
          plant(c, 1270, 78) +
          ground(c.wood)
        );
      },
    },
  };
  const SCENE_ALIASES = { home: "maison", house: "maison", devices: "equipements", equipment: "equipements", "équipements": "equipements", cars: "voitures", vehicles: "voitures", energy: "energie", "énergie": "energie", system: "systeme", "système": "systeme", security: "securite", "sécurité": "securite", family: "famille", outdoor: "exterieur", "extérieur": "exterieur",
    // The rooms, entrances and garden have English names; their French names (and a few others) are aliases.
    salle_de_bain: "bathroom", salle_de_bains: "bathroom", sdb: "bathroom", toilettes: "toilet", toilets: "toilet", wc: "toilet",
    chambre_parents: "bedroom", chambre: "bedroom", master_bedroom: "bedroom", parents: "bedroom",
    chambre_bebe: "nursery", baby: "nursery", bebe: "nursery", baby_room: "nursery",
    chambre_enfant: "kids_room", kids: "kids_room", kid: "kids_room", child: "kids_room", enfant: "kids_room",
    chambre_ado: "teen_room", chambre_adolescent: "teen_room", teen: "teen_room", teenager: "teen_room", ado: "teen_room", adolescent: "teen_room",
    couloir: "hallway", hall: "hallway", corridor: "hallway", bureau: "office", study: "office", buanderie: "laundry", laundry_room: "laundry",
    entree: "entrance", entree_exterieure: "entrance", front_door: "entrance", porch: "entrance", outdoor_entrance: "entrance",
    entree_interieure: "entryway", foyer: "entryway", mudroom: "entryway", inside_entrance: "entryway", indoor_entrance: "entryway",
    jardin: "garden", yard: "garden",
    piscine: "pool", swimming_pool: "pool", spa: "pool",
    salle_de_jeux: "game_room", salle_de_jeu: "game_room", games_room: "game_room", gaming_room: "game_room", playroom: "game_room", billard: "game_room", arcade: "game_room",
    salon: "living_room", sejour: "living_room", living: "living_room", lounge: "living_room",
    cuisine: "kitchen", salle_a_manger: "dining_room", dining: "dining_room" };
  const sceneName = (v) => {
    const raw = String(v ?? "maison").toLowerCase();
    if (SCENES[raw]) return raw;
    if (SCENE_ALIASES[raw]) return SCENE_ALIASES[raw];
    // "Salle de bain", "chambre-bébé"…: accents dropped, spaces and dashes as underscores.
    const s = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/[\s-]+/g, "_");
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
    const mode = cfg.mode === "compact" || cfg.mode === "auto" ? cfg.mode : "illustrated";
    const below = Number(cfg.compact_below);
    return {
      scene,
      mode,
      compactBelow: Number.isFinite(below) && below > 0 ? below : null,
      collapse: mode !== "compact" && cfg.collapse_on_scroll !== false,
      title: cfg.title,
      subtitle: cfg.subtitle,
      icon: cfg.icon || (SCENES[scene] || SCENES.maison).icon,
      accent: cfg.accent || (SCENES[scene] || SCENES.maison).accent,
      status: cfg.status && (cfg.status.text != null || cfg.status.entity) ? cfg.status : null,
      sceneState: cfg.scene_state,
      illustrationTheme: cfg.illustration_theme === "day" || cfg.illustration_theme === "night" ? cfg.illustration_theme : null,
    };
  };

  // `mode: auto`: compact under `compact_below` px of window width, or (without it) where Home Assistant lays the page
  // out for a phone (its narrow layout, the sidebar hidden); illustrated otherwise. Resolved on every sync, so turning a
  // tablet or resizing the window switches the mode live.
  const effectiveMode = (cfg, width, narrow) => {
    if (cfg.mode !== "auto") return cfg.mode;
    return (cfg.compactBelow ? width < cfg.compactBelow : narrow) ? "compact" : "illustrated";
  };

  // A subview's header: the dashboard's block overlaid by the subview's own, no tabs (Home Assistant shows none there),
  // the back button in place of the sidebar button, the subview's title and icon. `subviews: false` on the dashboard
  // block keeps Home Assistant's native header on subviews.
  const resolveSubviewConfig = (lovelaceConfig, viewConfig) => {
    if (lovelaceConfig?.dashboard_header?.subviews === false && !viewConfig?.dashboard_header) return null;
    const cfg = resolveConfig(lovelaceConfig, viewConfig);
    if (!cfg) return null;
    const own = viewConfig?.dashboard_header || {};
    return {
      ...cfg,
      subview: true,
      title: own.title ?? viewConfig?.title ?? cfg.title,
      // The dashboard's title as a breadcrumb under the subview's, unless the subview gives its own subtitle.
      subtitle: own.subtitle ?? lovelaceConfig?.title ?? cfg.subtitle,
      icon: own.icon || viewConfig?.icon || cfg.icon,
    };
  };

  // App panels (add-on ingress pages such as /core_ssh) have no YAML of their own: their blocks are listed by URL path
  // under `dashboard_header.panels:` of any dashboard. The first dashboard listing a panel wins.
  const collectPanels = (configs) => {
    const map = {};
    for (const config of configs || []) {
      const panels = config?.dashboard_header?.panels;
      if (!panels || typeof panels !== "object") continue;
      for (const [key, block] of Object.entries(panels)) if (block && typeof block === "object" && !(key in map)) map[key] = block;
    }
    return map;
  };
  // A panel's block, read like a dashboard's; `views:` holds a block per view path (the Energy panel's tabs), laid
  // over it like a view's own block. App panels have no views and nothing to fold (the app scrolls inside its frame).
  const resolvePanelConfig = (panels, key, viewPath, fold = false) => {
    const block = key ? panels?.[key] : null;
    if (!block || typeof block !== "object") return null;
    const { views, ...base } = block;
    const view = viewPath != null && views && typeof views === "object" ? views[viewPath] : null;
    const cfg = resolveConfig({ dashboard_header: base }, { dashboard_header: view });
    return cfg && (fold ? cfg : { ...cfg, collapse: false });
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
  const findMain = () => document.querySelector("home-assistant")?.shadowRoot?.querySelector("home-assistant-main");
  // A dashboard's root, or the Energy panel's (ha-panel-energy renders the same hui-root): the one of the current page.
  const findRoot = () => {
    const panels = findMain()?.shadowRoot?.querySelectorAll("ha-panel-lovelace, ha-panel-energy") || [];
    const roots = [...panels].map((panel) => panel.shadowRoot?.querySelector("hui-root")).filter(Boolean);
    const prefix = `/${location.pathname.split("/")[1] || ""}`;
    return roots.find((r) => r.route?.prefix === prefix) || roots[0] || document.querySelector("hui-root");
  };
  // The app panel (src/panels/app/ha-panel-app.ts): its own small header (phones, sidebar always hidden) and the iframe.
  const findApp = () => findMain()?.shadowRoot?.querySelector("ha-panel-app") || document.querySelector("ha-panel-app");
  const panelKey = (app) => app?.panel?.url_path || decodeURIComponent(location.pathname.split("/")[1] || "");
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
    .header .toolbar ha-menu-button, .header .toolbar ha-icon-button-arrow-prev { display: none !important; }
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
      if (this._cfg?.subview) return [];
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

    _goBack() {
      const arrow = this._root?.shadowRoot?.querySelector(".toolbar ha-icon-button-arrow-prev");
      if (arrow) return arrow.click();
      const views = this._root?.lovelace?.config?.views || [];
      const back = views[currentViewIndex(this._root, views)]?.back_path;
      if (back) {
        history.pushState(null, "", back);
        return window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
      }
      history.back();
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
      const title = this.value(cfg.title) || root.lovelace?.config?.title || hass?.panels?.[root.route?.prefix?.slice(1)]?.title || root.panel?.title || root._addon?.name || "Home Assistant";
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
      // Units of the entities given (the Energy layouts show values with them).
      st.units = {};
      for (const [k, v] of Object.entries(cfg.sceneState || {}))
        if (typeof v === "string" && ENTITY_ID.test(v)) {
          const u = hass?.states?.[v]?.attributes?.unit_of_measurement;
          if (u) st.units[k] = u;
        }
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
      // An app panel draws its sidebar button in its own small header, shown under the same conditions.
      const app = root.localName === "ha-panel-app";
      const native = app ? null : root.shadowRoot?.querySelector(".toolbar ha-menu-button");
      const showMenu = app
        ? Boolean(root.shadowRoot?.querySelector(".header"))
        : native
          ? typeof native._show === "boolean"
            ? native._show
            : Boolean(native.shadowRoot?.querySelector("ha-icon-button"))
          : false;
      const menuDot = showMenu && Boolean(native?._hasNotifications);
      const backLabel = hass?.localize?.("ui.common.back") || "Back";
      const menuLabel = hass?.localize?.("ui.sidebar.sidebar_toggle") || "Menu";
      const menu = cfg.subview
        ? `<button class="menu back" type="button" aria-label="${esc(backLabel)}" title="${esc(backLabel)}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg></button>`
        : showMenu
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
        this.shadowRoot.querySelector("button.menu:not(.back)")?.addEventListener("click", () =>
          this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true })),
        );
        // Back: Home Assistant's own arrow does it (back_path, the history, or the dashboard's first view).
        this.shadowRoot.querySelector("button.back")?.addEventListener("click", () => this._goBack());
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
      s.setProperty("--dh-h", `${this.expandedHeight()}px`);
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
    .flow { stroke-dasharray: 0.1 12; stroke-linecap: round; animation: dh-flow 0.9s linear infinite; }
    .flow.rev { animation-direction: reverse; }
    .spin { animation: dh-spin 1.4s linear infinite; transform-box: fill-box; transform-origin: center; }
    .steam path { animation: dh-steam 2.4s ease-in-out infinite; }
    .steam path:nth-child(2) { animation-delay: -0.8s; }
    .steam path:nth-child(3) { animation-delay: -1.6s; }
    .sway { animation: dh-sway 3s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center top; }
    .zzz text { animation: dh-zzz 3s ease-in-out infinite; }
    .ripple { animation: dh-ripple 1.6s linear infinite; }
    @keyframes dh-ripple { 0% { transform: translateX(0); } 100% { transform: translateX(-12px); } }
    .spray circle { animation: dh-spray 1.2s ease-out infinite; }
    .spray circle:nth-child(2n) { animation-delay: -0.4s; }
    .spray circle:nth-child(3n) { animation-delay: -0.8s; }
    @keyframes dh-spray { 0% { opacity: 0; transform: translateY(4px); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateY(-3px); } }
    .zzz text:nth-child(2) { animation-delay: 0.5s; }
    .zzz text:nth-child(3) { animation-delay: 1s; }
    @keyframes dh-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes dh-steam { 0% { transform: translateY(4px); opacity: 0; } 40% { opacity: 0.8; } 100% { transform: translateY(-8px); opacity: 0; } }
    @keyframes dh-sway { 0% { transform: rotate(-6deg); } 100% { transform: rotate(6deg); } }
    @keyframes dh-zzz { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
    @keyframes dh-flow { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -12.1; } }
    @keyframes dh-blink { 0% { opacity: 1; } 100% { opacity: 0.25; } }
    @keyframes dh-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
    @keyframes dh-rain { 0% { transform: translateY(-6px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(18px); opacity: 0; } }
    @keyframes dh-robot { 0% { transform: translateX(0); } 100% { transform: translateX(-150px); } }
    @keyframes dh-drift { 0% { translate: 0 0; } 100% { translate: 6px 0; } }
    @keyframes dh-twinkle { 0% { opacity: 0.8; } 100% { opacity: 0.2; } }
    @keyframes dh-progress { 0% { transform: scaleX(0.3); } 100% { transform: scaleX(1); } }
    @media (prefers-reduced-motion: reduce) { .blink, .pulse, .rain path, .robot-away, .progress, .drift, .twinkle, .flow, .spin, .steam path, .sway, .zzz text, .spray circle, .ripple { animation: none; } }
  `;

  if (!customElements.get(TAG)) customElements.define(TAG, DashboardHeaderBanner);

  // ---- Wiring: follow the current dashboard, its view, edit mode and scrolling ----
  const state = { root: null, banner: null, observer: null, unsubEvents: null, conn: null, watchKey: null, queued: false, lovelaceConfig: null };

  // In an app panel the banner sits above the app's frame: the panel's own small header is hidden (the banner draws its
  // sidebar button) and the frame keeps the rest of the height.
  const APP_CSS = `
    ${TAG} { display: block; padding-top: var(--safe-area-inset-top, 0px); background: var(--dh-top-bg, transparent); }
    .header { display: none !important; }
    iframe { padding-top: 0 !important; height: calc(100% - var(--dh-h, 0px) - var(--safe-area-inset-top, 0px)) !important; }
  `;

  const deactivate = (root) => {
    if (!root) return;
    root.shadowRoot?.getElementById(STYLE_ID)?.remove();
    root.shadowRoot?.querySelector(TAG)?.remove();
    for (const v of ["--header-height", "--dh-h", "--dh-bar-h", "--dh-text", "--dh-btn-bg", "--dh-btn-border", "--dh-top-bg"]) root.style.removeProperty(v);
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

  // The `panels:` blocks of every dashboard (lovelace/config of each one in the sidebar list), read once per connection
  // when an app panel is first shown, and again after a dashboard's configuration changed.
  const panelStore = { conn: null, map: null, loading: null };
  const panelConfigs = (hass) => {
    const conn = hass?.connection;
    if (!conn?.sendMessagePromise) return null;
    if (panelStore.conn === conn && (panelStore.map || panelStore.loading)) return panelStore.map;
    panelStore.conn = conn;
    panelStore.map = null;
    const paths = Object.values(hass.panels || {})
      .filter((p) => p?.component_name === "lovelace")
      .map((p) => (p.url_path === "lovelace" ? null : p.url_path));
    const loading = Promise.all(paths.map((url_path) => conn.sendMessagePromise({ type: "lovelace/config", url_path }).catch(() => null))).then(
      (configs) => {
        if (panelStore.loading !== loading) return;
        panelStore.loading = null;
        panelStore.map = collectPanels(configs);
        queue();
      },
    );
    panelStore.loading = loading;
    return null;
  };
  const resetPanels = () => {
    panelStore.map = null;
    panelStore.loading = null;
  };

  const ensureStyle = (shadow, css, prepend) => {
    if (shadow.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    if (prepend) shadow.prepend(style);
    else shadow.appendChild(style);
  };

  // Banner and style go first in the panel's shadow root, before the part Lit renders into: a re-render (the app
  // loaded, the small header shown or hidden) never removes them.
  const syncApp = (app) => {
    const cfg = app._kioskMode ? null : resolvePanelConfig(panelConfigs(app.hass), panelKey(app));
    if (!cfg || !app.shadowRoot.querySelector("iframe")) return deactivate(app);
    ensureStyle(app.shadowRoot, APP_CSS, true);
    let banner = app.shadowRoot.querySelector(TAG);
    if (!banner) {
      banner = document.createElement(TAG);
      app.shadowRoot.prepend(banner);
    }
    state.banner = banner;
    banner.collapsed = false;
    banner.setup(app, cfg);
    watchStates(banner);
  };

  const sync = () => {
    state.queued = false;
    const lovelace = findRoot();
    const root = lovelace || findApp();
    if (state.root && state.root !== root) deactivate(state.root);
    if (root !== state.root) {
      state.observer?.disconnect();
      state.observer = null;
      state.root = root;
    }
    if (!root?.shadowRoot) return;
    if (!lovelace) {
      if (!root.hass) return;
      if (!state.observer) {
        state.observer = new MutationObserver(queue);
        state.observer.observe(root.shadowRoot, { childList: true, subtree: true });
      }
      return syncApp(root);
    }
    if (!root.lovelace?.config) return;
    // A dashboard edited (or another one opened) may change the `panels:` lists: read again on the next panel.
    if (root.lovelace.config !== state.lovelaceConfig) {
      state.lovelaceConfig = root.lovelace.config;
      if (root.lovelace.config.dashboard_header) resetPanels();
    }
    if (!state.observer) {
      state.observer = new MutationObserver(queue);
      state.observer.observe(root.shadowRoot, { childList: true, subtree: true });
    }
    const views = root.lovelace.config.views || [];
    const viewCfg = views[currentViewIndex(root, views)];
    // A generated panel (the Energy panel) has no YAML: its block comes from the `panels:` lists, by its URL path.
    const generated = !root.lovelace.config.dashboard_header && root.lovelace.mode === "generated" && root.lovelace.urlPath;
    let cfg = root.lovelace.editMode
      ? null
      : generated
        ? resolvePanelConfig(panelConfigs(root.hass), root.lovelace.urlPath, viewCfg?.path ?? String(views.indexOf(viewCfg)), true)
        : viewCfg?.subview
          ? resolveSubviewConfig(root.lovelace.config, viewCfg)
          : resolveConfig(root.lovelace.config, viewCfg);
    if (cfg?.mode === "auto") {
      const mode = effectiveMode(cfg, window.innerWidth, Boolean(root.narrow));
      cfg = { ...cfg, mode, collapse: mode === "illustrated" && cfg.collapse };
    }
    const header = root.shadowRoot.querySelector(".header");
    if (!cfg || !header) return deactivate(root);
    ensureStyle(root.shadowRoot, ROOT_CSS, false);
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

  window.dashboardHeader = { VERSION, SCENES, vehicleList, PALETTE, STRINGS, resolveConfig, resolveSubviewConfig, effectiveMode, resolvePanelConfig, energyLayout, amount, numOf, collectPanels, panelConfigs, visibleViews, truthy, colorOf, tempoColor, binColor, sceneName, isTemplate, sync, watchStates, relayout, state };
  console.info(`%c DASHBOARD-HEADER %c ${VERSION} `, "color:#fff;background:#2459bd;font-weight:700", "color:#2459bd;background:#fff");
})();
