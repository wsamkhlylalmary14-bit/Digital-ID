/**
 * app.js
 * -----------------------------------------------------------------------
 * أدوات واجهة مستخدم مشتركة بين جميع الصفحات:
 * Toast Notifications, Confirm Dialog, Mobile Menu, Theme (Light/Dark)
 * -----------------------------------------------------------------------
 */

/* ============================= Toast ================================= */
function ensureToastContainer() {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }
  return container;
}

/**
 * showToast(message, type)
 * type: 'success' | 'error' | 'warning' | 'info'
 */
function showToast(message, type = "info") {
  const container = ensureToastContainer();
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] || icons.info}</span>
    <span class="toast__message"></span>
    <button class="toast__close" aria-label="إغلاق">&times;</button>
  `;
  toast.querySelector(".toast__message").textContent = message;
  container.appendChild(toast);

  const remove = () => {
    toast.classList.add("toast--hide");
    setTimeout(() => toast.remove(), 250);
  };
  toast.querySelector(".toast__close").addEventListener("click", remove);
  setTimeout(remove, 4000);
}

/* =========================== Confirm Dialog ============================ */
/**
 * confirmDialog(message) -> Promise<boolean>
 * يعرض نافذة تأكيد مخصصة بدل confirm() الافتراضية للمتصفح.
 */
function confirmDialog(message, title = "تأكيد العملية") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box" role="alertdialog" aria-modal="true">
        <h3 class="modal-box__title"></h3>
        <p class="modal-box__message"></p>
        <div class="modal-box__actions">
          <button class="btn btn--ghost" data-action="cancel">إلغاء</button>
          <button class="btn btn--danger" data-action="confirm">تأكيد</button>
        </div>
      </div>
    `;
    overlay.querySelector(".modal-box__title").textContent = title;
    overlay.querySelector(".modal-box__message").textContent = message;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    function cleanup(result) {
      overlay.remove();
      document.body.style.overflow = "";
      resolve(result);
    }
    overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => cleanup(false));
    overlay.querySelector('[data-action="confirm"]').addEventListener("click", () => cleanup(true));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(false);
    });
  });
}

/* ============================= Theme =================================== */
const THEME_KEY = "diasc_theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(saved);
}

function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}

/* =========================== Mobile Menu ================================ */
function initMobileMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav-menu]");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    nav.classList.toggle("is-open");
    toggle.classList.toggle("is-active");
  });
}

function initSidebarMobile() {
  const toggle = document.querySelector("[data-sidebar-toggle]");
  const sidebar = document.querySelector("[data-sidebar]");
  if (!toggle || !sidebar) return;
  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("is-open");
  });
  document.addEventListener("click", (e) => {
    if (
      sidebar.classList.contains("is-open") &&
      !sidebar.contains(e.target) &&
      !toggle.contains(e.target)
    ) {
      sidebar.classList.remove("is-open");
    }
  });
}

/* ========================= Navbar Auth State ============================ */
/** يحدّث الـ Navbar في الصفحات العامة حسب حالة تسجيل الدخول */
function refreshPublicNavbar() {
  const authArea = document.querySelector("[data-navbar-auth]");
  if (!authArea) return;
  const session = typeof Session !== "undefined" ? Session.current() : null;
  if (session) {
    const dashboardLink =
      session.role === "admin" ? "dashboard.html" : session.role === "employee" ? "verify.html" : "profile.html";
    authArea.innerHTML = `
      <a href="${dashboardLink}" class="btn btn--ghost">حسابي</a>
      <button class="btn btn--primary" data-logout>تسجيل الخروج</button>
    `;
    authArea.querySelector("[data-logout]").addEventListener("click", () => {
      Auth.logout();
      showToast("تم تسجيل الخروج بنجاح", "success");
      setTimeout(() => window.location.reload(), 600);
    });
  } else {
    authArea.innerHTML = `
      <a href="login.html" class="btn btn--ghost">تسجيل الدخول</a>
      <a href="register.html" class="btn btn--primary">إنشاء حساب</a>
    `;
  }
}

/* ============================ Empty State ================================ */
function emptyStateHTML(message, icon = "🗂") {
  return `
    <div class="empty-state">
      <div class="empty-state__icon">${icon}</div>
      <p class="empty-state__text"></p>
    </div>
  `.replace("<p class=\"empty-state__text\"></p>", `<p class="empty-state__text">${sanitizeText(message)}</p>`);
}

/* ============================ Init on load =============================== */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileMenu();
  initSidebarMobile();
  refreshPublicNavbar();

  const yearEls = document.querySelectorAll("[data-year]");
  yearEls.forEach((el) => (el.textContent = new Date().getFullYear()));

  const themeToggleBtns = document.querySelectorAll("[data-theme-toggle]");
  themeToggleBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      toggleTheme();
    })
  );
});
