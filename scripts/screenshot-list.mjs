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
  bathroom: ["Bathroom", "Heating", "Humidity"],
  toilet: ["Toilet", "Ventilation"],
  bedroom: ["Bedroom", "Shutters", "Climate"],
  nursery: ["Nursery", "Monitor", "Climate"],
  kids_room: ["Kids", "Lights", "Shutters"],
  teen_room: ["Teen", "PC", "Lights"],
  garage: ["Garage", "Car", "Tools"],
  hallway: ["Hallway", "Entrance", "Lights"],
  office: ["Office", "PC", "Climate"],
  laundry: ["Laundry", "Washer", "Dryer"],
  entrance: ["Entrance", "Doorbell", "Mail"],
  garden: ["Garden", "Watering", "Mower"],
  entryway: ["Entrance", "Alarm", "Lock"],
  pool: ["Pool", "Filtration", "Heating"],
  game_room: ["Game room", "Arcade", "Lights"],
  living_room: ["Living room", "TV", "Shutters"],
  kitchen: ["Kitchen", "Oven", "Dishwasher"],
  dining_room: ["Dining room", "Lights", "Shutters"],
  cellar: ["Cellar", "Water heater", "Leaks"],
  attic: ["Attic", "Skylight", "Climate"],
  guest_room: ["Guest room", "Shutters", "Climate"],
  home_cinema: ["Cinema", "Projector", "Sound"],
  gym: ["Gym", "Treadmill", "Climate"],
  workshop: ["Workshop", "3D printer", "Tools"],
  veranda: ["Veranda", "Blinds", "Climate"],
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
  bathroom: { title: "Bathroom", header: { scene: "bathroom", subtitle: "22 °C · 58 % humidity", status: { text: "Dry", color: "green" }, scene_state: { light: "on", humidity: "58", fan: "off" } } },
  toilet: { title: "Toilet", header: { scene: "toilet", subtitle: "Free · fan off", status: { text: "Free", color: "green" }, scene_state: { light: "off", occupied: "off", fan: "off" } } },
  bedroom: { title: "Bedroom", header: { scene: "bedroom", subtitle: "19 °C · shutter 40 %", status: { text: "Comfort", color: "green" }, scene_state: { lights: "on", shutter: "40", sleep: "off" } } },
  nursery: { title: "Nursery", header: { scene: "nursery", subtitle: "20 °C · asleep for 1 h 12", status: { text: "Asleep", color: "violet" }, scene_state: { night_light: "on", sleep: "on", music: "off" } } },
  kids_room: { title: "Kids", header: { scene: "kids_room", subtitle: "20 °C · lights on", status: { text: "Awake", color: "amber" }, scene_state: { lights: "on", sleep: "off", shutter: "100" } } },
  teen_room: { title: "Teen", header: { scene: "teen_room", subtitle: "PC on · LED strip violet", status: { text: "Gaming", color: "violet" }, scene_state: { lights: "off", pc: "on", led: "violet" } } },
  garage: { title: "Garage", header: { scene: "garage", subtitle: "Door closed · car inside", status: { text: "Closed", color: "green" }, scene_state: { door: "closed", car: "on", light: "off" } } },
  hallway: { title: "Hallway", header: { scene: "hallway", subtitle: "Bedroom door closed · no motion", status: { text: "Calm", color: "green" }, scene_state: { lights: "on", motion: "off", door: "off" } } },
  office: { title: "Office", header: { scene: "office", subtitle: "21 °C · PC on", status: { text: "Working", color: "blue" }, scene_state: { pc: "on", lamp: "on", busy: "off" } } },
  laundry: { title: "Laundry", header: { scene: "laundry", subtitle: "Washer idle · dryer idle", status: { text: "Idle", color: "gray" }, scene_state: { washer: "off", dryer: "off" } } },
  entrance: { title: "Entrance", header: { scene: "entrance", subtitle: "Door locked · 1 letter", status: { text: "Mail", color: "blue" }, scene_state: { light: "off", door: "off", doorbell: "off", mailbox: "on", parcel: "off" } } },
  entryway: { title: "Entryway", header: { scene: "entryway", subtitle: "Front door locked · alarm armed away", status: { text: "Armed", color: "green" }, scene_state: { lights: "on", lock: "locked", alarm: "armed_away", door: "off" } } },
  garden: { title: "Garden", header: { scene: "garden", subtitle: "Soil 34 % · mower docked", status: { text: "All good", color: "green" }, scene_state: { watering: "off", mower: "docked", lights: "off" } } },
  pool: { title: "Pool", header: { scene: "pool", subtitle: "Water 26 °C · pH 7.2", status: { text: "Ready", color: "green" }, scene_state: { pump: "off", light: "off", heater: "off", cleaner: "off", cover: "open" } } },
  game_room: { title: "Game room", header: { scene: "game_room", subtitle: "Arcade off · TV off", status: { text: "Idle", color: "gray" }, scene_state: { lights: "on", tv: "off", arcade: "off", neon: "violet" } } },
  living_room: { title: "Living room", header: { scene: "living_room", subtitle: "21 °C · shutter 60 %", status: { text: "Comfort", color: "green" }, scene_state: { lights: "on", tv: "off", shutter: "60" } } },
  kitchen: { title: "Kitchen", header: { scene: "kitchen", subtitle: "Oven off · dishwasher idle", status: { text: "Idle", color: "gray" }, scene_state: { lights: "on", cooking: "off", oven: "off", hood: "off", dishwasher: "off" } } },
  dining_room: { title: "Dining room", header: { scene: "dining_room", subtitle: "20 °C · shutter open", status: { text: "Comfort", color: "green" }, scene_state: { lights: "on", shutter: "100" } } },
  cellar: { title: "Cellar", header: { scene: "cellar", subtitle: "13 °C · 68 % humidity", status: { text: "Dry", color: "green" }, scene_state: { lights: "off", humidity: "68", water_heater: "off", leak: "off" } } },
  attic: { title: "Attic", header: { scene: "attic", subtitle: "24 °C · skylight open", status: { text: "Open", color: "blue" }, scene_state: { lights: "off", skylight: "open" } } },
  guest_room: { title: "Guest room", header: { scene: "guest_room", subtitle: "18 °C · no guest", status: { text: "Free", color: "gray" }, scene_state: { lights: "off", shutter: "100", occupied: "off", sleep: "off" } } },
  home_cinema: { title: "Cinema", header: { scene: "home_cinema", subtitle: "Projector off · amplifier off", status: { text: "Off", color: "gray" }, scene_state: { projector: "off", lights: "on", sound: "off" } } },
  gym: { title: "Gym", header: { scene: "gym", subtitle: "19 °C · treadmill off", status: { text: "Idle", color: "gray" }, scene_state: { treadmill: "off", fan: "off", lights: "on" } } },
  workshop: { title: "Workshop", header: { scene: "workshop", subtitle: "3D printer idle · saw off", status: { text: "Idle", color: "gray" }, scene_state: { lights: "on", printer: "off", saw: "off" } } },
  veranda: { title: "Veranda", header: { scene: "veranda", subtitle: "23 °C · blinds open", status: { text: "Comfort", color: "green" }, scene_state: { blinds: "open", lights: "off", fan: "off" } } },
};
export const viewsOf = (scene) => VIEWS[scene].map((title, i) => ({ title, path: `v${i}` }));

