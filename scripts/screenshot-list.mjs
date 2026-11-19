// The README screenshots (PNG) and animations (GIF) rendered by scripts/screenshots.mjs.
// Every capture has a twin in the other theme ("-dark" for a light capture, "-light" for a dark one) that shows
// exactly the same state: only the theme differs (checked by test/screenshots.test.mjs).
// Mock data only: neutral titles, no real names.

const VIEWS = {
  maison: ["Home", "Information", "Living room", "Bedroom", "Kids", "Bathroom", "Entrance", "Terrace"],
  equipements: ["Vacuum", "Thermostats", "NAS", "Internet"],
  voitures: ["Fuel", "SUV", "Compact"],
  energie: ["Today", "Tempo", "Meter", "Water", "History"],
  systeme: ["System", "Network", "Containers", "Proxmox", "Backups"],
  securite: ["Alarm", "Cameras", "Detectors", "Access"],
  famille: ["Today", "Calendar", "School", "Parcels", "Transport"],
  exterieur: ["Terrace", "Garden", "Weather"],
};

// One dashboard per scene: its title, views, and the header block of its YAML.
export const DASHBOARDS = {
  maison: { title: "Home", header: { scene: "maison", subtitle: "Thursday 19 November · 8 °C · 3 at home", status: { text: "All good", color: "green" }, scene_state: { lights: "on" } } },
  equipements: { title: "Devices", header: { scene: "equipements", subtitle: "Vacuum docked · dishwasher ends in 42 min", status: { text: "1 running", color: "amber" }, scene_state: { vacuum: "docked", appliance: "on" } } },
  voitures: {
    title: "Cars",
    header: {
      scene: "voitures",
      subtitle: "SUV 640 km · compact 410 km · diesel 1.62 €",
      status: { text: "Locked", color: "green" },
      // The car pictures of ha-vehicle-card's screenshots, served by scripts/screenshots.mjs.
      scene_state: { vehicles: ["https://pictures.test/espace.webp", "https://pictures.test/captur.webp"] },
    },
  },
  energie: { title: "Energy", header: { scene: "energie", subtitle: "Blue day · 1.24 kW · 8.4 kWh today", status: { text: "Blue day", color: "blue" }, scene_state: { tempo: "Bleu", power: "off" } } },
  systeme: { title: "System", header: { scene: "systeme", subtitle: "3 VMs · 14 containers · ↓ 1.8 Gbit/s", status: { text: "All up", color: "green" }, scene_state: { alert: "ok" } } },
  securite: { title: "Security", header: { scene: "securite", subtitle: "Disarmed · front door locked · 3 cameras private", status: { text: "Protected", color: "green" }, scene_state: { alarm: "disarmed", lock: "locked", camera_privacy: "on" } } },
  famille: { title: "Family", header: { scene: "famille", subtitle: "School tomorrow · yellow bin tomorrow morning", status: { text: "School tomorrow", color: "green" }, scene_state: { school: "on", bin: "yellow" } } },
  exterieur: { title: "Outdoor", header: { scene: "exterieur", subtitle: "8 °C · rain around 2 pm", status: { text: "Rain at 2 pm", color: "cyan" }, scene_state: { rain: "off", lamp: "off" } } },
};
export const viewsOf = (scene) => VIEWS[scene].map((title, i) => ({ title, path: `v${i}` }));

const shot = (file, theme, scene, extra = {}) => ({ file, theme, scene, width: 1280, narrow: false, scroll: 0, header: {}, ...extra });
const twins = (file, scene, extra) => [shot(file, "light", scene, extra), shot(`${file}-dark`, "dark", scene, extra)];

export const shots = [
  // The illustrated header of each scene, desktop.
  ...Object.keys(DASHBOARDS).flatMap((scene) => twins(`scene-${scene}`, scene)),
  // Compact mode, desktop and phone; folded on scroll; the illustrated header on a phone.
  ...twins("compact", "maison", { header: { mode: "compact" } }),
  ...twins("compact-phone", "maison", { width: 390, narrow: true, header: { mode: "compact" } }),
  ...twins("collapsed", "maison", { scroll: 200 }),
  ...twins("phone", "maison", { width: 390, narrow: true }),
];

// One looping GIF per distinct animation:
//   vacuum-cleaning   — the robot leaves its dock and sweeps, a programme runs on the dishwasher
//   alarm-triggered   — the alarm shield and an open lock flash
//   system-warning    — one LED of the server rack blinks
//   energy-power      — the meter's bolt pulses on a red Tempo day
//   rain              — rain falls from the cloud, the terrace lamp is lit
export const gifs = [
  ...twins("vacuum-cleaning", "equipements", { header: { scene_state: { vacuum: "cleaning", appliance: "on" } } }),
  ...twins("alarm-triggered", "securite", { header: { status: { text: "Alarm!", color: "red" }, scene_state: { alarm: "triggered", lock: "open" } } }),
  ...twins("system-warning", "systeme", { header: { status: { text: "2 updates", color: "amber" }, scene_state: { alert: "warning" } } }),
  ...twins("energy-power", "energie", { header: { status: { text: "Red day", color: "red" }, scene_state: { tempo: "Rouge", power: "on" } } }),
  ...twins("rain", "exterieur", { header: { scene_state: { rain: "on", lamp: "on" } } }),
];
