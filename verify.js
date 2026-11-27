/**
 * verify.js
 * -----------------------------------------------------------------------
 * منطق صفحة التحقق من البطاقة (verify.html)
 * -----------------------------------------------------------------------
 */

function runVerification(cardNumber, resultContainer) {
  resultContainer.innerHTML = "";
  resultContainer.classList.remove("is-visible");

  if (!cardNumber || !cardNumber.trim()) {
    showToast("يرجى إدخال رقم البطاقة", "warning");
    return;
  }

  const card = CardService.getByCardNumber(cardNumber.trim());

  if (!card) {
    addLog("Failed Verification", `محاولة تحقق من رقم بطاقة غير موجود: ${cardNumber}`);
    resultContainer.innerHTML = verifyResultHTML({
      state: "not-found",
      title: "✕ البطاقة غير موجودة",
      message: "لم يتم العثور على أي بطاقة بهذا الرقم في النظام.",
    });
    resultContainer.classList.add("is-visible");
    return;
  }

  if (card.status === "active") {
    addLog("Card Verified", `تحقق ناجح من البطاقة رقم ${card.cardNumber}`);
    resultContainer.innerHTML = verifyResultHTML({
      state: "active",
      title: "✓ البطاقة صحيحة وفعالة",
      card,
    });
  } else if (card.status === "expired") {
    addLog("Card Verified", `تحقق من بطاقة منتهية رقم ${card.cardNumber}`);
    resultContainer.innerHTML = verifyResultHTML({
      state: "expired",
      title: "⚠ البطاقة منتهية الصلاحية",
      card,
    });
  } else {
    addLog("Card Verified", `تحقق من بطاقة موقوفة رقم ${card.cardNumber}`);
    resultContainer.innerHTML = verifyResultHTML({
      state: "suspended",
      title: "✕ البطاقة موقوفة",
      card,
    });
  }
  resultContainer.classList.add("is-visible");
  fillVerifyResultData(resultContainer, card);
}

function verifyResultHTML({ state, title, message, card }) {
  if (!card) {
    return `
      <div class="verify-result verify-result--${state}">
        <div class="verify-result__title">${title}</div>
        <p class="verify-result__message"></p>
      </div>
    `.replace('<p class="verify-result__message"></p>', `<p class="verify-result__message">${sanitizeText(message)}</p>`);
  }
  return `
    <div class="verify-result verify-result--${state}">
      <div class="verify-result__title">${title}</div>
      <div class="verify-result__grid">
        <div><span>الاسم</span><b data-f="fullName"></b></div>
        <div><span>رقم البطاقة</span><b class="mono" data-f="cardNumber"></b></div>
        <div><span>المسمى الوظيفي</span><b data-f="jobTitle"></b></div>
        <div><span>القسم</span><b data-f="department"></b></div>
        <div><span>تاريخ الإصدار</span><b data-f="issueDate"></b></div>
        <div><span>تاريخ الانتهاء</span><b data-f="expiryDate"></b></div>
        <div><span>الحالة</span><b><span class="badge badge--${card.status}" data-f="statusLabel"></span></b></div>
      </div>
    </div>
  `;
}

function fillVerifyResultData(container, card) {
  container.querySelector('[data-f="fullName"]').textContent = card.fullName;
  container.querySelector('[data-f="cardNumber"]').textContent = card.cardNumber;
  container.querySelector('[data-f="jobTitle"]').textContent = card.jobTitle;
  container.querySelector('[data-f="department"]').textContent = card.department;
  container.querySelector('[data-f="issueDate"]').textContent = card.issueDate;
  container.querySelector('[data-f="expiryDate"]').textContent = card.expiryDate;
  const statusEl = container.querySelector('[data-f="statusLabel"]');
  if (statusEl) statusEl.textContent = statusLabel(card.status);
}
