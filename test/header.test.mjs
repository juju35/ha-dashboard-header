import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const dh = load();
const LANGS = ["en", "fr", "de", "es", "it", "nl", "pt", "pl", "sr", "sr-Latn", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];

test("no dashboard_header block: the native header stays", () => {
  assert.equal(dh.resolveConfig({ views: [] }, {}), null);
  assert.equal(dh.resolveConfig(undefined, undefined), null);
});

test("defaults: illustrated maison scene, folding on scroll, scene icon and accent", () => {
  const c = dh.resolveConfig({ dashboard_header: {} }, {});
  assert.equal(c.scene, "maison");
  assert.equal(c.mode, "illustrated");
  assert.equal(c.collapse, true);
  assert.equal(c.icon, "mdi:home-assistant");
  assert.equal(c.accent, "blue");
  assert.equal(c.status, null);
});

test("compact mode never folds; collapse_on_scroll: false keeps the band", () => {
  assert.equal(dh.resolveConfig({ dashboard_header: { mode: "compact" } }).collapse, false);
  assert.equal(dh.resolveConfig({ dashboard_header: { collapse_on_scroll: false } }).collapse, false);
});

test("a view overlays the dashboard block, scene_state and status merged, enabled: false turns it off", () => {
  const lovelace = { dashboard_header: { scene: "maison", subtitle: "a", status: { text: "OK", color: "green" }, scene_state: { lights: "light.all" } } };
  const c = dh.resolveConfig(lovelace, { dashboard_header: { scene: "energy", status: { color: "red" }, scene_state: { tempo: "sensor.tempo" } } });
  assert.equal(c.scene, "energie");
  assert.equal(c.subtitle, "a");
  assert.deepEqual({ ...c.status }, { text: "OK", color: "red" });
  assert.deepEqual({ ...c.sceneState }, { lights: "light.all", tempo: "sensor.tempo" });
  assert.equal(dh.resolveConfig(lovelace, { dashboard_header: { enabled: false } }), null);
});

test("scene names: French, English aliases and accents; unknown falls back to maison", () => {
  for (const [given, want] of [
    ["voitures", "voitures"],
    ["cars", "voitures"],
    ["Sécurité", "securite"],
    ["system", "systeme"],
    ["outdoor", "exterieur"],
    ["devices", "equipements"],
    ["nope", "maison"],
  ])
    assert.equal(dh.sceneName(given), want, given);
});

test("tabs: no subviews, no views hidden from the current user", () => {
  const views = [{ title: "A" }, { title: "B", subview: true }, { title: "C", visible: false }, { title: "D", visible: [{ user: "u1" }] }, { title: "E", visible: [{ user: "u2" }] }];
  assert.deepEqual(
    dh.visibleViews(views, { user: { id: "u1" } }).map((v) => v.view.title),
    ["A", "D"],
  );
});

test("truthy states", () => {
  for (const v of [true, 1, "on", "ON", "open", "home", "cleaning", "armed_away", "2"]) assert.equal(dh.truthy(v), true, String(v));
  for (const v of [false, 0, null, undefined, "", "off", "closed", "docked", "disarmed", "unavailable", "0"]) assert.equal(dh.truthy(v), false, String(v));
});

test("colors: palette names and aliases per theme, CSS colors as given", () => {
  assert.equal(dh.colorOf("green", "light"), dh.PALETTE.light.green);
  assert.equal(dh.colorOf("purple", "dark"), dh.PALETTE.dark.violet);
  assert.equal(dh.colorOf("#123456", "light"), "#123456");
  assert.equal(dh.colorOf("", "light", "x"), "x");
});

test("Tempo and bin colors understand French and English", () => {
  const sky = { white: "#eee" };
  assert.equal(dh.tempoColor("Bleu", "light", sky), dh.PALETTE.light.blue);
  assert.equal(dh.tempoColor("WHITE", "light", sky), "#eee");
  assert.equal(dh.tempoColor("rouge", "dark", sky), dh.PALETTE.dark.red);
  assert.equal(dh.binColor("jaune"), dh.binColor("yellow"));
  assert.equal(dh.binColor("off"), null);
  assert.equal(dh.binColor(""), null);
  assert.equal(dh.binColor("#abcdef"), "#abcdef");
});

