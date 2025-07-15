const categoryList = document.getElementById("category-list");
const categoryTitle = document.getElementById("category-title");
const imageViewer = document.getElementById("image-viewer");
const searchBox = document.getElementById("search-box");
const homeButton = document.getElementById("home-button");
const menuToggle = document.getElementById("menu-toggle");

let chartIndex = {};
let allImages = [];
let allImagesGlobal = [];
let currentImages = [];
let currentLibrary = "";
const preloadLibraries = ["lit", "tv", "games"];
const globalIndexes = {};

const categoryIcons = {
  "1_Beginnings": "📖", "2_General": "🧠", "3_Philosophy": "⚖️", "4_Countries.Nationalities": "🌍",
  "5_Speculative Fiction": "🛸", "6_Religion": "🕊️", "7_Ideologies": "🚩", "8_Pills": "💊",
  "9_Science": "🔬", "10_Meme Charts": "🖼️", "11_Other Boards": "🧩",
  "General": "🎮", "Platforms": "🕹️", "Platforms/Nintendo": "🟥", "Platforms/Sony": "🟦",
  "Platforms/Xbox": "🟩", "Platforms/PC": "💻", "Platforms/Sega": "🌀",
  "Countries": "🌍", "Decades": "📆", "filmcore": "🎞️",
  "Genres": "🎭", "History": "📜", "Levels": "🧩", "Other": "🔀"
};

function stripPrefix(name) {
  return name.replace(/^\d+[_ ]/, "").replace(/_/g, " ").replace(/\.[^.]+$/, "");
}

function getIndexFile(lib) {
  return `/${lib}_index.json`;
}

function collectAllImages(data, lib) {
  const images = [];
  for (const top in data) {
    for (const sub in data[top]) {
      for (const file of data[top][sub]) {
        images.push({ path: file, library: lib });
      }
    }
  }
  return images;
}

function loadLibrary(lib) {
  currentLibrary = lib;
  chartIndex = globalIndexes[lib];
  allImages = collectAllImages(chartIndex, lib);
  buildSidebar();
  renderCategoryTiles("category");
}

function buildSidebar() {
  categoryList.innerHTML = "";

  const favBtn = document.createElement("a");
  favBtn.href = "#";
  favBtn.textContent = "⭐ Favorites";
  favBtn.className = "block px-3 py-2 mb-4 rounded bg-gray-700 hover:bg-gray-600 font-semibold";
  favBtn.onclick = () => {
    const favs = getFavorites(currentLibrary).map(path => ({ path, library: currentLibrary }));
    categoryTitle.textContent = "⭐ Favorites";
    currentImages = favs;
    renderImages(favs);
    toggleSidebar(false);
  };
  categoryList.appendChild(favBtn);

  Object.keys(chartIndex).sort((a, b) => parseInt(a) - parseInt(b)).forEach(top => {
    const displayName = stripPrefix(top);
    const icon = categoryIcons[top] || "📁";
    const wrapper = document.createElement("div");

    const topLink = document.createElement("a");
    topLink.href = "#";
    topLink.textContent = `${icon} ${displayName}`;
    topLink.className = "block font-semibold px-3 py-2 rounded hover:bg-gray-700 cursor-pointer";
    topLink.onclick = () => {
      const subNav = wrapper.querySelector(".sub-nav");
      subNav.classList.toggle("hidden");
    };
    wrapper.appendChild(topLink);

    const subNav = document.createElement("div");
    subNav.className = "ml-4 space-y-1 hidden sub-nav";
    wrapper.appendChild(subNav);

    const subfolders = chartIndex[top];
    Object.keys(subfolders).forEach(sub => {
      const label = sub === "_root" ? "Main" : stripPrefix(sub);
      const fullKey = `${top}/${sub}`;
      const subIcon = categoryIcons[fullKey] || "";
      const subLink = document.createElement("a");
      subLink.href = "#";
      subLink.textContent = `${subIcon} ${label}`;
      subLink.className = "block text-sm px-2 py-1 rounded hover:bg-gray-700";
      subLink.onclick = () => {
        categoryTitle.textContent = `${displayName} / ${label}`;
        searchBox.value = "";
        currentImages = subfolders[sub].map(p => ({ path: p, library: currentLibrary }));
        renderImages(currentImages);
        toggleSidebar(false);
      };
      subNav.appendChild(subLink);
    });

    categoryList.appendChild(wrapper);
  });
}

function renderCategoryTiles(type = "library") {
  imageViewer.innerHTML = "";

  if (type === "library") {
    imageViewer.className = "flex flex-wrap justify-center items-center gap-6 px-4 py-6 min-h-[60vh]";
    categoryTitle.textContent = "Choose a library";

    const libraries = [
      { name: "Lit", icon: "📖", color: "bg-indigo-600" },
      { name: "TV", icon: "📺", color: "bg-green-600" },
      { name: "Games", icon: "🎮", color: "bg-red-600" }
    ];

    libraries.forEach(lib => {
      const card = document.createElement("div");
      card.className = `${lib.color} w-40 h-40 text-white rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow hover:scale-105 transition space-y-2`;
      card.innerHTML = `<div class="text-3xl">${lib.icon}</div><div class="text-sm font-bold">${lib.name}</div>`;
      card.onclick = () => loadLibrary(lib.name.toLowerCase());
      imageViewer.appendChild(card);
    });

  } else if (type === "category") {
    imageViewer.className = "grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 py-6";
    categoryTitle.textContent = `📁 Categories in ${currentLibrary.toUpperCase()}`;

    Object.keys(chartIndex).sort((a, b) => parseInt(a) - parseInt(b)).forEach(folder => {
      const displayName = stripPrefix(folder);
      const icon = categoryIcons[folder] || "📂";
      const subfolders = chartIndex[folder];

      const card = document.createElement("div");
      card.className = "bg-slate-700 w-40 h-40 text-white rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow hover:scale-105 transition space-y-2";
      card.innerHTML = `<div class="text-2xl">${icon}</div><div class="text-sm font-bold">${displayName}</div>`;
      card.onclick = () => {
        const subKeys = Object.keys(subfolders);
        if (subKeys.length === 1 && subKeys[0] === "_root") {
          loadCategory(`${displayName} / Main`, subfolders["_root"].map(p => ({ path: p, library: currentLibrary })));
        } else {
          renderSubcategoryTiles(folder, subfolders);
        }
      };
      imageViewer.appendChild(card);
    });
  }
}

