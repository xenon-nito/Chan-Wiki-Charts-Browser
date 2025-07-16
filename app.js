document.addEventListener("DOMContentLoaded", () => {
  const categoryList = document.getElementById("category-list");
  const categoryTitle = document.getElementById("category-title");
  const imageViewer = document.getElementById("image-viewer");
  const searchBox = document.getElementById("search-box");
  const homeButton = document.getElementById("home-button");

  function stripPrefix(name) {
    return name.replace(/^\d+[_ ]/, "").replace(/_/g, " ").replace(/\.[^.]+$/, "");
  }

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

  function getIndexFile(lib) {
    return `${lib}_index.json`;
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

    if (!currentLibrary) {
      const libraries = [
        { name: "lit", label: "📚 Literature" },
        { name: "tv", label: "📺 Television" },
        { name: "games", label: "🎮 Games" }
      ];
      libraries.forEach(lib => {
        const link = document.createElement("a");
        link.href = "#";
        link.textContent = lib.label;
        link.className = "block px-3 py-2 rounded hover:bg-gray-700 font-semibold";
        link.onclick = () => {
          const hash = `#${lib.name}`;
          sessionStorage.setItem("lastCategoryURL", window.location.pathname + hash);
          history.pushState({}, "", hash);
          loadLibrary(lib.name);
        };
        categoryList.appendChild(link);
      });
      return;
    }

    const favBtn = document.createElement("a");
    favBtn.href = "#";
    favBtn.textContent = "⭐ Favorites";
    favBtn.className = "block px-3 py-2 mb-4 rounded bg-gray-700 hover:bg-gray-600 font-semibold";
    favBtn.onclick = () => {
      const favs = getFavorites(currentLibrary).map(path => ({ path, library: currentLibrary }));
      categoryTitle.textContent = "⭐ Favorites";
      currentImages = favs;
      const hash = `#${currentLibrary}/favorites`;
      sessionStorage.setItem("lastCategoryURL", window.location.pathname + hash);
      history.pushState({}, "", hash);
      renderImages(favs);
    };
    categoryList.appendChild(favBtn);

    Object.keys(chartIndex).sort((a, b) => parseInt(a) - parseInt(b)).forEach(top => {
      const displayName = stripPrefix(top);
      const icon = categoryIcons[top] || "📂";
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
        const icon = categoryIcons[fullKey] || "";
        const subLink = document.createElement("a");
        subLink.href = "#";
        subLink.textContent = `${icon} ${label}`;
        subLink.className = "block text-sm px-2 py-1 rounded hover:bg-gray-700";

        subLink.onclick = (() => {
          const scopedTop = top;
          const scopedSub = sub;
          const scopedLabel = label;
          const scopedDisplay = displayName;
          return () => {
            const hash = `#${currentLibrary}/${scopedTop}/${scopedSub}`;
            sessionStorage.setItem("lastCategoryURL", window.location.pathname + hash);
            history.pushState({}, "", hash);
            categoryTitle.textContent = `${scopedDisplay} / ${scopedLabel}`;
            searchBox.value = "";
            currentImages = chartIndex[scopedTop][scopedSub].map(p => ({ path: p, library: currentLibrary }));
            renderImages(currentImages);
          };
        })();

        subNav.appendChild(subLink);
      });

      categoryList.appendChild(wrapper);
    });
  }

  function renderCategoryTiles(type = "library") {
    imageViewer.innerHTML = "";
    imageViewer.className = type === "library"
      ? "flex flex-wrap justify-center items-center gap-6 px-4 py-6 min-h-[60vh]"
      : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center px-4 py-6";

    if (type === "library") {
      buildSidebar();
      categoryTitle.textContent = "Choose a library";

      const libraries = [
        { name: "Lit", icon: "📚", color: "bg-indigo-600" },
        { name: "TV", icon: "📺", color: "bg-green-600" },
        { name: "Games", icon: "🎮", color: "bg-red-600" }
      ];

      libraries.forEach(lib => {
        const card = document.createElement("div");
        card.className = `${lib.color} w-full sm:w-44 h-48 text-white rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow hover:scale-105 transform transition space-y-2`;
        card.innerHTML = `<div class="text-4xl">${lib.icon}</div><div class="text-lg font-bold">${lib.name}</div>`;
        card.onclick = () => {
          const hash = `#${lib.name.toLowerCase()}`;
          sessionStorage.setItem("lastCategoryURL", window.location.pathname + hash);
          history.pushState({}, "", hash);
          loadLibrary(lib.name.toLowerCase());
        };
        imageViewer.appendChild(card);
      });
    } else {
      categoryTitle.textContent = `📁 Categories in ${currentLibrary.toUpperCase()}`;
      buildSidebar();

      Object.keys(chartIndex).forEach(folder => {
        const displayName = stripPrefix(folder);
        const icon = categoryIcons[folder] || "📂";
        const subfolders = chartIndex[folder];

        const card = document.createElement("div");
        card.className = "bg-slate-700 w-full sm:w-44 h-52 text-white rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow hover:scale-105 transition space-y-2";
        card.innerHTML = `<div class="text-4xl">${icon}</div><div class="text-lg font-bold">${displayName}</div>`;
        card.onclick = () => {
          const hash = `#${currentLibrary}/${folder}`;
          sessionStorage.setItem("lastCategoryURL", window.location.pathname + hash);
          history.pushState({}, "", hash);
          renderSubcategoryTiles(folder, subfolders);
        };
        imageViewer.appendChild(card);
      });
    }
  }

  function renderSubcategoryTiles(categoryKey, subfolders) {
    imageViewer.innerHTML = "";
    imageViewer.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center px-4 py-6";
    const display = stripPrefix(categoryKey);
    categoryTitle.textContent = `📂 Subcategories of ${display}`;

    Object.keys(subfolders).forEach(sub => {
      const label = sub === "_root" ? "Main" : stripPrefix(sub);
      const icon = categoryIcons[`${categoryKey}/${sub}`] || "📁";
      const card = document.createElement("div");
      card.className = "bg-slate-700 w-full sm:w-44 h-52 text-white rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow hover:scale-105 transition space-y-2";
      card.innerHTML = `<div class="text-3xl">${icon}</div><div class="text-lg font-bold">${label}</div>`;
      card.onclick = () => {
        const hash = `#${currentLibrary}/${categoryKey}/${sub}`;
        sessionStorage.setItem("lastCategoryURL", window.location.pathname + hash);
        history.pushState({}, "", hash);
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
    imageViewer.innerHTML = "";
    imageViewer.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center px-4 py-6";

    images.slice().sort((a, b) => {
      const nameA = stripPrefix(a.path.split("/").pop().toLowerCase());
      const nameB = stripPrefix(b.path.split("/").pop().toLowerCase());
      return nameA.localeCompare(nameB);
    }).forEach(item => {
      const { path, library } = item;
      const fileName = path.split("/").pop();
      const isStarred = getFavorites(library).includes(path);

      const wrapper = document.createElement("div");
      wrapper.className = "thumb-wrapper text-center relative";

      const link = document.createElement("a");
      const viewerURL = `viewer.html?img=${encodeURIComponent(`${library}/${path}`)}`;
      link.href = viewerURL;
      link.onclick = (e) => {
        e.preventDefault();
        window.location.href = viewerURL;
      };

      const img = document.createElement("img");
      img.src = `${library}/thumbnails/${path}`;
      img.alt = fileName;
      img.className = "rounded shadow";

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

  homeButton.onclick = () => {
    searchBox.value = "";
    currentImages = [];
    categoryList.innerHTML = "";
    currentLibrary = "";
    history.pushState({}, "", "#home");
    sessionStorage.setItem("lastCategoryURL", window.location.pathname + "#home");
    renderCategoryTiles("library");
  };

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

  function getFavorites(lib) {
    return JSON.parse(localStorage.getItem(`${lib}_favorites`) || "[]");
  }

  function toggleFavorite(lib, path) {
    let favs = getFavorites(lib);
    if (favs.includes(path)) favs = favs.filter(f => f !== path);
    else favs.push(path);
    localStorage.setItem(`${lib}_favorites`, JSON.stringify(favs));
  }

  function handleInitialHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const [lib, top, sub] = hash.split("/");
    if (!lib || !globalIndexes[lib]) return;
    loadLibrary(lib);
    if (top && sub && globalIndexes[lib][top]?.[sub]) {
      categoryTitle.textContent = `${stripPrefix(top)} / ${stripPrefix(sub)}`;
      currentImages = globalIndexes[lib][top][sub].map(p => ({ path: p, library: lib }));
      renderImages(currentImages);
    } else if (top) {
      renderSubcategoryTiles(top, globalIndexes[lib][top]);
    }
  }

  Promise.all(preloadLibraries.map(lib =>
    fetch(getIndexFile(lib)).then(res => res.json()).then(data => {
      globalIndexes[lib] = data;
      allImagesGlobal.push(...collectAllImages(data, lib));
    })
  )).then(() => {
    renderCategoryTiles("library");
    handleInitialHash();
  });
});
