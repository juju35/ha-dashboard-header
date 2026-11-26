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
  salle_de_bain: ["Bathroom", "Heating", "Humidity"],
  toilettes: ["Toilet", "Ventilation"],
  chambre_parents: ["Bedroom", "Shutters", "Climate"],
  chambre_bebe: ["Nursery", "Monitor", "Climate"],
  chambre_enfant: ["Kids", "Lights", "Shutters"],
  chambre_ado: ["Teen", "PC", "Lights"],
  garage: ["Garage", "Car", "Tools"],
  couloir: ["Hallway", "Entrance", "Lights"],
  bureau: ["Office", "PC", "Climate"],
  buanderie: ["Laundry", "Washer", "Dryer"],
  entree: ["Entrance", "Doorbell", "Mail"],
  jardin: ["Garden", "Watering", "Mower"],
  entree_interieure: ["Entrance", "Alarm", "Lock"],
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
  salle_de_bain: { title: "Bathroom", header: { scene: "salle_de_bain", subtitle: "22 °C · 58 % humidity", status: { text: "Dry", color: "green" }, scene_state: { light: "on", humidity: "58", fan: "off" } } },
  toilettes: { title: "Toilet", header: { scene: "toilettes", subtitle: "Free · fan off", status: { text: "Free", color: "green" }, scene_state: { light: "off", occupied: "off", fan: "off" } } },
  chambre_parents: { title: "Bedroom", header: { scene: "chambre_parents", subtitle: "19 °C · shutter 40 %", status: { text: "Comfort", color: "green" }, scene_state: { lights: "on", shutter: "40", sleep: "off" } } },
  chambre_bebe: { title: "Nursery", header: { scene: "chambre_bebe", subtitle: "20 °C · asleep for 1 h 12", status: { text: "Asleep", color: "violet" }, scene_state: { night_light: "on", sleep: "on", music: "off" } } },
  chambre_enfant: { title: "Kids", header: { scene: "chambre_enfant", subtitle: "20 °C · lights on", status: { text: "Awake", color: "amber" }, scene_state: { lights: "on", sleep: "off", shutter: "100" } } },
  chambre_ado: { title: "Teen", header: { scene: "chambre_ado", subtitle: "PC on · LED strip violet", status: { text: "Gaming", color: "violet" }, scene_state: { lights: "off", pc: "on", led: "violet" } } },
  garage: { title: "Garage", header: { scene: "garage", subtitle: "Door closed · car inside", status: { text: "Closed", color: "green" }, scene_state: { door: "closed", car: "on", light: "off" } } },
  couloir: { title: "Hallway", header: { scene: "couloir", subtitle: "Bedroom door closed · no motion", status: { text: "Calm", color: "green" }, scene_state: { lights: "on", motion: "off", door: "off" } } },
  bureau: { title: "Office", header: { scene: "bureau", subtitle: "21 °C · PC on", status: { text: "Working", color: "blue" }, scene_state: { pc: "on", lamp: "on", busy: "off" } } },
  buanderie: { title: "Laundry", header: { scene: "buanderie", subtitle: "Washer idle · dryer idle", status: { text: "Idle", color: "gray" }, scene_state: { washer: "off", dryer: "off" } } },
  entree: { title: "Entrance", header: { scene: "entree", subtitle: "Door locked · 1 letter", status: { text: "Mail", color: "blue" }, scene_state: { light: "off", door: "off", doorbell: "off", mailbox: "on", parcel: "off" } } },
  entree_interieure: { title: "Entryway", header: { scene: "entree_interieure", subtitle: "Front door locked · alarm armed away", status: { text: "Armed", color: "green" }, scene_state: { lights: "on", lock: "locked", alarm: "armed_away", door: "off" } } },
  jardin: { title: "Garden", header: { scene: "jardin", subtitle: "Soil 34 % · mower docked", status: { text: "All good", color: "green" }, scene_state: { watering: "off", mower: "docked", lights: "off" } } },
};
export const viewsOf = (scene) => VIEWS[scene].map((title, i) => ({ title, path: `v${i}` }));

const shot = (file, theme, scene, extra = {}) => ({ file, theme, scene, width: 1280, narrow: false, scroll: 0, header: {}, ...extra });
const twins = (file, scene, extra) => [shot(file, "light", scene, extra), shot(`${file}-dark`, "dark", scene, extra)];

