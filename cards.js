/**
 * cards.js
 * -----------------------------------------------------------------------
 * منطق إدارة البطاقات: CRUD, Search, Filter, Rendering, QR Code
 * -----------------------------------------------------------------------
 */

const CardService = {
  getAll() {
    // نعيد حساب الحالة تلقائيًا حسب تاريخ الانتهاء في كل قراءة
    const cards = Storage.getCards();
    let changed = false;
    cards.forEach((c) => {
      const computed = computeStatus(c);
      if (computed !== c.status) {
        c.status = computed;
        changed = true;
      }
    });
    if (changed) Storage.saveCards(cards);
    return cards;
  },

  getById(id) {
    return this.getAll().find((c) => c.id === id) || null;
  },

  getByCardNumber(cardNumber) {
    return this.getAll().find((c) => c.cardNumber.toLowerCase() === String(cardNumber).trim().toLowerCase()) || null;
  },

  getByOwnerId(ownerId) {
    return this.getAll().find((c) => c.ownerId === ownerId) || null;
  },

  validate(data) {
    const errors = [];
    if (!data.fullName || data.fullName.trim().length < 3) errors.push("الاسم الكامل مطلوب (3 أحرف على الأقل)");
    if (!data.phone || data.phone.trim().length < 9) errors.push("رقم الهاتف غير صحيح");
    if (!data.email || !Auth.isValidEmail(data.email)) errors.push("صيغة البريد الإلكتروني غير صحيحة");
    if (!data.dateOfBirth) errors.push("تاريخ الميلاد مطلوب");
    if (!data.address || data.address.trim().length < 3) errors.push("العنوان مطلوب");
    if (!data.jobTitle) errors.push("المسمى الوظيفي مطلوب");
    if (!data.department) errors.push("القسم مطلوب");
    if (!data.issueDate) errors.push("تاريخ الإصدار مطلوب");
    if (!data.expiryDate) errors.push("تاريخ الانتهاء مطلوب");
    if (data.issueDate && data.expiryDate && new Date(data.expiryDate) <= new Date(data.issueDate)) {
      errors.push("تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار");
    }
    return errors;
  },

  create(data) {
    const errors = this.validate(data);
    if (errors.length) return { success: false, errors };

    const cards = Storage.getCards();
    const now = new Date().toISOString();
    const newCard = {
      id: generateId("card"),
      cardNumber: generateCardNumber(),
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      dateOfBirth: data.dateOfBirth,
      address: data.address.trim(),
      jobTitle: data.jobTitle.trim(),
      department: data.department.trim(),
      photo: data.photo || "",
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      status: "active",
      createdAt: now,
      updatedAt: now,
      ownerId: data.ownerId || null,
    };
    newCard.status = computeStatus(newCard);
    cards.push(newCard);
    Storage.saveCards(cards);
    addLog("Card Created", `إنشاء بطاقة رقم ${newCard.cardNumber} باسم ${newCard.fullName}`);
    return { success: true, card: newCard };
  },

  update(id, data) {
    const errors = this.validate(data);
    if (errors.length) return { success: false, errors };

    const cards = Storage.getCards();
    const idx = cards.findIndex((c) => c.id === id);
    if (idx === -1) return { success: false, errors: ["البطاقة غير موجودة"] };

    const updated = {
      ...cards[idx],
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      dateOfBirth: data.dateOfBirth,
      address: data.address.trim(),
      jobTitle: data.jobTitle.trim(),
      department: data.department.trim(),
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      updatedAt: new Date().toISOString(),
    };
    if (data.photo) updated.photo = data.photo;
    if (data.status) updated.status = data.status;
    updated.status = computeStatus(updated);

    cards[idx] = updated;
    Storage.saveCards(cards);
    addLog("Card Updated", `تعديل بيانات البطاقة رقم ${updated.cardNumber}`);
    return { success: true, card: updated };
  },

  setStatus(id, status) {
    const cards = Storage.getCards();
    const idx = cards.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    cards[idx].status = status;
    cards[idx].updatedAt = new Date().toISOString();
    Storage.saveCards(cards);
    addLog("Card Status Changed", `تغيير حالة البطاقة ${cards[idx].cardNumber} إلى ${statusLabel(status)}`);
    return true;
  },

  delete(id) {
    const cards = Storage.getCards();
    const card = cards.find((c) => c.id === id);
    const filtered = cards.filter((c) => c.id !== id);
    Storage.saveCards(filtered);
    if (card) addLog("Card Deleted", `حذف البطاقة رقم ${card.cardNumber}`);
    return true;
  },

  search(list, query) {
    if (!query) return list;
    const q = query.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.cardNumber.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  },

  filterByStatus(list, status) {
    if (!status || status === "all") return list;
    return list.filter((c) => c.status === status);
  },
};

/* ========================= Rendering Helpers ============================ */

