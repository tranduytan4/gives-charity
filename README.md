# Gives Charity — Internal Donation & Campaign Management Platform

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169e1.svg)](https://www.postgresql.org/)

---

## 🌟 Overview

**Gives Charity** is a full-stack, enterprise-grade internal donation and fundraising platform designed to empower corporate employees to organize charitable campaigns, donate funds or goods, track impact transparently, and collaborate in real-time.

Built with modern technology stacks—**Java 21 / Spring Boot 3.5** on the backend and **React 19 / TypeScript / Vite / Tailwind CSS v4** on the frontend—Gives Charity features real-time WebSocket notifications, AI-powered donor insights via Gemini, seamless payment gateway integration via PayOS, and Webex meeting integrations.

---

## 🚀 Key Features

### 💰 Financial & Goods Donations
- Direct monetary donations with automated QR generation via PayOS integration.
- Item/Goods donation management with location drop-off tracking and quantity verification.
- Personal donation history, exportable receipts, and impact tracking dashboard.

### 📢 Campaign Management
- Full lifecycle campaign creation: draft, verification, active funding, target progress, and completion.
- Interactive campaign updates, image galleries, and rich text descriptions using Tiptap editor.
- Target funding progress bars with dynamic updates via WebSocket.

### 🤖 AI-Powered Campaign Assistance
- Integrated Google Gemini AI for smart donor summary generation and automated campaign description refinement.

### 🔔 Real-Time Notifications & Integrations
- WebSocket STOMP messaging for instant in-app alerts on new donations, milestones, and announcements.
- Webex integration for automated meeting scheduling and corporate messaging updates.

### 🛡️ Security & Role-Based Access Control (RBAC)
- JWT-based authentication with access and refresh tokens.
- Google OAuth2 social login support.
- Fine-grained role permissions: `EMPLOYEE`, `CAMPAIGN_CREATOR`, and `ADMIN`.

---

## 🏗️ System Architecture & Tech Stack

### Backend (`mgm-gives-be`)
- **Core Framework**: Java 21, Spring Boot 3.5.4
- **Security**: Spring Security, OAuth2 Client, JWT (jjwt)
- **Data & Persistence**: Spring Data JPA, Hibernate, PostgreSQL 16+
- **Database Migrations**: Flyway DB
- **Real-Time Communication**: Spring WebSocket, STOMP
- **External Integrations**: PayOS Java SDK, Google Gemini AI API, Cisco Webex API, Spring Mail (Brevo/SMTP)
- **Build Tool**: Apache Maven

### Frontend (`mgm-gives-fe`)
- **Core Framework**: React 19, TypeScript 5.9
- **Build Tool & Dev Server**: Vite 8
- **Styling**: Tailwind CSS v4, Lucide React Icons, Radix UI primitives
- **State & Data Fetching**: TanStack Query v5 (React Query), Axios
- **Form Handling**: React Hook Form, Zod validation
- **Rich Text & Media**: Tiptap Editor, Fancybox, Embla Carousel
- **Internationalization**: i18next (English & Vietnamese support)
- **Code Quality**: Biome, ESLint, TypeScript Strict Mode

---

## 📁 Repository Structure

```
gives-charity/
├── mgm-gives-be/             # Spring Boot 3.5 Backend Service
│   ├── src/
│   │   ├── main/java/        # Controllers, Services, Repositories, Entities, DTOs
│   │   └── main/resources/   # Application YAML, Flyway Migrations, Mail Templates
│   ├── pom.xml               # Maven Dependencies & Configuration
│   ├── .env.example          # Backend Environment Template
│   └── Dockerfile            # Multi-stage Docker Build for Backend
├── mgm-gives-fe/             # React 19 + Vite Frontend Application
│   ├── src/                  # Components, Pages, Hooks, Features, Layouts
│   ├── package.json          # Frontend Dependencies & NPM Scripts
│   ├── vite.config.ts        # Vite & Tailwind Configuration
│   └── .env.example          # Frontend Environment Template
├── docs/
│   └── screenshots/          # Platform UI Screenshots & Demos
├── .gitignore                # Global Monorepo Git Ignore Rules
└── README.md                 # Project Documentation
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
- **JDK 21** or higher
- **Node.js 20+** and **npm 10+**
- **PostgreSQL 16+** server running locally or via Docker

---

### 1. Database Setup

Create a PostgreSQL database named `mgmgives`:

```sql
CREATE DATABASE mgmgives;
```

---

### 2. Backend Configuration & Startup

Navigate to the backend directory:
```bash
cd mgm-gives-be
```

Copy `.env.example` to `.env` and adjust your database connection details:
```bash
cp .env.example .env
```

Configure your credentials in `.env`:
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/mgmgives
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
```

Run Flyway migrations and start the Spring Boot application:
```bash
# Using Maven Wrapper (Windows)
.\mvnw.cmd spring-boot:run

# Using Maven Wrapper (Linux/macOS)
./mvnw spring-boot:run
```

The backend server will start on `http://localhost:8080`.

---

### 3. Frontend Configuration & Startup

Navigate to the frontend directory:
```bash
cd mgm-gives-fe
```

Install dependencies:
```bash
npm ci
```

Copy `.env.example` to `.env.development`:
```bash
cp .env.example .env.development
```

Start the Vite development server:
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

---

## 🐳 Docker Deployment (Optional)

You can run both Backend and Database using Docker Compose:

```bash
cd mgm-gives-be
docker-compose up -d
```

---

## 🔐 Security Notice

This repository contains sanitized code prepared for public portfolio demonstration. 
- All actual secrets, API keys, SMTP credentials, and tokens are kept in unversioned local `.env` files.
- The `.gitignore` file strictly blocks `.env` and credential files from being tracked or pushed.
- Production deployments must inject secrets strictly via environment variables or secret managers.

---

## 📸 Screenshots

*(Screenshots will be added in `docs/screenshots/`)*

---

## 👤 Author

Developed by **Tran Duy Tan** — Senior Full-Stack Developer.
- GitHub: [@tranduytan4](https://github.com/tranduytan4)