// The house dashboard with a subview of the living room's lights.
const SUBVIEW = [
  { title: "Home", path: "v0" },
  { title: "Living room", path: "v1" },
  { title: "Bedroom", path: "v2" },
  { title: "Living room lights", path: "living-room-lights", subview: true, icon: "mdi:sofa", back_path: "/dashboard/v1" },
];

const shot = (file, theme, scene, extra = {}) => ({ file, theme, scene, width: 1280, narrow: false, scroll: 0, header: {}, ...extra });
const twins = (file, scene, extra) => [shot(file, "light", scene, extra), shot(`${file}-dark`, "dark", scene, extra)];

export const shots = [
  // The illustrated header of each scene, desktop (scene-<name>): scene-maison, scene-equipements, scene-voitures,
  // scene-energie, scene-systeme, scene-securite, scene-famille, scene-exterieur, scene-bathroom, scene-toilet,
  // scene-bedroom, scene-nursery, scene-kids_room, scene-teen_room, scene-garage, scene-hallway,
  // scene-office, scene-laundry, scene-entrance, scene-entryway, scene-garden, scene-pool, scene-game_room,
  // scene-living_room, scene-kitchen, scene-dining_room, scene-cellar, scene-attic, scene-guest_room,
  // scene-home_cinema, scene-gym, scene-workshop, scene-veranda.
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
  // A subview (back button, the subview's title and icon, the dashboard's title as subtitle, no tabs): illustrated on
  // a desktop, and with `mode: auto` on a phone (compact).
  ...twins("subview", "maison", { views: SUBVIEW, view: 3 }),
  ...twins("subview-phone", "maison", { views: SUBVIEW, view: 3, width: 390, narrow: true, header: { mode: "auto" } }),
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
  ...twins("bathroom-steam", "bathroom", { header: { status: { text: "Humid", color: "cyan" }, scene_state: { light: "on", humidity: "82", fan: "on" } } }),
  ...twins("toilet-occupied", "toilet", { header: { status: { text: "Occupied", color: "red" }, scene_state: { light: "on", occupied: "on", fan: "on" } } }),
  ...twins("bedroom-sleep", "bedroom", { header: { status: { text: "Night", color: "violet" }, scene_state: { lights: "off", shutter: "0", sleep: "on" } } }),
  ...twins("nursery-music", "nursery", { header: { status: { text: "Lullaby", color: "violet" }, scene_state: { night_light: "on", sleep: "on", music: "on" } } }),
  ...twins("kids-sleep", "kids_room", { header: { status: { text: "Asleep", color: "violet" }, scene_state: { lights: "off", sleep: "on", shutter: "0" } } }),
  ...twins("garage-opening", "garage", { header: { status: { text: "Opening", color: "amber" }, scene_state: { door: "opening", car: "on", light: "on" } } }),
  ...twins("hallway-motion", "hallway", { header: { status: { text: "Motion", color: "red" }, scene_state: { lights: "on", motion: "on", door: "on" } } }),
  ...twins("office-busy", "office", { header: { status: { text: "In a call", color: "red" }, scene_state: { pc: "on", lamp: "on", busy: "on" } } }),
  ...twins("laundry-running", "laundry", { header: { status: { text: "2 running", color: "cyan" }, scene_state: { washer: "on", dryer: "on" } } }),
  ...twins("entrance-doorbell", "entrance", { header: { status: { text: "Someone's at the door", color: "amber" }, scene_state: { light: "on", door: "off", doorbell: "on", mailbox: "off", parcel: "on" } } }),
  ...twins("entryway-unlocked", "entryway", { header: { status: { text: "Door open", color: "amber" }, scene_state: { lights: "on", lock: "unlocked", alarm: "pending", door: "on" } } }),
  ...twins("garden-watering", "garden", { header: { status: { text: "Watering", color: "cyan" }, scene_state: { watering: "on", mower: "mowing", lights: "on" } } }),
  ...twins("pool-running", "pool", { header: { status: { text: "Filtering", color: "cyan" }, scene_state: { pump: "on", light: "on", heater: "on", cleaner: "on", cover: "open" } } }),
  ...twins("game-room-playing", "game_room", { header: { status: { text: "Playing", color: "violet" }, scene_state: { lights: "on", tv: "on", arcade: "on", neon: "cyan" } } }),
  ...twins("living-room-tv", "living_room", { header: { status: { text: "Watching TV", color: "violet" }, scene_state: { lights: "off", tv: "on", shutter: "0" } } }),
  ...twins("kitchen-cooking", "kitchen", { header: { status: { text: "Cooking", color: "red" }, scene_state: { lights: "on", cooking: "on", oven: "on", hood: "on", dishwasher: "on" } } }),
  ...twins("cellar-leak", "cellar", { header: { status: { text: "Leak!", color: "red" }, scene_state: { lights: "on", humidity: "82", water_heater: "on", leak: "on" } } }),
  ...twins("guest-room-staying", "guest_room", { header: { status: { text: "Guest asleep", color: "violet" }, scene_state: { lights: "off", shutter: "0", occupied: "on", sleep: "on" } } }),
  ...twins("home-cinema-playing", "home_cinema", { header: { status: { text: "Playing", color: "violet" }, scene_state: { projector: "on", lights: "off", sound: "on" } } }),
  ...twins("gym-running", "gym", { header: { status: { text: "Workout", color: "green" }, scene_state: { treadmill: "on", fan: "on", lights: "on" } } }),
  ...twins("workshop-busy", "workshop", { header: { status: { text: "Printing", color: "amber" }, scene_state: { lights: "on", printer: "printing", saw: "on" } } }),
  ...twins("veranda-fan", "veranda", { header: { status: { text: "Blinds closed", color: "amber" }, scene_state: { blinds: "closed", lights: "on", fan: "on" } } }),
  ...twins("energy-now", "energie", { header: { status: { text: "1.24 kW", color: "amber" }, scene_state: { layout: "now", grid: "0.44", solar: "0.8" } } }),
];
