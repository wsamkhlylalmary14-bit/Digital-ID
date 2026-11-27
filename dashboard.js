/**
 * dashboard.js
 * -----------------------------------------------------------------------
 * إحصائيات لوحة التحكم + منطق الشريط الجانبي المشترك في صفحات الإدارة
 * -----------------------------------------------------------------------
 */

const DashboardStats = {
  compute() {
    const cards = CardService.getAll();
    const users = UserService.getAll();
    const logs = Storage.getLogs();

    return {
      totalCards: cards.length,
      activeCards: cards.filter((c) => c.status === "active").length,
      expiredCards: cards.filter((c) => c.status === "expired").length,
      suspendedCards: cards.filter((c) => c.status === "suspended").length,
      totalUsers: users.length,
      verifications: logs.filter((l) => l.action === "Card Verified" || l.action === "Failed Verification").length,
    };
  },
};

/** يبني الشريط الجانبي المشترك لصفحات لوحة التحكم */
function buildSidebar(activePage) {
  const container = document.querySelector("[data-sidebar]");
  if (!container) return;
  const session = Session.current();
  if (!session) return;

  const isAdmin = session.role === "admin";
  const isEmployee = session.role === "employee";

  const adminLinks = [
    { href: "dashboard.html", label: "الرئيسية", icon: "📊", key: "dashboard" },
    { href: "cards.html", label: "البطاقات", icon: "🪪", key: "cards" },
    { href: "add-card.html", label: "إضافة بطاقة", icon: "➕", key: "add-card" },
    { href: "users.html", label: "المستخدمون", icon: "👥", key: "users" },
    { href: "verify.html", label: "التحقق", icon: "✅", key: "verify" },
    { href: "logs.html", label: "السجلات", icon: "🗒", key: "logs" },
    { href: "settings.html", label: "الإعدادات", icon: "⚙", key: "settings" },
  ];

  const employeeLinks = [
    { href: "verify.html", label: "التحقق من بطاقة", icon: "✅", key: "verify" },
    { href: "logs.html", label: "سجل عمليات التحقق", icon: "🗒", key: "logs" },
    { href: "settings.html", label: "الإعدادات", icon: "⚙", key: "settings" },
  ];

  const userLinks = [
    { href: "profile.html", label: "ملفي الشخصي", icon: "🪪", key: "profile" },
    { href: "add-card.html", label: "بطاقتي", icon: "➕", key: "add-card" },
    { href: "verify.html", label: "التحقق من بطاقة", icon: "✅", key: "verify" },
    { href: "settings.html", label: "الإعدادات", icon: "⚙", key: "settings" },
  ];

  const links = isAdmin ? adminLinks : isEmployee ? employeeLinks : userLinks;

  container.innerHTML = `
    <div class="sidebar__brand">
      <span class="sidebar__brand-icon">🛡</span>
      <div>
        <div class="sidebar__brand-title">Digital ID</div>
        <div class="sidebar__brand-sub">${isAdmin ? "لوحة المدير" : isEmployee ? "لوحة الموظف" : "حسابي"}</div>
      </div>
    </div>
    <nav class="sidebar__nav">
      ${links
        .map(
          (l) => `
        <a href="${l.href}" class="sidebar__link ${l.key === activePage ? "is-active" : ""}">
          <span class="sidebar__icon">${l.icon}</span>
          <span>${l.label}</span>
        </a>`
        )
        .join("")}
    </nav>
    <div class="sidebar__footer">
      <div class="sidebar__user">
        <span class="sidebar__user-avatar">${session.fullName.charAt(0)}</span>
        <div>
          <div class="sidebar__user-name"></div>
          <div class="sidebar__user-role"></div>
        </div>
      </div>
      <button class="btn btn--ghost btn--block" data-sidebar-logout>تسجيل الخروج</button>
    </div>
  `;
  container.querySelector(".sidebar__user-name").textContent = session.fullName;
  container.querySelector(".sidebar__user-role").textContent = UserService.roleLabel(session.role);
  container.querySelector("[data-sidebar-logout]").addEventListener("click", () => {
    Auth.logout();
    showToast("تم تسجيل الخروج بنجاح", "success");
    setTimeout(() => (window.location.href = "login.html"), 500);
  });
}

/** يعرض أحدث سجلات العمليات داخل جدول */
function renderLogsTable(tbody, logs, emptyContainer) {
  tbody.innerHTML = "";
  if (!logs.length) {
    if (emptyContainer) {
      emptyContainer.innerHTML = emptyStateHTML("لا توجد عمليات مسجلة بعد", "🗒");
      emptyContainer.style.display = "block";
    }
    return;
  }
  if (emptyContainer) emptyContainer.style.display = "none";
  const users = UserService.getAll();
  logs.forEach((log) => {
    const owner = users.find((u) => u.id === log.userId);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="mono"></td><td></td><td></td><td></td><td></td>`;
    const cells = tr.querySelectorAll("td");
    cells[0].textContent = log.action;
    cells[1].textContent = log.description;
    cells[2].textContent = owner ? owner.fullName : log.userId === "guest" ? "زائر" : log.userId;
    cells[3].textContent = log.date;
    cells[4].textContent = log.time;
    tbody.appendChild(tr);
  });
}