test("cars scene: picture entities, URLs and objects, or a number of plain cars (three at most)", () => {
  const hass = { states: { "image.suv": { attributes: { entity_picture: "/api/image_proxy/image.suv?token=x" } }, "image.none": { attributes: {} } } };
  assert.deepEqual(
    dh.vehicleList(["image.suv", "/local/car.png", { picture: "image.suv" }, "image.x"], hass).map((v) => v.img),
    ["/api/image_proxy/image.suv?token=x", "/local/car.png", "/api/image_proxy/image.suv?token=x"],
  );
  assert.deepEqual(dh.vehicleList(["image.none", "not a url"], hass).map((v) => v.img), [null, null]);
  assert.equal(dh.vehicleList(undefined).length, 2);
  assert.equal(dh.vehicleList(1).length, 1);
  assert.equal(dh.vehicleList("9").length, 3);
  const svg = dh.SCENES.voitures.draw(sky("light"), { vehicles: ["image.suv", "x"] }, dh.PALETTE.light, "light", hass);
  assert.match(svg, /<image href="\/api\/image_proxy\/image\.suv\?token=x"/);
  assert.equal((svg.match(/<image /g) || []).length, 1);
});

test("cars scene layouts: driveway leaves an away car's spot empty, station puts the low car at the pump", () => {
  const hass = { states: { "device_tracker.b": { state: "not_home" } }, locale: { language: "en" } };
  const vehicles = [{ picture: "/a.png", home: "home" }, { picture: "/b.png", home: "device_tracker.b", low: true }];
  assert.deepEqual(dh.vehicleList(vehicles, hass).map((v) => [v.away, v.low]), [[false, false], [true, true]]);
  // home and low can be templates, rendered by Home Assistant
  const tpl = [{ picture: "/a.png", home: "{{ is_state('x', 'home') }}", low: "{{ 1 < 2 }}" }];
  assert.deepEqual(dh.vehicleList(tpl, hass, () => "True").map((v) => [v.away, v.low]), [[false, true]]);
  const drive = dh.SCENES.voitures.draw(sky("light"), { vehicles, layout: "driveway" }, dh.PALETTE.light, "light", hass);
  assert.equal((drive.match(/<image /g) || []).length, 1);
  assert.match(drive, /stroke-dasharray="5 4"/);
  const station = dh.SCENES.voitures.draw(sky("light"), { vehicles, layout: "station", prices: { Diesel: "1.629" } }, dh.PALETTE.light, "light", hass, (x) => x);
  assert.match(station, />Diesel</);
  assert.match(station, />1\.629</);
  assert.ok(station.indexOf("/b.png") < station.indexOf("/a.png"), "the low car comes first, at the pump");
});

test("templates are recognised", () => {
  assert.equal(dh.isTemplate("{{ states('sensor.x') }}"), true);
  assert.equal(dh.isTemplate("{% if x %}a{% endif %}"), true);
  assert.equal(dh.isTemplate("sensor.x"), false);
});

test("every scene draws a complete SVG in both themes, whatever its state", () => {
  const states = [{}, { lights: "on", vacuum: "cleaning", appliance: "on", printer: "on", vehicles: 1, tempo: "rouge", power: "on", alert: "error", alarm: "triggered", lock: "open", camera_privacy: "on", school: "off", bin: "vert", rain: "on", lamp: "on" }];
  for (const [name, scene] of Object.entries(dh.SCENES)) {
    assert.match(scene.icon, /^mdi:/);
    for (const mode of ["light", "dark"]) {
      for (const st of states) {
        const svg = scene.draw(sky(mode), st, dh.PALETTE[mode], mode);
        assert.doesNotMatch(svg, /undefined|NaN|null/, `${name} ${mode}`);
        assert.ok((svg.includes('y="86"') && svg.includes('height="4"')) || (svg.includes('y="80"') && svg.includes('height="10"')), `${name}: ground bar or road`);
        const open = (svg.match(/<g[ >]/g) || []).length;
        assert.equal(open, (svg.match(/<\/g>/g) || []).length, `${name}: balanced groups`);
      }
    }
  }
});

