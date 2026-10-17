<div align="center">

![CareClinic animated banner](assets/readme-banner.gif)

# CareClinic

**Find a clinic, choose a doctor, and book an appointment in one place.**

![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-149ECA?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)

</div>

CareClinic is a full-stack clinic booking project. The React interface lets patients explore clinics and doctors, create an account, select an available time, and manage their appointments. The Express API handles the booking rules and stores data in MongoDB.

## What works

- Search and filter clinics by name, city, and specialty; browse doctors and their available slots.
- Register, verify an email with a six-digit code, and sign in with JWT authentication.
- Book a slot with patient details and a payment deadline; booked slots cannot be taken twice.
- Confirm a **simulated** deposit, see your bookings, and cancel a confirmed booking. Expired unpaid bookings release their slots automatically.
- Send verification and booking emails through SMTP. Local development can print verification emails to the backend terminal instead.

> **Payment note:** Confirming, refunding, or forfeiting a deposit changes records in MongoDB. No real payment gateway or money transfer is connected.

## Stack and project layout

| Layer | Technology | Location |
| --- | --- | --- |
| Interface | React, Vite | [`frontend/`](frontend/) |
| API | Node.js, Express | [`app.js`](app.js), [`routes/`](routes/), [`controllers/`](controllers/) |
| Data | MongoDB, Mongoose | [`config/`](config/), [`models/`](models/) |
| Authentication and email | JWT, bcrypt, Nodemailer | [`middlewares/`](middlewares/), [`utils/`](utils/) |

```text
Browser → React/Vite → Express API → MongoDB Atlas
                        ↳ SMTP email
```

The browser calls `/api` on the backend. MongoDB credentials stay on the backend and are never placed in React code.

## Run locally

You need **Node.js 20.19+**, npm, and a MongoDB database (Atlas or a local MongoDB server). From the repository root:

1. Install backend packages:

   ```bash
   npm ci
   ```

2. Copy [`.env.example`](.env.example) to a new `.env` file and set at least:

   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/careclinic
   JWT_SECRET=<a-random-secret-of-at-least-32-characters>
   EMAIL_MODE=console
   ```

   Use your own connection string from Atlas. Add your current IP to Atlas Network Access if Atlas blocks the connection. Keep `.env` private; it is ignored by Git.

3. Start the API:

   ```bash
   npm start
   ```

   Check `http://localhost:5000/health`. The server starts listening after MongoDB connects.

4. In another terminal, install and start the interface:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

   Open the address printed by Vite, usually `http://localhost:5173`. Keep the API running on port **5000**: Vite forwards `/api` and `/health` there.

### Add sample data

With the API environment configured, run these commands from the repository root if your database is empty:

```bash
npm run seed:clinics
npm run seed:doctors
npm run seed:slots
```

They add sample specialties, clinics, doctors, and available slots. They do not replace existing bookings.

### Send real email

For email delivery, change `EMAIL_MODE` to `smtp` in the backend `.env` and set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` as shown in [`.env.example`](.env.example). For Gmail, use an App Password for the **project's sending account**. Patients only enter their normal email addresses; they do not configure SMTP. `EMAIL_MODE=console` is for local development and is rejected in production.

## Try the booking flow

1. Register and verify your email using the code sent by SMTP or printed in the backend terminal.
2. Sign in, open **Doctors & Booking**, and choose a doctor, date, and free slot.
3. Enter the patient's name, Egyptian mobile number, and date of birth.
4. Confirm the simulated deposit before the payment window expires.
5. Open **My Appointments** to see or cancel the booking.

The default payment window is 15 minutes and the simulated deposit is 20% of the doctor's fee. Both can be changed with `PAYMENT_WINDOW_MIN` and `DEPOSIT_PERCENT` in `.env`.

## API at a glance

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Server health check |
| `GET` | `/api/specialties` | List specialties |
| `GET` | `/api/clinics` | Search and filter clinics |
| `GET` | `/api/clinics/:id` | Clinic details |
| `GET` | `/api/doctors` | List and filter doctors |
| `GET` | `/api/doctors/:id` | Doctor details |
| `GET` | `/api/doctors/:id/slots?date=YYYY-MM-DD` | Available slots |
| `POST` | `/api/auth/register` | Create an account and send a verification code |
| `POST` | `/api/auth/verify-email` | Verify an account |
| `POST` | `/api/auth/resend-otp` | Request a new code |
| `POST` | `/api/auth/login` | Sign in and receive a JWT |
| `POST` | `/api/appointments` | Create a booking |
| `GET` | `/api/appointments/my` | Current user's bookings |
| `GET` | `/api/appointments/:id` | Booking details |
| `POST` | `/api/appointments/:id/pay` | Confirm simulated payment |
| `POST` | `/api/appointments/:id/cancel` | Cancel a confirmed booking |

Appointment endpoints require `Authorization: Bearer <token>`. For the team integration details, see [`INTEGRATION.md`](INTEGRATION.md); for interface notes, see [`frontend/README.md`](frontend/README.md).

## Build the interface

```bash
cd frontend
npm run build
npm run preview
```

When hosting the built interface, route `/api` to the Express server. The Vite proxy in [`frontend/vite.config.js`](frontend/vite.config.js) is for local development and preview only.
