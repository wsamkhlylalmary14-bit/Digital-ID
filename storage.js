/**
 * storage.js
 * -----------------------------------------------------------------------
 * طبقة التخزين الخاصة بالمشروع.
 *
 * ملاحظة تعليمية مهمة:
 * هذا المشروع Front-End تعليمي بالكامل. نستخدم localStorage لمحاكاة
 * قاعدة بيانات حقيقية، لكن localStorage ليس نظام أمان حقيقيًا:
 *  - أي شخص يملك وصولًا للمتصفح يستطيع قراءة أو تعديل البيانات المخزنة.
 *  - لا يجب أبدًا تخزين كلمات المرور بهذه الطريقة في تطبيق Production حقيقي.
 * في نظام حقيقي، تُدار كلمات المرور والصلاحيات من خلال Backend آمن
 * (Hashing، Sessions، HTTPS، Database محمية...الخ).
 * -----------------------------------------------------------------------
 */

const DB_KEYS = {
  USERS: "diasc_users",
  CARDS: "diasc_cards",
  LOGS: "diasc_logs",
  SEEDED: "diasc_seeded_v1",
  COUNTERS: "diasc_counters",
};

const Storage = {
  /** قراءة مصفوفة من localStorage بأمان */
  read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error(`تعذّرت قراءة المفتاح ${key}`, e);
      return [];
    }
  },

  /** كتابة قيمة في localStorage */
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`تعذّرت الكتابة في المفتاح ${key}`, e);
      return false;
    }
  },

  getUsers() {
    return this.read(DB_KEYS.USERS);
  },
  saveUsers(users) {
    return this.write(DB_KEYS.USERS, users);
  },

  getCards() {
    return this.read(DB_KEYS.CARDS);
  },
  saveCards(cards) {
    return this.write(DB_KEYS.CARDS, cards);
  },

  getLogs() {
    return this.read(DB_KEYS.LOGS);
  },
  saveLogs(logs) {
    return this.write(DB_KEYS.LOGS, logs);
  },

  getCounters() {
    const raw = localStorage.getItem(DB_KEYS.COUNTERS);
    return raw ? JSON.parse(raw) : { card: 0 };
  },
  saveCounters(counters) {
    this.write(DB_KEYS.COUNTERS, counters);
  },
};

/** توليد معرّف فريد بسيط */
function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

/** توليد رقم بطاقة فريد بصيغة CARD-YYYY-00001 */
function generateCardNumber() {
  const counters = Storage.getCounters();
  counters.card = (counters.card || 0) + 1;
  Storage.saveCounters(counters);
  const year = new Date().getFullYear();
  const padded = String(counters.card).padStart(5, "0");
  return `CARD-${year}-${padded}`;
}

/** إضافة سجل عملية جديد إلى Activity Log */
function addLog(action, description, userId = null) {
  const logs = Storage.getLogs();
  const now = new Date();
  const entry = {
    id: generateId("log"),
    userId: userId || (Session.current() ? Session.current().userId : "guest"),
    action,
    description,
    date: now.toLocaleDateString("ar-EG"),
    time: now.toLocaleTimeString("ar-EG"),
    timestamp: now.getTime(),
  };
  logs.unshift(entry);
  // نحتفظ بآخر 500 سجل فقط لتفادي امتلاء localStorage
  Storage.saveLogs(logs.slice(0, 500));
  return entry;
}

/**
 * تنظيف نص من أي وسوم HTML قبل عرضه (حماية بسيطة من XSS)
 * نستخدم هذه الدالة كلما احتجنا لإدراج نص داخل innerHTML.
 */