function renderSubcategoryTiles(categoryKey, subfolders) {
  imageViewer.className = "grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 py-6";
  imageViewer.innerHTML = "";
  const display = stripPrefix(categoryKey);
  categoryTitle.textContent = `📂 Subcategories of ${display}`;

  Object.keys(subfolders).forEach(sub => {
    const label = sub === "_root" ? "Main" : stripPrefix(sub);
    const icon = categoryIcons[`${categoryKey}/${sub}`] || "📁";
    const card = document.createElement("div");
    card.className = "bg-slate-700 w-40 h-40 text-white rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow hover:scale-105 transition space-y-2";
    card.innerHTML = `<div class="text-2xl">${icon}</div><div class="text-sm font-bold">${label}</div>`;
    card.onclick = () => {
      loadCategory(`${display} / ${label}`, subfolders[sub].map(p => ({ path: p, library: currentLibrary })));
    };
    imageViewer.appendChild(card);
  });
}

function loadCategory(title, images) {
  categoryTitle.textContent = title;
  currentImages = images.slice();
  searchBox.value = "";
  renderImages(currentImages);
}

function renderImages(images) {
  imageViewer.className = "grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 py-6";
  imageViewer.innerHTML = "";

  images.slice().sort((a, b) => {
    const nameA = stripPrefix(a.path.split("/").pop().toLowerCase());
    const nameB = stripPrefix(b.path.split("/").pop().toLowerCase());
    return nameA.localeCompare(nameB);
  }).forEach(item => {
    const { path, library } = item;
    const fileName = path.split("/").pop();
    const isStarred = isFavorited(library, path);

    const wrapper = document.createElement("div");
    wrapper.className = "text-center relative";

    const link = document.createElement("a");
    link.href = `viewer.html?img=${encodeURIComponent(`${library}/${path}`)}`;
    link.target = "_self";

    const img = document.createElement("img");
    img.src = `/${library}/${path}`;
    img.alt = fileName;
    img.className = "rounded shadow";
    img.loading = "lazy";
    img.onerror = () => {
      img.src = "";
      img.alt = "🖼️ Not found";
      img.style.width = "100%";
      img.style.height = "10rem";
    };

    const caption = document.createElement("div");
    caption.className = "mt-2 text-sm text-gray-300 truncate";
    caption.textContent = stripPrefix(fileName);

    const star = document.createElement("button");
    star.innerHTML = isStarred ? "⭐" : "☆";
    star.title = "Toggle Favorite";
    star.className = "absolute top-2 right-2 text-xl bg-black bg-opacity-50 px-2 rounded";
    star.onclick = (e) => {
      e.preventDefault();
      toggleFavorite(library, path);
      renderImages(currentImages);
    };

    link.appendChild(img);
    wrapper.appendChild(link);
    wrapper.appendChild(caption);
    wrapper.appendChild(star);
    imageViewer.appendChild(wrapper);
  });
}

function getFavorites(lib) {
  return JSON.parse(localStorage.getItem(`${lib}_favorites`) || "[]");
}
function isFavorited(lib, path) {
  return getFavorites(lib).includes(path);
}
function toggleFavorite(lib, path) {
  let favs = getFavorites(lib);
  if (favs.includes(path)) favs = favs.filter(f => f !== path);
  else favs.push(path);
  localStorage.setItem(`${lib}_favorites`, JSON.stringify(favs));
}

// Search
searchBox.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (query === "") {
    if (currentImages.length) renderImages(currentImages);
    else renderCategoryTiles(currentLibrary ? "category" : "library");
    return;
  }

  const imagesToSearch = currentLibrary ? allImages : allImagesGlobal;
  const filtered = imagesToSearch.filter(item =>
    stripPrefix(item.path.split("/").pop().toLowerCase()).includes(query)
  );
  categoryTitle.textContent = `Search results for: "${query}"`;
  renderImages(filtered);
});

// Home & Menu
homeButton.onclick = () => {
  searchBox.value = "";
  currentImages = [];
  categoryList.innerHTML = "";
  currentLibrary = "";
  renderCategoryTiles("library");
};
menuToggle.onclick = () => toggleSidebar();
function toggleSidebar(force) {
  const sidebar = document.getElementById("sidebar");
  if (typeof force === "boolean") {
    sidebar.classList.toggle("hidden", !force);
  } else {
    sidebar.classList.toggle("hidden");
  }
}

// Load everything
Promise.all(preloadLibraries.map(lib =>
  fetch(getIndexFile(lib)).then(res => res.json()).then(data => {
    globalIndexes[lib] = data;
    allImagesGlobal.push(...collectAllImages(data, lib));
  })
)).then(() => {
  renderCategoryTiles("library");
});
