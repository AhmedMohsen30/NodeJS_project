<div align="center">

![Animated preview of the CareClinic interface](assets/readme-banner.gif)

# CareClinic

**Find a clinic, choose a doctor, and book an appointment in one place.**

</div>

## What is CareClinic?

CareClinic is a clinic appointment booking project. Patients can explore clinics and doctors, choose an available time, book an appointment, and manage their bookings through a single interface. The frontend connects to a Node.js API, with data stored in MongoDB.

## Features

- **Clinics:** Browse clinics, search by name, filter by specialty, and view details such as address, working hours, and consultation prices.
- **Doctors and availability:** Browse doctors by specialty and see their available time slots for a selected day.
- **Accounts:** Register, receive an email verification code, verify the account, and sign in.
- **Appointments:** Enter patient details and reserve an available slot. The same slot cannot be booked twice.
- **Demo deposit:** Confirm a booking through a simulated payment step. Unconfirmed bookings expire after the payment window and release their slots.
- **My appointments:** View bookings and cancel a confirmed appointment. The deposit status is recorded according to the cancellation time.
- **Email notifications:** Send a booking confirmation email when email delivery is configured.

> Payments and refunds are simulated in the database. The project does not charge or return real money.
