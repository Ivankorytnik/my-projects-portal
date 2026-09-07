(() => {
  const managedUrls = {
    sound: "https://korytnikhub.pro/sound/",
    "fishing-day": "https://korytnikhub.pro/fishing/",
    calculator: "https://korytnikhub.pro/calculator/",
    "kp-auto": "https://korytnikhub.pro/auto/",
    "korytnik-ai": "https://korytnikhub.pro/ai/"
  };

  try {
    if (Array.isArray(initialProjects)) {
      initialProjects.forEach(project => {
        if (managedUrls[project.id]) project.url = managedUrls[project.id];
      });
    }

    if (state && Array.isArray(state.projects)) {
      state.projects = state.projects.map(project =>
        managedUrls[project.id] ? { ...project, url: managedUrls[project.id] } : project
      );
      if (typeof saveProjects === "function") saveProjects();
      if (typeof render === "function") render();
    }

    const documentsKeyInput = document.getElementById("documentsAccessKey");
    const documentsUnlockButton = document.getElementById("documentsUnlockButton");
    if (documentsKeyInput && documentsUnlockButton) {
      documentsKeyInput.setAttribute("inputmode", "numeric");
      documentsKeyInput.setAttribute("maxlength", "6");
      documentsKeyInput.addEventListener("input", () => {
        const value = documentsKeyInput.value.replace(/\D/g, "").slice(0, 6);
        if (documentsKeyInput.value !== value) documentsKeyInput.value = value;
        if (value.length === 6) {
          setTimeout(() => documentsUnlockButton.click(), 0);
        }
      });
    }
  } catch (error) {
    console.error("KORYTNIK HUB path migration failed:", error);
  }
})();
