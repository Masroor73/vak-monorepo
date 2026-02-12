# V.A.K (Valence, Axiom, Kairos)

![Status](https://img.shields.io/badge/Status-In%20Development-orange)
![Architecture](https://img.shields.io/badge/Architecture-Distributed%20Microservices-blueviolet)
![Monorepo](https://img.shields.io/badge/Monorepo-Turborepo-black)
![Compliance](https://img.shields.io/badge/Compliance-Alberta%208%2F44%20Rule-red)

> **The AI-Powered Operating System for High-Compliance Hospitality.**

V.A.K is a vertical **Workforce Management Operating System (WMOS)** designed specifically for the low-margin, high-compliance restaurant industry. Unlike generic schedulers, V.A.K correlates labor data with inventory waste analytics to provide actionable operational intelligence.

Built on a **Hybrid Serverless Microservices Architecture**, it enforces strict financial compliance via an isolated .NET Engine while delivering a fluid, mobile-first experience for staff.

---

## System Architecture

We utilize a **Polyglot Monorepo** structure managed by **Turborepo** to handle parallel development across three specialized squads.

![V.A.K Architecture Diagram](./assets/architecture-diagram.png)


### The Microservices Topology
---
The system is decoupled into three distinct layers to ensure scalability and fault tolerance:

1.  **Client Layer (Frontend):**
    * **Mobile:** React Native (Expo) app for employees (Time & Attendance, Swaps).
    * **Web:** React (Expo Web) Dashboard for managers (Scheduling, Analytics).
2.  **Core Data Layer (State):**
    * **Supabase:** Handles Identity (Auth), Persistence (PostgreSQL), and Real-time subscriptions (WebSockets).
3.  **Service Layer (Intelligence & Compliance):**
    * **Intelligence Service:** Node.js Edge Functions utilizing **Google Gemini 1.5** for waste recognition.
    * **Compliance Engine:** A strictly typed **.NET 8 (C#)** microservice running on Azure Functions to calculate payroll liabilities (Alberta Rule 8/44).


    
## The "Vital 5" Features (MVP)

1.  **Unified Role-Based Access:** Single Sign-On (SSO) routing Managers to Web and Employees to Mobile.
2.  **Geo-Fenced Attendance:** GPS-verified clock-ins enforcing a <50m proximity rule.
3.  **The "Live" Schedule:** Real-time shift publishing via WebSockets (Zero-latency updates).
4.  **P2P Shift Marketplace:** Automated shift swapping workflow with Manager approval queues.
5.  **8/44 Compliance Engine:** Automated overtime calculation ensuring strict adherence to Alberta Labour Standards.
6.  **AI Waste Log:** Computer Vision analysis of food waste photos. (Strech goal)
7.	 **Natural Language Analytics:** "Ask your Data" feature for managers. (Stretch goal)

---

## Tech Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Monorepo** | **pnpm + Turborepo** | High-performance build system for multi-package workspaces. |
| **Mobile** | **React Native (Expo)** | Single codebase for iOS/Android with Over-the-Air (OTA) updates. |
| **Web** | **React (Expo Web)** | Responsive manager dashboard sharing UI types with mobile. |
| **Styling** | **NativeWind** | Shared Tailwind CSS design system across Web & Mobile. |
| **Backend** | **Supabase** | PostgreSQL with Row Level Security (RLS) & Edge Functions. |
| **Engine** | **.NET 8 (C#)** | Type-safe financial calculations and compliance logic. |
| **AI** | **Google Gemini** | Multimodal analysis for food waste logs. |
| **Validation** | **Zod** | Runtime schema validation shared across the monorepo. |

---

## Repository Structure

```text
vak-monorepo/
├── apps/
│   ├── mobile/         # Employee App (Expo/React Native)
│   ├── web/            # Manager Dashboard (React/Expo Web)
│   └── api-engine/     # .NET 8 Payroll Logic (C#)
├── packages/
│   ├── ui/             # Shared UI "Legos" (ShiftStatusCard, Buttons, etc.)
│   └── contract/       # The "Contract": Zod Schemas & Shared Types
├── .github/workflows/  # CI/CD (GitHub Actions)
├── turbo.json          # Task runner configuration
└── .npmrc              # CRITICAL: node-linker=hoisted for Metro compatibility
```

## Getting Started 
### Prerequisites
---
> Node.js >= 20.x

> Package Manager: pnpm (Install via npm i -g pnpm)

> .NET 8 or 10 SDK (for Compliance Engine)

> Watchman: brew install watchman (Recommended for Mac)

> Expo Go (on mobile device)

### Installation
---
1. **Clone the Monorepo:** 
```bash 
git clone https://github.com/Masroor73/vak-monorepo.git
cd vak-monorepo
```

2. Install Dependencies:

```bash
npm install -g pnpm
```

```bash
pnpm install
```

3. Environment Setup
```text
Create a .env file in both apps/mobile and apps/web:
```
```bash
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

4. Development Flow   
```text
Because we use shared internal packages, you must build the "Contract" and "UI" packages before starting the apps.
```
```bash
# Build shared libraries
pnpm turbo build --filter="@vak/*"

# Start the full environment
pnpm dev
```
```text
Web: http://localhost:8082

Mobile (iOS): Press i in a separate terminal via pnpm --filter mobile start -- --ios
```

## Security & Compliance
* Row Level Security (RLS): All database access is scoped to the user's restaurant_id at the Postgres level.

* Type Safety: We use a strict Shared Types Contract to ensure the Frontend and Backend never drift out of sync.

* Data Residency: All PII and Labor data is stored in Canada (Central) to comply with PIPEDA.

## Team & Squads
Software Architect & Tech Lead: Masroor (@Masroor73)

Squad A (Mobile): Employee Experience & Geo-fencing.
Squad B (Web): Manager Dashboard & Analytics.
Squad C (Engine): API, AI Integration, & .NET Compliance.