export const shots = [
  // The illustrated header of each scene, desktop (scene-<name>): scene-maison, scene-equipements, scene-voitures,
  // scene-energie, scene-systeme, scene-securite, scene-famille, scene-exterieur, scene-salle_de_bain, scene-toilettes,
  // scene-chambre_parents, scene-chambre_bebe, scene-chambre_enfant, scene-chambre_ado, scene-garage, scene-couloir,
  // scene-bureau, scene-buanderie, scene-entree, scene-entree_interieure, scene-jardin.
  ...Object.keys(DASHBOARDS).flatMap((scene) => twins(`scene-${scene}`, scene)),
  // Compact mode, desktop and phone; folded on scroll; the illustrated header on a phone.
  // The cars scene's other layouts: the driveway (the compact is away, its spot left empty) and the station.
  ...twins("cars-driveway", "voitures", {
    header: {
      status: { text: "1 away", color: "blue" },
      scene_state: {
        layout: "driveway",
        vehicles: [{ picture: "https://pictures.test/espace.webp", home: "home" }, { picture: "https://pictures.test/captur.webp", home: "not_home" }],
      },
    },
  }),
  ...twins("cars-station", "voitures", {
    header: {
      status: { text: "Refuel", color: "red" },
      scene_state: {
        layout: "station",
        prices: { Diesel: "1.629", "SP95-E10": "1.739" },
        vehicles: ["https://pictures.test/espace.webp", { picture: "https://pictures.test/captur.webp", low: true }],
      },
    },
  }),
  // The Energy panel's layouts (scene_state.layout), one per tab.
  ...twins("energy-overview", "energie", {
    header: { status: { text: "All normal", color: "green" }, scene_state: { layout: "overview", electricity: "8.43", gas: "1.22", water: "214" } },
  }),
  ...twins("energy-electricity", "energie", {
    header: { status: { text: "Blue day", color: "blue" }, scene_state: { layout: "electricity", tempo: "Blue", period: "HC", solar: "0.8", battery: "82" } },
  }),
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
//   energy-now        — power runs from the grid and the solar panels to the house (Energy panel, `now` layout)
export const gifs = [
  ...twins("vacuum-cleaning", "equipements", { header: { scene_state: { vacuum: "cleaning", appliance: "on" } } }),
  ...twins("alarm-triggered", "securite", { header: { status: { text: "Alarm!", color: "red" }, scene_state: { alarm: "triggered", lock: "open" } } }),
  ...twins("system-warning", "systeme", { header: { status: { text: "2 updates", color: "amber" }, scene_state: { alert: "warning" } } }),
  ...twins("energy-power", "energie", { header: { status: { text: "Red day", color: "red" }, scene_state: { tempo: "Rouge", power: "on" } } }),
  ...twins("rain", "exterieur", { header: { scene_state: { rain: "on", lamp: "on" } } }),
  ...twins("bathroom-steam", "salle_de_bain", { header: { status: { text: "Humid", color: "cyan" }, scene_state: { light: "on", humidity: "82", fan: "on" } } }),
  ...twins("toilet-occupied", "toilettes", { header: { status: { text: "Occupied", color: "red" }, scene_state: { light: "on", occupied: "on", fan: "on" } } }),
  ...twins("bedroom-sleep", "chambre_parents", { header: { status: { text: "Night", color: "violet" }, scene_state: { lights: "off", shutter: "0", sleep: "on" } } }),
  ...twins("nursery-music", "chambre_bebe", { header: { status: { text: "Lullaby", color: "violet" }, scene_state: { night_light: "on", sleep: "on", music: "on" } } }),
  ...twins("kids-sleep", "chambre_enfant", { header: { status: { text: "Asleep", color: "violet" }, scene_state: { lights: "off", sleep: "on", shutter: "0" } } }),
  ...twins("garage-opening", "garage", { header: { status: { text: "Opening", color: "amber" }, scene_state: { door: "opening", car: "on", light: "on" } } }),
  ...twins("hallway-motion", "couloir", { header: { status: { text: "Motion", color: "red" }, scene_state: { lights: "on", motion: "on", door: "on" } } }),
  ...twins("office-busy", "bureau", { header: { status: { text: "In a call", color: "red" }, scene_state: { pc: "on", lamp: "on", busy: "on" } } }),
  ...twins("laundry-running", "buanderie", { header: { status: { text: "2 running", color: "cyan" }, scene_state: { washer: "on", dryer: "on" } } }),
  ...twins("entrance-doorbell", "entree", { header: { status: { text: "Someone's at the door", color: "amber" }, scene_state: { light: "on", door: "off", doorbell: "on", mailbox: "off", parcel: "on" } } }),
  ...twins("entryway-unlocked", "entree_interieure", { header: { status: { text: "Door open", color: "amber" }, scene_state: { lights: "on", lock: "unlocked", alarm: "pending", door: "on" } } }),
  ...twins("garden-watering", "jardin", { header: { status: { text: "Watering", color: "cyan" }, scene_state: { watering: "on", mower: "mowing", lights: "on" } } }),
  ...twins("energy-now", "energie", { header: { status: { text: "1.24 kW", color: "amber" }, scene_state: { layout: "now", grid: "0.44", solar: "0.8" } } }),
];