test("every language has every string", () => {
  assert.deepEqual(Object.keys(dh.STRINGS).sort(), [...LANGS].sort());
  for (const l of LANGS) assert.deepEqual(Object.keys(dh.STRINGS[l]), Object.keys(dh.STRINGS.en), l);
});

// The scene colors, read back from the source (they are not exported on purpose: one palette per theme).
function sky(mode) {
  const c = {};
  for (const k of ["sky", "text", "sub", "glass", "stars", "sun", "cloud", "hill", "tree", "house", "roof", "winOn", "winOff", "door", "grass", "wall", "wall2", "floor", "floor2", "floorBar", "wood", "deck", "appl", "line", "paper", "asphalt", "road", "glassWin", "tyre", "rack", "unit", "lamp", "lampOn", "clay", "white"])
    c[k] = `${mode}-${k}`;
  c.stars = mode === "dark" ? 1 : 0;
  return c;
}

test("a CSS color stays one value: no other declaration can ride along", () => {
  assert.equal(dh.colorOf("rgb(10, 20, 30)", "light", "x"), "rgb(10, 20, 30)");
  assert.equal(dh.colorOf("var(--state-icon-color)", "light", "x"), "var(--state-icon-color)");
  assert.equal(dh.colorOf("color-mix(in srgb, red 40%, blue)", "light", "x"), "color-mix(in srgb, red 40%, blue)");
  assert.equal(dh.colorOf("red;background:url(//example.com/x.png)", "light", "x"), "x");
  assert.equal(dh.colorOf("url(//example.com/x.png)", "light", "x"), "x");
  assert.equal(dh.binColor('red" onload="x'), dh.binColor("gris"));
});

test("states: only the entities the banner reads are subscribed, again when they change, none without any", () => {
  const sent = [];
  const conn = { subscribeMessage: (cb, msg) => (sent.push(msg), Promise.resolve(() => sent.push("unsub"))) };
  let ids = ["sensor.b", "sensor.a", "sensor.a"];
  const banner = { hass: { connection: conn }, entities: () => ids, isConnected: true };
  dh.watchStates(banner);
  dh.watchStates(banner);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].type, "subscribe_entities");
  assert.deepEqual([...sent[0].entity_ids], ["sensor.a", "sensor.b"]);
  ids = [];
  dh.watchStates(banner);
  assert.equal(sent.length, 1);
});

test("states: the first message (the current states) does not redraw the banner, the next ones do", () => {
  let cb;
  const conn = { subscribeMessage: (f) => ((cb = f), Promise.resolve(() => {})) };
  let renders = 0;
  const banner = { hass: { connection: conn }, entities: () => ["sensor.first_message"], isConnected: true, render: () => renders++ };
  dh.state.banner = banner;
  dh.watchStates(banner);
  cb({ a: {} });
  assert.equal(renders, 0);
  cb({ c: {} });
  assert.equal(renders, 1);
});

test("relayout: the root's style sheet put back and a resize sent, only for the current root", () => {
  const appended = [];
  const style = { id: "x" };
  const root = { isConnected: true, offsetWidth: 0, shadowRoot: { getElementById: () => style, appendChild: (e) => appended.push(e) } };
  const prev = dh.state.root;
  dh.state.root = root;
  dh.relayout(root);
  dh.relayout({ ...root });
  dh.state.root = prev;
  assert.deepEqual(appended, [style]);
  assert.deepEqual([...dh.dispatched], ["resize"]);
});
