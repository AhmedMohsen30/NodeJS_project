# اتفاق دمج الباك إند

هذا الملف يحدد شكل الملفات والبيانات قبل تجميع شغل الخمسة في الريبو. ملفات كل شخص الفاضية ما زالت تخص صاحبها؛ لا تنشئ نسخة ثانية باسم مختلف.

## تشغيل المشروع

- `app.js` هو نقطة تشغيل السيرفر. اتصال MongoDB موجود في `config/db.js` ويُستدعى مرة واحدة من `app.js`.
- مفتاح الاتصال في `.env` اسمه `MONGODB_URI`، والمنفذ اختياري باسم `PORT`. انسخ أسماء المتغيرات من `.env.example`، ولا ترفع `.env` أو كلمات السر.
- الحزم المشتركة الحالية في `package.json`: `express`, `mongoose`, `dotenv`, `bcrypt`, `jsonwebtoken`, `nodemailer`. استخدموا Node.js 20 أو أحدث، وتثبيت نفس النسخ يتم بـ `npm ci`. لو احتاج كود زميل حزمة جديدة، ابعت اسم الحزمة لمسؤول الدمج ليضيفها إلى `package.json` و`package-lock.json`.
- استعملوا `require` و`module.exports` مثل الملفات الموجودة، واكتبوا أسماء الملفات في `require` بنفس حالة الأحرف تمامًا؛ هذا مهم عند التشغيل على Linux.

## اتفاق الملفات بين الأشخاص

| المسؤول | الملفات | ما يحتاجه باقي الفريق |
| --- | --- | --- |
| تسجيل الدخول | `models/user.js`، `middlewares/authMiddleware.js`، `utils/sendEmail.js`، ملفات auth | `protect` تصدَّر من middleware وتضع رقم المستخدم في `req.user._id` أو `req.user.id`. دالة الإيميل تصدَّر بالشكل `sendEmail(to, subject, html)`. |
| العيادات | `models/Clinic.js`، `models/Specialty.js`، `routes/clinicRoutes.js` | المسارات داخل الـrouter هي `/clinics` و`/specialties`؛ `app.js` يركبها على `/api`. |
| الأطباء والمواعيد | `models/Doctor.js`، `models/Slot.js`، `routes/doctorRoutes.js` | `Slot` يحتوي `doctor`, `date`, `time`, `isBooked`. قيمة `time` نص بصيغة 24 ساعة مثل `09:30`. اتفقوا على توقيت القاهرة للمواعيد. |
| الحجز | `models/Appointment.js`، `controllers/appointmentController.js`، `routes/appointmentRoutes.js`، `jobs/releaseExpired.js` | الحجز يحتوي `user`, `doctor`, `clinic`, `slot`, `code`, `patientName`, `status`, `paymentStatus`, `expiresAt`. حالات الحجز: `pending_payment`, `confirmed`, `cancelled`, `expired`. حالات الدفع: `unpaid`, `paid`, `refunded`, `forfeited`. |
| الدفع والإلغاء | `controllers/paymentController.js`، `routes/appointmentActionsRoutes.js`، `utils/sendBookingEmail.js` | هذه الملفات تعتمد على أسماء الحقول والتصديرات السابقة. |

## إضافة المسارات عند وصول الملفات

في `app.js` توجد أسطر معلَّقة للـauth والأطباء والحجوزات. فعّل كل سطر عندما تصل ملفات الـrouter والـcontroller والـmodel والـmiddleware التي يعتمد عليها. اترك `appointmentActionsRoutes` قبل `appointmentRoutes` حتى لا يلتقط `GET /:id` الرابط `/my`.

لا تضف `/api` داخل ملفات الـrouter إذا كان `app.js` يضيفه عند `app.use`. مثال: ملف `appointmentRoutes.js` يكتب `router.get('/:id', ...)`، و`app.js` يركبه على `/api/appointments`.

## ترتيب التحقق

1. بعد اكتمال ملفات الفريق والحزم، نفّذ `npm ci` ثم `npm start`.
2. جرّب `GET http://localhost:5000/health`؛ ظهور `Server is running` يعني أن السيرفر بدأ بعد اتصال MongoDB.
3. جرّب تسجيل مستخدم والحجز، ثم الدفع و`GET /api/appointments/my` والإلغاء من Postman بتوكن حقيقي.
4. اختبر الإلغاء قبل الموعد بأكثر من 24 ساعة وبأقل من 24 ساعة، وتأكد أن `Slot.isBooked` صار `false`.

`paid` و`refunded` في هذا التكليف يغيّران حالة الحجز داخل قاعدة البيانات؛ لا توجد بوابة دفع أو استرداد أموال حقيقية.

## واجهة React

- الواجهة موجودة في فولدر `frontend` ولها `package.json` مستقل. خطوات تشغيلها في `frontend/README.md`.
- أثناء التطوير، React يطلب `/api/clinics` و`/api/specialties`، وVite يوجّه الطلبات إلى Express على منفذ 5000. المتصفح لا يتصل بـMongoDB مباشرة.
- واجهة العيادات تعمل الآن. لا تضيفوا أزرار حجز أو تسجيل دخول حقيقية قبل تفعيل واختبار مسارات الفريق الخاصة بها.
- لا تضعوا `MONGODB_URI` أو أي سر في ملفات `frontend` أو متغيرات تبدأ بـ`VITE_`؛ هذه المتغيرات تصبح متاحة للمتصفح.
