// Renders the dashboard header on a stand-in of Home Assistant's dashboard root and saves the README screenshots
// and animations. Usage: npm run build && npm run screenshots  (the GIFs need ffmpeg on PATH)
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as mdi from "@mdi/js";
import { chromium } from "playwright";
import { unchanged } from "./pixels.mjs";
import { DASHBOARDS, gifs, shots, viewsOf } from "./screenshot-list.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
mkdirSync(`${root}screenshots`, { recursive: true });

// Every capture is rendered to a temporary file and copied over screenshots/<file> only when its decoded pixels
// differ (scripts/pixels.mjs): a run that draws the same pictures changes no file, so the workflow commits nothing.
const work = mkdtempSync(join(tmpdir(), "dh-shots-"));
const keep = (fresh, name) => {
  const target = `${root}screenshots/${name}`;
  if (unchanged(fresh, target)) return console.log(`screenshots/${name} (unchanged)`);
  copyFileSync(fresh, target);
  console.log(`screenshots/${name}`);
};
const bundle = readFileSync(`${root}dist/dashboard-header.js`, "utf8");
const pageErrors = [];

// The ha-neutral theme's colors.
const THEMES = {
  light: {
    "--primary-background-color": "#e9ecef",
    "--card-background-color": "#ffffff",
    "--secondary-background-color": "#f4f5f7",
    "--primary-text-color": "#1c1e21",
    "--secondary-text-color": "#6b7078",
    "--divider-color": "#e1e4e8",
    "--app-header-background-color": "#f7f8f9",
    "--app-header-text-color": "#1c1e21",
  },
  dark: {
    "--primary-background-color": "#111315",
    "--card-background-color": "#1c1f23",
    "--secondary-background-color": "#25292e",
    "--primary-text-color": "#e8eaed",
    "--secondary-text-color": "#9aa0a6",
    "--divider-color": "#2c3035",
    "--app-header-background-color": "#1a1d20",
    "--app-header-text-color": "#e8eaed",
  },
};

// The MDI icons the page uses, from @mdi/js (mdi:foo-bar → mdiFooBar).
const ICONS = Object.fromEntries(
  [
    "home-assistant",
    "devices",
    "car",
    "lightning-bolt",
    "server",
    "shield-home",
    "calendar-heart",
    "tree",
    "shower",
    "toilet",
    "bed-king",
    "teddy-bear",
    "toy-brick",
    "gamepad-variant",
    "garage",
    "coat-rack",
    "desk",
    "washing-machine",
    "door-closed",
    "flower",
    "door-open",
    "menu",
    "magnify",
    "comment-processing-outline",
    "dots-vertical",
  ].map((n) => [`mdi:${n}`, mdi[`mdi${n.replace(/(^|-)([a-z])/g, (_, __, ch) => ch.toUpperCase())}`]]),
);

// Stand-ins for Home Assistant's elements: ha-icon, ha-icon-button, ha-menu-button, and hui-root with the same
// header structure and styles as the real one (src/panels/lovelace/hui-root.ts), its toolbar holding the sidebar
// button, the view tabs (hidden by the header) and the action buttons.
const STAND_INS = `
const ICONS = ${JSON.stringify(ICONS)};
const svg = (d, size) => '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" style="display:block;fill:currentColor"><path d="' + (d || "") + '"/></svg>';
customElements.define("ha-icon", class extends HTMLElement {
  connectedCallback() {
    const size = parseInt(getComputedStyle(this).getPropertyValue("--mdc-icon-size")) || 24;
    this.style.display = "inline-flex";
    this.innerHTML = svg(ICONS[this.getAttribute("icon")], size);
  }
});
class IconButton extends HTMLElement {
  connectedCallback() {
    this.innerHTML = svg(ICONS[this.getAttribute("icon")], 22);
  }
}
customElements.define("ha-icon-button", class extends IconButton {});
customElements.define("ha-menu-button", class extends IconButton {});
customElements.define("hui-root", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = \`<style>
      .header { background-color: var(--app-header-background-color); color: var(--app-header-text-color); position: fixed; top: 0;
        width: 100%; z-index: 4; }
      .toolbar { border-bottom: 1px solid var(--divider-color); height: var(--header-height); display: flex; align-items: center;
        font-size: 20px; padding: 0 12px; box-sizing: border-box; }
      .narrow .toolbar { padding: 0 4px; }
      ha-icon-button, ha-menu-button { display: inline-flex; align-items: center; justify-content: center; color: inherit; }
      .wrap:not(.narrow) ha-menu-button { display: none; } /* docked sidebar: no sidebar button */
      .action-items { white-space: nowrap; display: flex; align-items: center; }
      ha-tab-group { flex-grow: 1; }
      #view { display: block; padding: calc(var(--header-height) + 16px) 16px 16px; }
      .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
      .card { height: 140px; border-radius: 14px; background: var(--card-background-color); border: 1px solid var(--divider-color); }
    </style>
    <div class="wrap"><div class="header"><slot name="toolbar"><div class="toolbar">
      <ha-menu-button icon="mdi:menu"></ha-menu-button>
      <ha-tab-group>native tabs</ha-tab-group>
      <div class="action-items">
        <ha-icon-button icon="mdi:magnify"></ha-icon-button>
        <ha-icon-button icon="mdi:comment-processing-outline"></ha-icon-button>
        <ha-icon-button icon="mdi:dots-vertical"></ha-icon-button>
      </div>
    </div></slot></div>
    <div id="view"><div class="cards"><div class="card"></div><div class="card"></div><div class="card"></div><div class="card"></div><div class="card"></div><div class="card"></div></div></div></div>\`;
  }
  // Like Home Assistant's, the sidebar button only shows on phones (its _show), the notification dot with it.
  set narrow(v) {
    this._narrow = v;
    this.shadowRoot.querySelector(".wrap").classList.toggle("narrow", v);
    const menu = this.shadowRoot.querySelector("ha-menu-button");
    menu._show = v;
    menu._hasNotifications = v;
  }
  get narrow() { return this._narrow; }
  _navigateToView(path) { this._curView = this.lovelace.config.views.findIndex((v) => v.path === path); }
});`;

