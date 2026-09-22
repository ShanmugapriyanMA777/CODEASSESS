# CodeAssess — Online Coding Assessment Platform

A production-grade, enterprise-ready **Online Coding Assessment Platform** modeled after leading academic and competitive assessment systems (e.g., SkillRack, HackerRank, LeetCode Assessments). Built with a modern, high-contrast UI, isolated sandboxed code execution (Python, Java, C, C++), anti-cheating monitoring with clipboard copy-paste blocking, synchronized exam timers, dynamic competition ranking, and server-side institutional PDF report generation.

---

## 🌟 Key Features

### 1. Dual Role Architecture
- **ADMIN**: Complete CRUD for questions, test cases, starter codes, and exams. Cohort and student management, dynamic leaderboard rankings with tie-breakers, real-time submission feeds, system audit trail, and instant PDF report generator.
- **STUDENT**: Dedicated candidate portal, assigned assessments view, live proctored examination workspace, self-paced coding practice arena, submission history, learning curve analytics, and instant performance PDF transcript downloads.

### 2. Live Proctored Assessment Workspace
- **Monaco Code Editor**: Professional VS Code engine with syntax highlighting for Python, Java, C, and C++, font sizing, auto-indentation, and starter code templates.
- **Anti-Cheating & Proctoring Monitoring**:
  - **Copy-Paste Disabled**: Intercepts keyboard (`Ctrl+V`, `Cmd+V`), context menu, and DOM paste events, alerts the candidate, and logs `PASTE_ATTEMPT` events to the backend.
  - **Fullscreen Enforcement**: Detects fullscreen exits and prompts the candidate to re-enter.
  - **Tab Switch & Window Blur Tracking**: Detects when candidate leaves the browser window.
- **Synchronized Countdown Timer**: Backend-validated expiration with automatic submission when the exam timer hits zero.
- **Auto-Save Engine**: Periodically saves code drafts every 8 seconds and on question changes.
- **Dual Evaluation Engine**:
  - **Run Code**: Tests against public sample test cases with stdout, stderr, execution time, and diffs.
  - **Submit Code**: Evaluates against hidden test cases without exposing inputs/expected outputs to candidates.

### 3. Institutional PDF Reports
- Built using **PDFKit** for fast, high-resolution vector PDF generation.
- Generates official academic transcripts:
  - Official institution header & candidate verification stamp
  - Candidate profile and cohort details
  - Summary metric cards (Average %, Test Cases Accuracy %, Problems Solved)
  - Examination evaluation records table
  - Domain & topic mastery visual progress bars
  - Recent question-by-question evaluation breakdown
  - Proctoring integrity log (tab switches, fullscreen exits, paste attempts)
  - Factual algorithmic observations derived from real database records.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), React Router v6, Axios, Recharts, Lucide Icons |
| **Backend** | Node.js (v20), Express.js, TypeScript, Prisma ORM, JWT, Bcryptjs, PDFKit, Helmet, Cors, Morgan |
| **Database** | PostgreSQL / Supabase ready via Prisma (configured with SQLite for zero-setup local dev) |
| **Code Execution** | Dual-engine: Isolated subprocess worker with timeouts/resource caps + Docker sandbox runner |
| **DevOps** | Docker, Docker Compose, Nginx multi-stage builds |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or v20+)
- npm (v9+)
- Python 3 (installed on your system for Python execution)
- Java 11+ (for Java compilation and execution)

### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Initialize database schema and generate Prisma Client
npx prisma generate
npx prisma db push

# Seed sample admin, 10 students, 15 complete questions, 3 assessments
npm run prisma:seed

# Start backend server in development mode (runs on http://localhost:5000)
npm run dev
```

### 2. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🔑 Demo Credentials

> [!IMPORTANT]
> The platform includes pre-seeded demo accounts. The login screen features **1-Click Demo Fill** buttons for immediate testing!

| Role | Email | Password | Details |
|---|---|---|---|
| **ADMIN** | `admin@example.com` | `Admin@123` | Full access to Question Bank, Assessments, Students, Rankings & Reports |
| **STUDENT 1** | `alex.johnson@example.com` | `Student@123` | Roll No: `22CS001`, assigned to CSE-2026 cohort |
| **STUDENT 2** | `priya.sharma@example.com` | `Student@123` | Roll No: `22CS002`, assigned to CSE-2026 cohort |
| **STUDENT 3** | `david.chen@example.com` | `Student@123` | Roll No: `22CS003`, assigned to CSE-2026 cohort |

---

## 🐳 Docker Deployment

To launch the complete multi-service production stack (PostgreSQL, Redis, Backend, Frontend with Nginx):

```bash
cd docker
docker-compose up --build -d
```

Services:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## 📋 Comprehensive Question Bank (Included in Seed)

The platform comes pre-populated with **15 complete coding challenges** across fundamental computer science topics with starter code in Python, Java, C, and C++, plus sample and hidden test cases:

1. **Find Largest Element** (Arrays, Easy, 10m)
2. **Reverse a String** (Strings, Easy, 10m)
3. **Check Palindrome** (Strings, Easy, 10m)
4. **Find Prime Number** (Mathematics, Easy, 10m)
5. **Fibonacci Series** (Mathematics, Easy, 10m)
6. **Binary Search** (Searching, Medium, 15m)
7. **Bubble Sort** (Sorting, Easy, 10m)
8. **Count Vowels** (Strings, Easy, 10m)
9. **Find Duplicate Elements** (Data Structures, Medium, 15m)
10. **Matrix Addition** (Data Structures, Medium, 15m)
11. **Factorial Using Recursion** (Recursion, Easy, 10m)
12. **Second Largest Element** (Arrays, Medium, 15m)
13. **Anagram Check** (Strings, Easy, 10m)
14. **Sum of Array** (Arrays, Easy, 10m)
15. **Frequency of Characters** (Strings, Medium, 15m)

---

## 🔒 Security & Privacy Implementation

- **Hidden Test Case Privacy**: Hidden test case inputs and expected outputs are **never** transmitted to the frontend in API responses. The response only indicates whether each hidden test case passed or failed and the execution time.
- **Authoritative Grading**: Marks and rankings are calculated strictly on the backend using Prisma database transactions.
- **Tie-Breaking Ranking Logic**: Ranks are computed dynamically via competition ranking:
  1. Higher obtained marks rank first.
  2. If tied, lower completion time ranks first.
  3. If still tied, earlier submission timestamp breaks the tie.
- **Process Isolation & Timeouts**: Submissions execute in ephemeral directories with tight timeout kills to prevent denial-of-service or infinite loops (`while True: pass`).
