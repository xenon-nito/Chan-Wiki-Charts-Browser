document.addEventListener("DOMContentLoaded", () => {
  const categoryList = document.getElementById("category-list");
  const categoryTitle = document.getElementById("category-title");
  const imageViewer = document.getElementById("image-viewer");
  const searchBox = document.getElementById("search-box");
  const homeButton = document.getElementById("home-button");
  const breadcrumb = document.getElementById("breadcrumb");

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

  function renderBreadcrumb() {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      breadcrumb.innerHTML = `<span>🏠 Home</span>`;
      return;
    }

    const parts = hash.split("/").map(decodeURIComponent);
    const links = [];

    links.push(`<a href="#home" class="hover:underline">🏠 Home</a>`);

    if (parts.length >= 1) {
      const lib = parts[0];
      const libLabel = {
        lit: "📚 Lit",
        tv: "📺 TV",
        games: "🎮 Games",
        anime: "🍥 Anime",
        music: "🎵 Music"
      }[lib] || lib;
      links.push(`<a href="#${lib}" class="hover:underline">${libLabel}</a>`);
    }

    if (parts.length >= 2) {
      const top = parts[1];
      const icon = categoryIcons[top] || "📂";
      links.push(`<a href="#${parts.slice(0, 2).join("/")}" class="hover:underline">${icon} ${stripPrefix(top)}</a>`);
    }

    if (parts.length >= 3) {
      const sub = parts[2];
      const key = `${parts[1]}/${sub}`;
      const icon = categoryIcons[key] || "📁";
      links.push(`<span>${icon} ${stripPrefix(sub)}</span>`);
    }

    breadcrumb.innerHTML = links.join(" / ");
  }

	function safeRender(fn) {
	  fn();
	  renderBreadcrumb();
	}

  function loadLibrary(lib) {
    currentLibrary = lib;
    chartIndex = globalIndexes[lib];
    allImages = collectAllImages(chartIndex, lib);
    buildSidebar();
    safeRender(() => renderCategoryTiles("category"));
  }

  function buildSidebar() {
    categoryList.innerHTML = "";

    if (!currentLibrary) {
      const libraries = [
        { name: "lit", label: "📚 Literature" },
        { name: "tv", label: "📺 Television" },
        { name: "games", label: "🎮 Games" },
        { name: "anime", label: "🍥 Anime" },
        { name: "music", label: "🎵 Music" }
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
      safeRender(() => renderImages(favs));
    };
    categoryList.appendChild(favBtn);

    Object.keys(chartIndex)
		.sort((a, b) => stripPrefix(a).localeCompare(stripPrefix(b)))
		.forEach(top => {
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
            safeRender(() => renderImages(currentImages));
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
        { name: "Games", icon: "🎮", color: "bg-red-600" },
        { name: "Anime", icon: "🍥", color: "bg-pink-600" },
        { name: "Music", icon: "🎵", color: "bg-yellow-600" }
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

      Object.keys(chartIndex)
		.sort((a, b) => stripPrefix(a).localeCompare(stripPrefix(b)))
		.forEach(folder => {
        const displayName = stripPrefix(folder);
        const icon = categoryIcons[folder] || "📂";
        const subfolders = chartIndex[folder];

        const card = document.createElement("div");
        card.className = "bg-slate-700 w-full sm:w-44 h-52 text-white rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow transition-transform duration-300 ease-in-out transform hover:scale-105 hover:rotate-1";
        card.innerHTML = `<div class="text-4xl">${icon}</div><div class="text-lg font-bold">${displayName}</div>`;
        card.onclick = () => {
          const hash = `#${currentLibrary}/${folder}`;
          sessionStorage.setItem("lastCategoryURL", window.location.pathname + hash);
          history.pushState({}, "", hash);
          safeRender(() => renderSubcategoryTiles(folder, subfolders));
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
      card.className = "bg-slate-700 w-full sm:w-44 h-52 text-white rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow transition-transform duration-300 ease-in-out transform hover:scale-105 hover:-rotate-1";
      card.innerHTML = `<div class="text-3xl">${icon}</div><div class="text-lg font-bold">${label}</div>`;
      card.onclick = () => {
        const hash = `#${currentLibrary}/${categoryKey}/${sub}`;
        sessionStorage.setItem("lastCategoryURL", window.location.pathname + hash);
        history.pushState({}, "", hash);
        safeRender(() => loadCategory(`${display} / ${label}`, subfolders[sub].map(p => ({ path: p, library: currentLibrary }))));
      };
      imageViewer.appendChild(card);
    });
  }

  function loadCategory(title, images) {
    categoryTitle.textContent = title;
    currentImages = images.slice();
    searchBox.value = "";
    safeRender(() => renderImages(currentImages));
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
    safeRender(() => renderCategoryTiles("library"));
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
    safeRender(() => renderImages(filtered));
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
    const [libRaw, topRaw, subRaw] = hash.split("/");
	const lib = decodeURIComponent(libRaw);
	const top = decodeURIComponent(topRaw || "");
	const sub = decodeURIComponent(subRaw || "");
    if (!lib || !globalIndexes[lib]) return;
    loadLibrary(lib);
    if (top && sub && globalIndexes[lib][top]?.[sub]) {
      categoryTitle.textContent = `${stripPrefix(top)} / ${stripPrefix(sub)}`;
      currentImages = globalIndexes[lib][top][sub].map(p => ({ path: p, library: lib }));
      safeRender(() => renderImages(currentImages));
    } else if (top) {
      safeRender(() => renderSubcategoryTiles(top, globalIndexes[lib][top]));
    }
  }

  Promise.all(preloadLibraries.map(lib =>
    fetch(getIndexFile(lib)).then(res => res.json()).then(data => {
      globalIndexes[lib] = data;
      allImagesGlobal.push(...collectAllImages(data, lib));
    })
  )).then(() => {
    safeRender(() => renderCategoryTiles("library"));
    handleInitialHash();
	window.addEventListener("hashchange", () => handleInitialHash());
  });
    // Theme toggle logic
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  // Load theme preference from localStorage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    body.classList.add("light");
  }

  themeToggle.addEventListener("click", () => {
    body.classList.toggle("light");
    const newTheme = body.classList.contains("light") ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    themeToggle.textContent = newTheme === "light" ? "Toggle Dark Mode" : "Toggle Light Mode";
  });

  // Update button label on load
  themeToggle.textContent = body.classList.contains("light") ? "Toggle Dark Mode" : "Toggle Light Mode";

});