function sanitizeText(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

/** تنسيق حالة البطاقة إلى نص عربي */
function statusLabel(status) {
  const map = {
    active: "فعالة",
    expired: "منتهية",
    suspended: "موقوفة",
  };
  return map[status] || status;
}

/** إعادة حساب حالة البطاقة تلقائيًا بناءً على تاريخ الانتهاء (ما لم تكن موقوفة يدويًا) */
function computeStatus(card) {
  if (card.status === "suspended") return "suspended";
  const today = new Date();
  const expiry = new Date(card.expiryDate);
  if (expiry < today) return "expired";
  return "active";
}

/* =========================================================================
 * تهيئة البيانات التجريبية عند أول تشغيل للمشروع
 * ========================================================================= */
function seedDatabase() {
  if (localStorage.getItem(DB_KEYS.SEEDED)) return;

  const now = new Date().toISOString();

  // ---- حساب المدير التجريبي ----
  const adminUser = {
    id: generateId("usr"),
    fullName: "مدير النظام",
    email: "admin@digitalid.com",
    phone: "0500000000",
    password: "Admin@123", // تجريبي فقط - انظر التنبيه أعلى الملف
    role: "admin",
    status: "active",
    createdAt: now,
  };

  // ---- موظف تجريبي ----
  const employeeUser = {
    id: generateId("usr"),
    fullName: "أحمد الموظف",
    email: "employee@digitalid.com",
    phone: "0511111111",
    password: "Employee@123",
    role: "employee",
    status: "active",
    createdAt: now,
  };

  // ---- مستخدمون تجريبيون (User) ----
  const sampleNames = [
    "سارة عبدالله",
    "محمد الحربي",
    "ليان القحطاني",
    "خالد الشمري",
    "منى الزهراني",
  ];
  const departments = ["تقنية المعلومات", "الموارد البشرية", "المالية", "الأمن السيبراني", "خدمة العملاء"];
  const jobs = ["مطور برمجيات", "محلل بيانات", "أخصائي أمن معلومات", "محاسب", "موظف دعم فني"];

  const users = [adminUser, employeeUser];
  sampleNames.forEach((name, i) => {
    users.push({
      id: generateId("usr"),
      fullName: name,
      email: `user${i + 1}@digitalid.com`,
      phone: `05${20000000 + i * 111}`,
      password: "User@123",
      role: "user",
      status: "active",
      createdAt: now,
    });
  });
  Storage.saveUsers(users);

  // ---- بطاقات تجريبية ----
  const cards = [];
  const statuses = ["active", "active", "active", "active", "expired", "expired", "suspended", "active", "active", "expired"];
  const normalUsers = users.filter((u) => u.role === "user");

  for (let i = 0; i < 10; i++) {
    const issue = new Date();
    issue.setFullYear(issue.getFullYear() - 1);
    const expiry = new Date();
    // بعض البطاقات منتهية فعليًا، والبعض فعال
    if (statuses[i] === "expired") {
      expiry.setFullYear(expiry.getFullYear() - 1);
    } else {
      expiry.setFullYear(expiry.getFullYear() + 2);
    }
    const owner = normalUsers[i % normalUsers.length];
    const cardNumber = generateCardNumber();
    cards.push({
      id: generateId("card"),
      cardNumber,
      fullName: owner ? owner.fullName : `مستخدم ${i + 1}`,
      phone: owner ? owner.phone : "0500000000",
      email: owner ? owner.email : `card${i}@digitalid.com`,
      dateOfBirth: "1998-05-14",
      address: "الرياض، المملكة العربية السعودية",
      jobTitle: jobs[i % jobs.length],
      department: departments[i % departments.length],
      photo: "",
      issueDate: issue.toISOString().slice(0, 10),
      expiryDate: expiry.toISOString().slice(0, 10),
      status: statuses[i],
      createdAt: now,
      updatedAt: now,
      ownerId: owner ? owner.id : null,
    });
  }
  Storage.saveCards(cards);

  // ---- سجلات تجريبية ----
  const logs = [
    {
      id: generateId("log"),
      userId: adminUser.id,
      action: "System Init",
      description: "تم تهيئة النظام بالبيانات التجريبية",
      date: new Date().toLocaleDateString("ar-EG"),
      time: new Date().toLocaleTimeString("ar-EG"),
      timestamp: Date.now(),
    },
  ];
  Storage.saveLogs(logs);

  localStorage.setItem(DB_KEYS.SEEDED, "true");
}

seedDatabase();