/** يبني صف جدول واحد لبطاقة */
function cardTableRow(card, options = {}) {
  const { showActions = true } = options;
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="mono"></td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td><span class="badge badge--${card.status}"></span></td>
    ${showActions ? '<td class="table-actions"></td>' : ""}
  `;
  const cells = tr.querySelectorAll("td");
  cells[0].textContent = card.cardNumber;
  cells[1].textContent = card.fullName;
  cells[2].textContent = card.jobTitle;
  cells[3].textContent = card.issueDate;
  cells[4].textContent = card.expiryDate;
  cells[5].querySelector(".badge").textContent = statusLabel(card.status);

  if (showActions) {
    const actionsCell = cells[6];
    const viewBtn = document.createElement("a");
    viewBtn.href = `card-details.html?id=${encodeURIComponent(card.id)}`;
    viewBtn.className = "icon-btn icon-btn--view";
    viewBtn.title = "عرض";
    viewBtn.textContent = "👁";

    const editBtn = document.createElement("a");
    editBtn.href = `add-card.html?edit=${encodeURIComponent(card.id)}`;
    editBtn.className = "icon-btn icon-btn--edit";
    editBtn.title = "تعديل";
    editBtn.textContent = "✎";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn icon-btn--delete";
    deleteBtn.title = "حذف";
    deleteBtn.textContent = "🗑";
    deleteBtn.addEventListener("click", async () => {
      const ok = await confirmDialog(`هل أنت متأكد من حذف البطاقة رقم ${card.cardNumber}؟ لا يمكن التراجع عن هذا الإجراء.`, "حذف البطاقة");
      if (!ok) return;
      CardService.delete(card.id);
      showToast("تم حذف البطاقة بنجاح", "success");
      tr.remove();
      if (typeof window.onCardListChanged === "function") window.onCardListChanged();
    });

    actionsCell.append(viewBtn, editBtn, deleteBtn);
  }
  return tr;
}

/** يعرض قائمة بطاقات داخل جدول (tbody) */
function renderCardsTable(tbody, cards, emptyContainer) {
  tbody.innerHTML = "";
  if (!cards.length) {
    if (emptyContainer) emptyContainer.innerHTML = emptyStateHTML("لا توجد بطاقات مطابقة", "🪪");
    if (emptyContainer) emptyContainer.style.display = "block";
    return;
  }
  if (emptyContainer) emptyContainer.style.display = "none";
  cards.forEach((card) => tbody.appendChild(cardTableRow(card)));
}

/* ============================= QR Code =================================== */
/**
 * يرسم QR Code داخل عنصر معين باستخدام مكتبة qrcodejs (عبر CDN).
 * محتوى الرمز هو رابط صفحة التحقق مع رقم البطاقة.
 */
function renderQRCode(containerEl, cardNumber) {
  containerEl.innerHTML = "";
  const verifyUrl = `verify.html?id=${encodeURIComponent(cardNumber)}`;
  if (typeof QRCode === "undefined") {
    containerEl.innerHTML = `<div class="qr-fallback">QR: ${sanitizeText(cardNumber)}</div>`;
    return;
  }
  // eslint-disable-next-line no-new
  new QRCode(containerEl, {
    text: verifyUrl,
    width: 110,
    height: 110,
    colorDark: "#0A1220",
    colorLight: "#F4EFE4",
    correctLevel: QRCode.CorrectLevel.M,
  });
}

/* =========================== ID Card Markup ================================ */
/** يبني HTML بطاقة الهوية (الوجه) لإدراجه داخل حاوية */
function idCardFrontHTML(card) {
  const photo = card.photo
    ? `<img src="${card.photo}" alt="صورة ${sanitizeText(card.fullName)}" class="id-card__photo-img" />`
    : `<div class="id-card__photo-placeholder">👤</div>`;
  return `
    <div class="id-card__top">
      <div class="id-card__brand">
        <span class="id-card__brand-icon">🛡</span>
        <div>
          <div class="id-card__brand-title">DIGITAL ID</div>
          <div class="id-card__brand-sub">Smart Identity System</div>
        </div>
      </div>
      <span class="badge badge--${card.status}">${statusLabel(card.status)}</span>
    </div>
    <div class="id-card__body">
      <div class="id-card__photo">${photo}</div>
      <div class="id-card__info">
        <div class="id-card__name"></div>
        <div class="id-card__job"></div>
        <div class="id-card__dept"></div>
        <div class="id-card__number mono"></div>
      </div>
    </div>
    <div class="id-card__footer">
      <div>
        <div class="id-card__label">تاريخ الإصدار</div>
        <div class="id-card__value"></div>
      </div>
      <div>
        <div class="id-card__label">تاريخ الانتهاء</div>
        <div class="id-card__value"></div>
      </div>
    </div>
  `;
}

/** يملأ الحقول النصية داخل بطاقة تم إدراجها بالفعل في الصفحة (لتفادي innerHTML للبيانات) */
function fillIdCardFront(container, card) {
  container.querySelector(".id-card__name").textContent = card.fullName;
  container.querySelector(".id-card__job").textContent = card.jobTitle;
  container.querySelector(".id-card__dept").textContent = card.department;
  container.querySelector(".id-card__number").textContent = card.cardNumber;
  const values = container.querySelectorAll(".id-card__value");
  values[0].textContent = card.issueDate;
  values[1].textContent = card.expiryDate;
}

function idCardBackHTML(card) {
  return `
    <div class="id-card__back-header">
      <span class="id-card__brand-icon">🛡</span>
      <span>Digital Identity & Smart Cards</span>
    </div>
    <div class="id-card__back-row"><span>الهاتف</span><b class="mono"></b></div>
    <div class="id-card__back-row"><span>البريد الإلكتروني</span><b class="mono"></b></div>
    <div class="id-card__back-row"><span>العنوان</span><b></b></div>
    <div class="id-card__qr-wrap">
      <div class="id-card__qr" data-qr></div>
      <p class="id-card__qr-caption">امسح الرمز للتحقق من صحة البطاقة</p>
    </div>
  `;
}

function fillIdCardBack(container, card) {
  const rows = container.querySelectorAll(".id-card__back-row b");
  rows[0].textContent = card.phone;
  rows[1].textContent = card.email;
  rows[2].textContent = card.address;
}
