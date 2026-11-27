/**
 * users.js
 * -----------------------------------------------------------------------
 * منطق إدارة المستخدمين (خاص بالمدير Admin)
 * -----------------------------------------------------------------------
 */

const UserService = {
  getAll() {
    return Storage.getUsers();
  },

  getById(id) {
    return this.getAll().find((u) => u.id === id) || null;
  },

  search(list, query) {
    if (!query) return list;
    const q = query.trim().toLowerCase();
    return list.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
    );
  },

  filterByRole(list, role) {
    if (!role || role === "all") return list;
    return list.filter((u) => u.role === role);
  },

  update(id, data) {
    const users = Storage.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return { success: false };
    users[idx] = { ...users[idx], ...data };
    Storage.saveUsers(users);
    addLog("User Updated", `تحديث بيانات المستخدم: ${users[idx].fullName}`);
    return { success: true, user: users[idx] };
  },

  setStatus(id, status) {
    return this.update(id, { status });
  },

  delete(id) {
    const users = Storage.getUsers();
    const user = users.find((u) => u.id === id);
    if (user && user.role === "admin") {
      return { success: false, message: "لا يمكن حذف حساب المدير" };
    }
    const filtered = users.filter((u) => u.id !== id);
    Storage.saveUsers(filtered);
    if (user) addLog("User Deleted", `حذف المستخدم: ${user.fullName}`);
    return { success: true };
  },

  roleLabel(role) {
    const map = { admin: "مدير", employee: "موظف", user: "مستخدم" };
    return map[role] || role;
  },
};

function userTableRow(user) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td></td>
    <td class="mono"></td>
    <td class="mono"></td>
    <td><span class="badge badge--role"></span></td>
    <td></td>
    <td><span class="badge badge--${user.status}"></span></td>
    <td class="table-actions"></td>
  `;
  const cells = tr.querySelectorAll("td");
  cells[0].textContent = user.fullName;
  cells[1].textContent = user.email;
  cells[2].textContent = user.phone;
  cells[3].querySelector(".badge").textContent = UserService.roleLabel(user.role);
  cells[4].textContent = new Date(user.createdAt).toLocaleDateString("ar-EG");
  cells[5].querySelector(".badge").textContent = user.status === "active" ? "نشط" : "موقوف";

  const actionsCell = cells[6];
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "icon-btn";
  toggleBtn.title = user.status === "active" ? "إيقاف الحساب" : "تفعيل الحساب";
  toggleBtn.textContent = user.status === "active" ? "⏸" : "▶";
  toggleBtn.addEventListener("click", async () => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    const ok = await confirmDialog(
      `هل تريد ${nextStatus === "active" ? "تفعيل" : "إيقاف"} حساب ${user.fullName}؟`,
      "تغيير حالة الحساب"
    );
    if (!ok) return;
    UserService.setStatus(user.id, nextStatus);
    showToast("تم تحديث حالة الحساب", "success");
    if (typeof window.onUserListChanged === "function") window.onUserListChanged();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "icon-btn icon-btn--delete";
  deleteBtn.title = "حذف";
  deleteBtn.textContent = "🗑";
  deleteBtn.disabled = user.role === "admin";
  deleteBtn.addEventListener("click", async () => {
    const ok = await confirmDialog(`هل أنت متأكد من حذف المستخدم ${user.fullName}؟`, "حذف المستخدم");
    if (!ok) return;
    const result = UserService.delete(user.id);
    if (!result.success) {
      showToast(result.message || "تعذّر الحذف", "error");
      return;
    }
    showToast("تم حذف المستخدم بنجاح", "success");
    if (typeof window.onUserListChanged === "function") window.onUserListChanged();
  });

  actionsCell.append(toggleBtn, deleteBtn);
  return tr;
}

function renderUsersTable(tbody, users, emptyContainer) {
  tbody.innerHTML = "";
  if (!users.length) {
    if (emptyContainer) {
      emptyContainer.innerHTML = emptyStateHTML("لا يوجد مستخدمون مطابقون", "👥");
      emptyContainer.style.display = "block";
    }
    return;
  }
  if (emptyContainer) emptyContainer.style.display = "none";
  users.forEach((u) => tbody.appendChild(userTableRow(u)));
}