const pageHtml = (theme, width) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>
  :root { ${Object.entries(THEMES[theme])
    .map(([k, v]) => `${k}:${v};`)
    .join("")} --header-height: 56px; }
  body { margin: 0; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${width}px; min-height: 2400px; }
</style></head><body></body></html>`;

async function openPage(browser, s) {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: s.width, height: 600 }, locale: "en-US" });
  page.on("pageerror", (err) => {
    console.error(`pageerror (${s.file}): ${err.message}`);
    pageErrors.push(`${s.file}: ${err.message}`);
  });
  // The car pictures of the cars scene (scripts/pictures, from ha-vehicle-card).
  await page.route("https://pictures.test/**", (route) =>
    route.fulfill({ contentType: "image/webp", body: readFileSync(`${root}scripts/pictures/${new URL(route.request().url()).pathname.slice(1)}`) }),
  );
  await page.setContent(pageHtml(s.theme, s.width));
  await page.addScriptTag({ content: STAND_INS });
  const dash = DASHBOARDS[s.scene];
  const header = { ...dash.header, ...s.header, scene_state: { ...dash.header.scene_state, ...s.header.scene_state } };
  await page.evaluate(
    ({ title, views, header, theme, narrow }) => {
      const el = document.createElement("hui-root");
      el.hass = { themes: { darkMode: theme === "dark" }, states: {}, language: "en", locale: { language: "en" }, user: { id: "u1" }, panels: {} };
      el.lovelace = { editMode: false, config: { title, views, dashboard_header: header } };
      el.route = { prefix: "/dashboard" };
      el._curView = 0;
      document.body.appendChild(el);
      el.narrow = narrow;
    },
    { title: dash.title, views: viewsOf(s.scene), header, theme: s.theme, narrow: s.narrow },
  );
  await page.addScriptTag({ content: bundle });
  if (s.scroll) await page.evaluate((y) => window.scrollTo(0, y), s.scroll);
  await page.waitForTimeout(250);
  return page;
}

// The header's animations (its shadow root: document.getAnimations() leaves out the shadow trees).
const animations = () =>
  document.querySelector("hui-root").shadowRoot.querySelector("dashboard-header-banner").shadowRoot.getAnimations();
// The capture: the header and the top of the view under it.
const clipOf = async (page, s) => {
  const h = await page.evaluate(() => {
    const banner = document.querySelector("hui-root").shadowRoot.querySelector("dashboard-header-banner");
    return banner.getBoundingClientRect().height;
  });
  return { x: 0, y: 0, width: s.width, height: Math.ceil(h) + 24 };
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const s of shots) {
  const page = await openPage(browser, s);
  await page.evaluate(`(${animations})().forEach((a) => { a.pause(); a.currentTime = 0; })`);
  await page.screenshot({ path: join(work, `${s.file}.png`), clip: await clipOf(page, s) });
  keep(join(work, `${s.file}.png`), `${s.file}.png`);
  await page.close();
}

// Records one animated state as a looping GIF: every animation is paused and stepped frame by frame, so the GIF is
// identical whatever the machine's speed. Only the band is recorded, at the page width.
async function makeGif(s, { fps = 15, seconds = 2.4 } = {}) {
  const page = await openPage(browser, s);
  const clip = { x: 0, y: 0, width: s.width, height: 90 };
  const dir = mkdtempSync(join(tmpdir(), "dh-frames-"));
  const frames = Math.round(fps * seconds);
  for (let i = 0; i < frames; i++) {
    const n = await page.evaluate(
      `(() => { const all = (${animations})(); for (const a of all) { a.pause(); a.currentTime = ${(i * 1000) / fps}; } return all.length; })()`,
    );
    if (!n) throw new Error(`${s.file}: no animation found to step`);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`), clip });
  }
  await page.close();
  const out = join(work, `${s.file}.gif`);
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-framerate",
    String(fps),
    "-i",
    join(dir, "f%03d.png"),
    "-vf",
    `scale=${clip.width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop",
    "0",
    out,
  ]);
  rmSync(dir, { recursive: true });
  keep(out, `${s.file}.gif`);
}

for (const g of gifs) await makeGif(g);
await browser.close();
rmSync(work, { recursive: true });

if (pageErrors.length) {
  console.error(`\n${pageErrors.length} page error(s) while rendering:`);
  for (const e of pageErrors) console.error(`  ${e}`);
  process.exitCode = 1;
}
