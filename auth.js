/**
 * auth.js
 * -----------------------------------------------------------------------
 * محاكاة نظام تسجيل الدخول والصلاحيات (Authentication / Authorization
 * Simulation) بالكامل داخل Front-End باستخدام sessionStorage للجلسة
 * الحالية و localStorage لتخزين المستخدمين.
 * -----------------------------------------------------------------------
 */

const SESSION_KEY = "diasc_session";

const Session = {
  /** إرجاع بيانات الجلسة الحالية أو null */
  current() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /** بدء جلسة جديدة بعد تسجيل الدخول */
  start(user, remember) {
    const payload = {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    if (remember) {
      // "تذكرني" التجريبي: نخزن البريد فقط (وليس كلمة المرور) لتسهيل التعبئة لاحقًا
      localStorage.setItem("diasc_remembered_email", user.email);
    } else {
      localStorage.removeItem("diasc_remembered_email");
    }
    return payload;
  },

  end() {
    sessionStorage.removeItem(SESSION_KEY);
  },

  isLoggedIn() {
    return this.current() !== null;
  },
};

const Auth = {
  /** تحقق من صحة صيغة البريد الإلكتروني */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /** تحقق من قوة كلمة المرور: 8 أحرف على الأقل، حرف وحرف كبير ورقم */
  isStrongPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  },

  /** تسجيل مستخدم جديد */
  register({ fullName, email, phone, password, confirmPassword }) {
    const errors = [];
    if (!fullName || fullName.trim().length < 3) errors.push("الاسم الكامل يجب أن يحتوي على 3 أحرف على الأقل");
    if (!this.isValidEmail(email)) errors.push("صيغة البريد الإلكتروني غير صحيحة");
    if (!phone || phone.trim().length < 9) errors.push("رقم الهاتف غير صحيح");
    if (!this.isStrongPassword(password)) {
      errors.push("كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل وحرف كبير وحرف صغير ورقم");
    }
    if (password !== confirmPassword) errors.push("كلمتا المرور غير متطابقتين");

    const users = Storage.getUsers();
    if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
      errors.push("هذا البريد الإلكتروني مسجل مسبقًا");
    }

    if (errors.length) return { success: false, errors };

    const newUser = {
      id: generateId("usr"),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password, // تعليمي فقط - انظر التنبيه في storage.js
      role: "user",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    Storage.saveUsers(users);
    addLog("User Register", `تسجيل حساب جديد: ${newUser.fullName}`, newUser.id);
    return { success: true, user: newUser };
  },

  /** تسجيل الدخول */
  login(email, password, remember) {
    const users = Storage.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

    if (!user || user.password !== password) {
      addLog("Failed Login", `محاولة دخول فاشلة بالبريد: ${email}`, "guest");
      return { success: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }
    if (user.status === "suspended") {
      addLog("Failed Login", `محاولة دخول لحساب موقوف: ${email}`, user.id);
      return { success: false, message: "هذا الحساب موقوف، يرجى التواصل مع الإدارة" };
    }

    Session.start(user, remember);
    addLog("User Login", `تسجيل دخول: ${user.fullName} (${user.role})`, user.id);
    return { success: true, user };
  },

  logout() {
    const session = Session.current();
    if (session) {
      addLog("Logout", `تسجيل خروج: ${session.fullName}`, session.userId);
    }
    Session.end();
  },

  /** إرجاع بيانات المستخدم الكاملة للجلسة الحالية */
  currentUser() {
    const session = Session.current();
    if (!session) return null;
    const users = Storage.getUsers();
    return users.find((u) => u.id === session.userId) || null;
  },
};

/**
 * حماية الصفحات: يستدعى في بداية كل صفحة محمية.
 * allowedRoles: مصفوفة الأدوار المسموح لها بالدخول، أو null للسماح لأي مستخدم مسجل دخول.
 */
function requireAuth(allowedRoles = null) {
  const session = Session.current();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    // إعادة التوجيه حسب الدور المناسب
    if (session.role === "admin") window.location.href = "dashboard.html";
    else if (session.role === "employee") window.location.href = "verify.html";
    else window.location.href = "profile.html";
    return null;
  }
  return session;
}

/** إعادة توجيه المستخدم المسجل دخوله بالفعل بعيدًا عن صفحات login/register */
function redirectIfLoggedIn() {
  const session = Session.current();
  if (!session) return;
  if (session.role === "admin") window.location.href = "dashboard.html";
  else if (session.role === "employee") window.location.href = "verify.html";
  else window.location.href = "profile.html";
}
