# Digital Identity & Smart Cards
## نظام إدارة الهوية والبطاقات الرقمية

مشروع جامعي Front-End متكامل لإدارة بطاقات الهوية الرقمية، مبني بالكامل باستخدام
**HTML5 + CSS3 + JavaScript (ES6+)** فقط، بدون أي إطار عمل أو Backend.

---

## 🚀 التشغيل

لا حاجة لأي تثبيت. افتح `index.html` مباشرة في المتصفح، أو استخدم أي خادم ملفات محلي
بسيط (مثل إضافة "Live Server" في VS Code) لتفادي بعض قيود المتصفح مع الملفات المحلية.

عند أول تشغيل، يقوم النظام تلقائيًا بإنشاء بيانات تجريبية (مستخدمين وبطاقات) داخل
`localStorage`.

## 🔑 حسابات تجريبية

| الدور    | البريد الإلكتروني        | كلمة المرور     |
|----------|---------------------------|------------------|
| مدير     | admin@digitalid.com       | Admin@123        |
| موظف     | employee@digitalid.com    | Employee@123     |
| مستخدم   | user1@digitalid.com       | User@123         |

## 🗂 هيكل المشروع

```
Digital-ID/
├── index.html          الصفحة الرئيسية (Landing Page)
├── login.html           تسجيل الدخول
├── register.html        إنشاء حساب
├── dashboard.html        لوحة تحكم المدير
├── cards.html             إدارة البطاقات (المدير)
├── add-card.html           إضافة / تعديل بطاقة
├── card-details.html        تفاصيل البطاقة + QR + طباعة
├── verify.html             التحقق من البطاقة (صفحة عامة)
├── profile.html             الملف الشخصي (المستخدم)
├── settings.html             الإعدادات
├── users.html                إدارة المستخدمين (المدير)
├── logs.html                  سجل العمليات
│
├── css/
│   ├── style.css        الأنماط العامة (Variables, Navbar, Landing...)
│   ├── auth.css          صفحات الدخول والتسجيل
│   ├── dashboard.css      Sidebar والـ Widgets
│   ├── cards.css           بطاقة الهوية ونتيجة التحقق
│   └── print.css            طباعة البطاقة فقط
│
├── js/
│   ├── storage.js        طبقة localStorage + البيانات التجريبية
│   ├── auth.js             تسجيل الدخول / التسجيل / الجلسات
│   ├── app.js               أدوات مشتركة (Toast, Modal, Theme...)
│   ├── cards.js             CRUD البطاقات + QR + عرض البطاقة
│   ├── users.js              إدارة المستخدمين
│   ├── dashboard.js           إحصائيات + Sidebar
│   └── verify.js               منطق صفحة التحقق
│
└── assets/images/
```

## 👥 الأدوار والصلاحيات

- **User**: تسجيل حساب، إصدار بطاقته، تعديلها، طباعتها، متابعة حالتها.
- **Employee**: التحقق من أي بطاقة عبر رقمها، ومتابعة سجل عمليات التحقق الخاصة به.
- **Admin**: لوحة تحكم كاملة، إدارة كل البطاقات والمستخدمين، الإحصائيات، السجلات.

## 🧠 المفاهيم المطبقة (للمناقشة)

DOM Manipulation · Events · Closures · Objects & Arrays · localStorage / sessionStorage ·
Authentication & Authorization Simulation · CRUD · Search & Filter (Dynamic) · Form Validation ·
QR Generation & Verification · Activity Logging · Responsive Design (Media Queries) ·
Print Stylesheets (`@media print`).

## ⚠️ ملاحظة أمنية مهمة

هذا مشروع **تعليمي Front-End بالكامل**. يتم تخزين البيانات — بما فيها كلمات المرور — في
`localStorage` **بدون تشفير**، وهذا غير آمن إطلاقًا لأي تطبيق حقيقي (Production).
في نظام حقيقي، يجب أن تُدار كلمات المرور والجلسات عبر Backend آمن (Hashing، HTTPS،
قاعدة بيانات محمية...). الغرض هنا هو محاكاة تجربة الاستخدام والمنطق البرمجي فقط.
