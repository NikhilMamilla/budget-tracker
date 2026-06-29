# FinVista | Enterprise Personal Expense Tracker & Financial Intelligence

A high-performance, enterprise-grade Personal Expense Tracker SaaS web application built with a modern 2026 SaaS design language. Designed for executive financial visibility, autonomous transaction reporting, and real-time category intelligence.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React.js 18 with Vite
- **Routing**: React Router DOM (v6) with Protected Routes
- **HTTP Client**: Axios with token auto-injection & error interceptors
- **State & Theme**: Context API (`AuthContext`, `ThemeContext`)
- **Animations & Micro-interactions**: Framer Motion
- **Data Visualization**: Recharts
- **Iconography**: Lucide React & React Icons
- **Design System**: Custom CSS Design Tokens, Glassmorphism, Responsive Spacing

### Backend
- **Runtime**: Node.js & Express.js
- **Architecture**: MVC Architecture (Controllers, Services, Repositories, Models, Routes, Validations)
- **Database ORM**: Sequelize ORM
- **Database Engine**: MySQL (with automatic schema creation & SQLite dev mode fallback)
- **Authentication**: JWT Token Authentication with password hashing via `bcryptjs`
- **Security & Middleware**: Helmet, Cors, Morgan logging, Express Rate Limiter, Express Validator
- **Document Generation**: ExcelJS (Excel Workbooks) & PDFKit (Executive Financial Statements)

---

## 🚀 Quick Start Guide

## GitHub & Vercel Deployment

This repository is set up for a standard GitHub push and Vercel deployment flow.

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare FinVista for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Import the repository in Vercel.
2. Use the root folder as the project root.
3. Keep the default build command and output directory settings.
4. Add the following environment variables in Vercel:
   - `NODE_ENV=production`
   - `JWT_SECRET=change-this-to-a-long-random-string`
   - `DB_DIALECT=sqlite`

The app is designed to fall back to a local SQLite database automatically in production when no external database is configured.

---

### Prerequisites
- Node.js (v18+ recommended)
- MySQL Server (Running locally or remotely)

### 1. Database & Environment Configuration
The backend is pre-configured to connect to MySQL using your local credentials.
Verify or update `backend/.env`:
```env
PORT=5000
NODE_ENV=development

DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=Sathwik@2718
DB_NAME=expense_tracker_db

JWT_SECRET=enterprise_super_secret_jwt_key_2026_expense_tracker
```

### 2. Backend Setup & Database Seeding
Open terminal in `backend/`:
```bash
cd backend
npm install
npm run seed
npm start
```
*The seed script verifies/creates `expense_tracker_db`, syncs Sequelize models, and seeds demo data.*

### 3. Frontend Setup
Open terminal in `frontend/`:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:3000` in your web browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| Executive Demo User | `alex@enterprise.io` | `password123` |

---

## 📊 Application Modules & APIs

- **Authentication**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`, `PUT /api/auth/profile`
- **Dashboard**: `GET /api/dashboard` (KPIs, cashflow breakdown, top categories, monthly trend)
- **Transactions**: `GET /api/transactions` (with pagination, search, sorting), `POST`, `PUT`, `DELETE`
- **Categories**: `GET /api/categories`, `POST`, `PUT`, `DELETE` (with custom color pickers and budget caps)
- **Reports & Export**: `GET /api/reports`, `GET /api/reports/export/pdf`, `GET /api/reports/export/excel`
- **Analytics**: `GET /api/analytics` (Average spend per day/month, peak spending day, MoM variance)
