# Catering Management App

A full-stack Catering Management System built with **Go**, **Gin**, **PostgreSQL**, **React Native**, **Expo**, and **TypeScript**.

The application helps manage catering events, billing items, expenses, invoices, reports, and user authentication.

---

## Tech Stack

### Backend

* Go
* Gin Web Framework
* PostgreSQL
* JWT Authentication

### Frontend

* React Native
* Expo
* TypeScript
* Zustand State Management

---

## Project Structure

```text
catering-app/
├── backend/
│   ├── config/
│   ├── database/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── go.mod
│   ├── go.sum
│   └── main.go
│
└── frontend/
    ├── assets/
    ├── src/
    ├── App.tsx
    ├── package.json
    ├── app.json
    └── tsconfig.json
```

---

## Prerequisites

Before running the project, install:

* Go (1.22+ recommended)
* PostgreSQL
* Node.js (18+ recommended)
* npm
* Expo Go (Android/iOS)

---

# Backend Setup

## 1. Navigate to backend

```bash
cd backend
```

## 2. Create Environment File

Create a `.env` file inside the backend directory.

Example:

```env
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/catering_db?sslmode=disable

JWT_SECRET=your-secret-key

PORT=8080
```

Replace:

* `YOUR_PASSWORD` with your PostgreSQL password.
* `catering_db` with your database name if different.

## 3. Install Dependencies

```bash
go mod download
```

## 4. Run Backend

```bash
go run .
```

or

```bash
go run main.go
```

Backend will start on:

```text
http://localhost:8080
```

---

# Frontend Setup

## 1. Navigate to frontend

```bash
cd frontend
```

## 2. Install Dependencies

```bash
npm install
```

If dependency issues occur:

```bash
npm install --legacy-peer-deps
```

## 3. Start Expo

```bash
npx expo start
```

## 4. Run Application

### Android

* Install Expo Go from Play Store.
* Scan the QR code displayed in terminal/browser.

or press:

```text
a
```

from Expo terminal.

### Web

Press:

```text
w
```

from Expo terminal.

### iOS

* Install Expo Go from App Store.
* Scan the QR code.

---

## API Health Check

Once backend is running:

```text
GET http://localhost:8080/health
```

Expected response:

```json
{
  "status": "ok"
}
```

---

## Features

* User Authentication
* Event Management
* Billing Items
* Expense Tracking
* Miscellaneous Expenses
* Dashboard Statistics
* Invoice Generation
* Reports
* Activity Logs

---

## Development Status

🚧 Project currently under active development.

