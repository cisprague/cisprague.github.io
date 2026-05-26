const landingImages = [
  {
    src: "assets/img/landing/london-greenwich.jpg",
    alt: "London skyline seen through trees from Greenwich Park",
    caption: "Greenwich Park, London",
  },
  {
    src: "assets/img/landing/mountain-cloud.jpg",
    alt: "Wide mountain valley under a blue sky with a bright cloud",
    caption: "Kebnekaise, Sweden",
  },
  {
    src: "assets/img/landing/mountain-pass.jpg",
    alt: "Rocky mountain pass with a bridge and distant valley",
    caption: "Kebnekaise, Sweden",
  },
  {
    src: "assets/img/landing/valley-boardwalk.jpg",
    alt: "Wooden boardwalk crossing a green valley between snowy mountains",
    caption: "Kungsleden, Swedish Lapland",
  },
  {
    src: "assets/img/landing/antarctica-sunset.jpg",
    alt: "Sunset over icebergs and dark water in Antarctica",
    caption: "Antarctica",
  },
  {
    src: "assets/img/landing/antarctica-moon-iceberg.jpg",
    alt: "Moon above icebergs and calm Antarctic water",
    caption: "Antarctica",
  },
  {
    src: "assets/img/landing/southern-ocean-sun.jpg",
    alt: "Bright sun over a grey Southern Ocean horizon",
    caption: "Southern Ocean",
  },
  {
    src: "assets/img/landing/antarctica-ship-auv.jpg",
    alt: "Research ship and autonomous underwater vehicle in Antarctic waters",
    caption: "Antarctica",
  },
];

const panelLinks = document.querySelectorAll("[data-panel-link]");
const panels = document.querySelectorAll("[data-panel]");
const imageRoot = document.querySelector("[data-random-image]");
const caption = document.querySelector("[data-image-caption]");
const thoughtFilterRoot = document.querySelector("[data-thought-filters]");
const thoughtItems = document.querySelectorAll("[data-thought-tags]");
let currentImageIndex = -1;

function showPanel(name, pushState = true) {
  const target = document.querySelector(`[data-panel="${name}"]`);
  if (!target) return;

  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel === target);
  });

  panelLinks.forEach((link) => {
    const isCurrent = link.dataset.panelLink === name;
    link.classList.toggle("is-current", isCurrent);
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (pushState) {
    history.pushState({ panel: name }, "", `#${name}`);
  }
}

function panelFromPath() {
  if (window.location.hash) return window.location.hash.slice(1);

  const path = window.location.pathname.replace(/\/+$/, "");
  if (path === "" || path === "/index.html") return "home";
  return path.slice(1).split("/")[0] || "home";
}

function hydrateLandingImage() {
  if (!imageRoot || landingImages.length === 0) return;

  let nextImageIndex = Math.floor(Math.random() * landingImages.length);
  if (landingImages.length > 1) {
    while (nextImageIndex === currentImageIndex) {
      nextImageIndex = Math.floor(Math.random() * landingImages.length);
    }
  }

  currentImageIndex = nextImageIndex;
  const image = landingImages[currentImageIndex];
  const img = document.createElement("img");
  img.src = image.src;
  img.alt = image.alt;
  img.loading = "eager";

  imageRoot.replaceChildren(img, caption);
  if (caption) caption.textContent = image.caption ?? "";
}

panelLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (link.dataset.panelLink === "home") {
      hydrateLandingImage();
    }
    showPanel(link.dataset.panelLink);
  });
});

window.addEventListener("popstate", () => {
  showPanel(panelFromPath(), false);
});

function createThoughtFilterButton({ filter, level, parent, hidden = false }) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = filter;
  button.dataset.filterLevel = level;
  button.dataset.thoughtFilter = filter;
  if (parent) button.dataset.filterParent = parent;
  button.hidden = hidden;
  return button;
}

function buildThoughtFilters() {
  if (!thoughtFilterRoot || thoughtItems.length === 0) return [];

  const groups = new Map();
  thoughtItems.forEach((item) => {
    const group = item.dataset.thoughtGroup;
    const tags = item.dataset.thoughtTags.split(" ").filter(Boolean);
    if (!group) return;
    if (!groups.has(group)) groups.set(group, new Set());
    tags.forEach((tag) => groups.get(group).add(tag));
  });

  const buttons = [
    createThoughtFilterButton({ filter: "all", level: "all" }),
    ...Array.from(groups.keys()).map((group) =>
      createThoughtFilterButton({ filter: group, level: "group" }),
    ),
    ...Array.from(groups.entries()).flatMap(([group, tags]) =>
      Array.from(tags).map((tag) =>
        createThoughtFilterButton({
          filter: tag,
          level: "tag",
          parent: group,
          hidden: true,
        }),
      ),
    ),
  ];

  buttons[0].classList.add("is-current");
  thoughtFilterRoot.replaceChildren(...buttons);
  return buttons;
}

function hydrateThoughtFilters() {
  const thoughtFilterButtons = buildThoughtFilters();

  thoughtFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
    const filter = button.dataset.thoughtFilter;
    const level = button.dataset.filterLevel;
    const parent = button.dataset.filterParent;

    thoughtFilterButtons.forEach((candidate) => {
      const candidateLevel = candidate.dataset.filterLevel;
      const candidateParent = candidate.dataset.filterParent;

      if (filter === "all") {
        candidate.hidden = candidateLevel === "tag";
      } else if (level === "group") {
        candidate.hidden =
          candidateLevel === "group" ||
          (candidateLevel === "tag" && candidateParent !== filter);
      } else if (level === "tag") {
        candidate.hidden =
          candidateLevel === "group" ||
          (candidateLevel === "tag" && candidateParent !== parent);
      }
    });

    thoughtFilterButtons.forEach((candidate) => {
      candidate.classList.toggle("is-current", candidate === button);
    });

    thoughtItems.forEach((item) => {
      const tags = item.dataset.thoughtTags.split(" ");
      const group = item.dataset.thoughtGroup;
      const isVisible =
        filter === "all" ||
        (level === "group" && group === filter) ||
        (level === "tag" && tags.includes(filter));
      item.hidden = !isVisible;
    });
  });
  });
}

hydrateLandingImage();
hydrateThoughtFilters();
showPanel(panelFromPath(), false);
