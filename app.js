const demoSpots = [
  {
    id: "mermaid-tail-waterhole",
    name: "Mermaid Tail Waterhole",
    type: "waterhole",
    area: "Near a waterfall south of Sydney",
    trust: "locals",
    x: 61,
    y: 38,
    note: "Cold plunge pool, slippery sandstone after rain, keep groups tiny.",
    access: "Exact entry shared after two trusted saves and one local confirmation.",
  },
  {
    id: "bundeena-sand-cove",
    name: "Bundeena Quiet Cove",
    type: "beach",
    area: "Bundeena / Cronulla ferry side",
    trust: "trusted",
    x: 44,
    y: 68,
    note: "Clothing-optional etiquette, no photos, check tide and park rules.",
    access: "Approximate pin visible. Exact path unlocks for trusted members.",
  },
  {
    id: "fern-loop-track",
    name: "Fern Loop Track",
    type: "trail",
    area: "Dharawal bushland",
    trust: "approximate",
    x: 24,
    y: 32,
    note: "Great after light rain, leeches in summer, avoid posting geotagged photos.",
    access: "Trailhead hidden inside a 1.5 km privacy zone.",
  },
  {
    id: "last-light-ledge",
    name: "Last Light Ledge",
    type: "lookout",
    area: "Royal National Park edge",
    trust: "approximate",
    x: 72,
    y: 58,
    note: "Unfenced view. Stay back from wet rock and do not visit in high wind.",
    access: "Rough area only until safety notes are acknowledged.",
  },
];

const storageKey = "whisper-map-spots";
const icons = {
  waterhole: "~",
  trail: "^",
  beach: "o",
  lookout: "*",
};

let spots = loadSpots();
let activeFilter = "all";
let activeSpotId = spots[0]?.id;

const pinsEl = document.querySelector("#pins");
const cardsEl = document.querySelector("#cards");
const detailEl = document.querySelector("#spot-detail");
const searchEl = document.querySelector("#search");
const formEl = document.querySelector("#spot-form");
const visibleCountEl = document.querySelector("#visible-count");
const savedCountEl = document.querySelector("#saved-count");
const resetDemoEl = document.querySelector("#reset-demo");

function loadSpots() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return demoSpots;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : demoSpots;
  } catch {
    return demoSpots;
  }
}

function saveSpots() {
  localStorage.setItem(storageKey, JSON.stringify(spots));
}

function getVisibleSpots() {
  const query = searchEl.value.trim().toLowerCase();
  return spots.filter((spot) => {
    const matchesFilter = activeFilter === "all" || spot.type === activeFilter;
    const searchable = `${spot.name} ${spot.area} ${spot.note} ${spot.type}`.toLowerCase();
    return matchesFilter && searchable.includes(query);
  });
}

function render() {
  const visible = getVisibleSpots();
  if (!visible.some((spot) => spot.id === activeSpotId)) {
    activeSpotId = visible[0]?.id;
  }

  renderPins(visible);
  renderCards(visible);
  renderDetail(visible.find((spot) => spot.id === activeSpotId) || visible[0]);
  visibleCountEl.textContent = visible.length;
  savedCountEl.textContent = spots.length;
}

function renderPins(visible) {
  pinsEl.innerHTML = "";
  visible.forEach((spot) => {
    const pin = document.createElement("button");
    pin.className = `pin ${spot.id === activeSpotId ? "active" : ""}`;
    pin.style.left = `${spot.x}%`;
    pin.style.top = `${spot.y}%`;
    pin.dataset.trust = spot.trust;
    pin.type = "button";
    pin.setAttribute("aria-label", `Open ${spot.name}`);
    pin.innerHTML = `<span>${icons[spot.type] || "x"}</span>`;
    pin.addEventListener("click", () => {
      activeSpotId = spot.id;
      render();
    });
    pinsEl.appendChild(pin);
  });
}

function renderCards(visible) {
  cardsEl.innerHTML = "";
  if (!visible.length) {
    cardsEl.innerHTML = `<div class="empty-state">No whispers match this view yet. Save the first one before it disappears into group chat history.</div>`;
    return;
  }

  visible.forEach((spot) => {
    const card = document.createElement("article");
    card.className = "spot-card";
    card.innerHTML = `
      <div class="tag-row">
        <span class="tag">${label(spot.type)}</span>
        <span class="tag">${label(spot.trust)}</span>
      </div>
      <h3>${escapeHtml(spot.name)}</h3>
      <p>${escapeHtml(spot.area)}</p>
      <button type="button">View saved pin</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      activeSpotId = spot.id;
      render();
      detailEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    cardsEl.appendChild(card);
  });
}

function renderDetail(spot) {
  if (!spot) {
    detailEl.innerHTML = `<div class="empty-state">Try a wider filter to reveal saved spots.</div>`;
    return;
  }

  detailEl.innerHTML = `
    <img src="assets/hidden-waterhole.png" alt="Hidden Australian waterhole surrounded by bushland" />
    <div class="tag-row">
      <span class="tag">${label(spot.type)}</span>
      <span class="tag">${label(spot.trust)}</span>
    </div>
    <h3>${escapeHtml(spot.name)}</h3>
    <p>${escapeHtml(spot.area)}</p>
    <div class="meta-stack">
      <div class="meta-item">
        <strong>Safety and care</strong>
        <span>${escapeHtml(spot.note || "No note yet. Add access risks before sharing directions.")}</span>
      </div>
      <div class="meta-item">
        <strong>Location access</strong>
        <span>${escapeHtml(spot.access || privacyCopy(spot.trust))}</span>
      </div>
    </div>
    <div class="trust-box">${privacyCopy(spot.trust)}</div>
  `;
}

function label(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function privacyCopy(trust) {
  if (trust === "locals") return "Locals-only: exact location stays hidden unless the saver approves a request.";
  if (trust === "trusted") return "Trusted access: show an approximate pin publicly, reveal exact notes to verified users.";
  return "Approximate first: protect the place with a privacy radius before directions.";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addSpot(event) {
  event.preventDefault();
  const formData = new FormData(formEl);
  const id = `${formData.get("name")}-${Date.now()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const spot = {
    id,
    name: formData.get("name").trim(),
    type: formData.get("type"),
    area: formData.get("area").trim(),
    trust: formData.get("trust"),
    note: formData.get("note").trim(),
    access: privacyCopy(formData.get("trust")),
    x: 18 + Math.round(Math.random() * 64),
    y: 18 + Math.round(Math.random() * 58),
  };

  spots = [spot, ...spots];
  activeSpotId = spot.id;
  saveSpots();
  formEl.reset();
  render();
}

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.filter;
    render();
  });
});

searchEl.addEventListener("input", render);
formEl.addEventListener("submit", addSpot);
resetDemoEl.addEventListener("click", () => {
  spots = demoSpots;
  activeSpotId = spots[0].id;
  localStorage.removeItem(storageKey);
  searchEl.value = "";
  activeFilter = "all";
  document.querySelectorAll(".chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.filter === "all"));
  render();
});

render();
