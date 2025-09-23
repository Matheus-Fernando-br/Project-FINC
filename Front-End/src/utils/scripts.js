export default function initScripts() {

  window.setTimeout(() => {

  // ================== ELEMENTOS ==================
  const darkModeBtn = document.querySelector(".bi-moon");

  const hamburger = document.querySelector(".hamburger");
  const closeMenu = document.querySelector(".close-menu");
  const sidebar = document.querySelector(".sidebar");

  // ================== VARIÁVEIS ==================
  let fontSize = 100; // percentual inicial do zoom (%)

  // ================== FUNÇÕES ==================
  function updateZoom() {
    document.body.style.fontSize = fontSize + "%";
  }

  function zoomIn() {
    fontSize += 10;
    updateZoom();
  }

  function zoomOut() {
    if (fontSize > 50) {
      fontSize -= 10;
      updateZoom();
    }
  }

  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
  }

  // ================== EVENTOS ==================
  if (darkModeBtn) darkModeBtn.addEventListener("click", toggleDarkMode);

  if (hamburger && closeMenu && sidebar) {
    hamburger.addEventListener("click", () => {
      sidebar.classList.add("active");
      hamburger.style.display = "none";
      closeMenu.style.display = "block";
    });

    closeMenu.addEventListener("click", () => {
      sidebar.classList.remove("active");
      closeMenu.style.display = "none";
      hamburger.style.display = "block";
    });

    sidebar.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        sidebar.classList.remove("active");
        closeMenu.style.display = "none";
        hamburger.style.display = "block";
      });
    });
  }

  // Inicializa no 100%
  updateZoom();

  }, 100);

}
