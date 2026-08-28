# 🎓 StudyFlow AI Studio — Next-Gen AI Learning Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **StudyFlow AI Studio** is an all-in-one, intelligent learning workspace designed to empower self-learners, developers, and students. It generates personalized interactive 2D canvas roadmaps, topic-by-topic study environments, AI-powered study notes studio, interactive quiz engines, browser-based coding sandboxes, and document-based RAG Q&A system.

---

## 📌 Table of Contents

- [🌟 Key Workspace Modules & Features](#-key-workspace-modules--features)
  - [1. 🗺️ Dynamic 2D Canvas Roadmaps](#1-️-dynamic-2d-canvas-roadmaps)
  - [2. 📚 Topic Learning Workspaces](#2--topic-learning-workspaces)
  - [3. ✍️ AI Study Notes Studio](#3-️-ai-study-notes-studio)
  - [4. 🧠 AI Quiz & Assessment Engine](#4--ai-quiz--assessment-engine)
  - [5. 💻 AI Coding Practice Sandbox](#5--ai-coding-practice-sandbox)
  - [6. 📄 Document RAG & Vector Q&A System](#6--document-rag--vector-qa-system)
  - [7. 📊 Study Activity & Analytics Dashboard](#7--study-activity--analytics-dashboard)
  - [8. 🤖 Context-Aware AI Tutor Drawer](#8--context-aware-ai-tutor-drawer)
- [🏗️ System Architecture](#️-system-architecture)
- [🗄️ Database Schema (Supabase PostgreSQL)](#️-database-schema-supabase-postgresql)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Directory Structure](#-directory-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
  - [Installation & Running](#installation--running)
- [📜 Scripts](#-scripts)
- [🔒 Security & Best Practices](#-security--best-practices)
- [📄 License](#-license)

---

## 🌟 Key Workspace Modules & Features

### 1. 🗺️ Dynamic 2D Canvas Roadmaps
- **AI Roadmap Generation**: Instantly build detailed, multi-tier learning paths tailored to any subject (e.g., System Design, Machine Learning, DevOps, Full-Stack Engineering).
- **Hierarchical Node Tree & Canvas**: Drag, zoom, pan, and inspect custom 2D canvas nodes linked by smooth Bezier edge connections (Root Milestones, Tier-1 Modules, and Sub-topics).
- **Bottom-Up Progress Propagation**:
  - Sub-topic checklist completion automatically updates the node state.
  - Parent module progress recalculates dynamically based on child completion percentages.
  - Overall root roadmap progress updates in real time.
- **Glassmorphic Node Inspector**: Interactive overlay giving immediate topic previews, AI explanations, key takeaways, and quick navigation into sub-topic deep dives.

### 2. 📚 Topic Learning Workspaces
- **Structured Content Layout**: Granular breakdown of concepts with key takeaways, practical code snippets, and common pitfalls.
- **Actionable Task Checklists**: Session-persistent task tracking with instant status synchronization.
- **Embedded AI Explanations**: On-demand AI breakdown for complex concepts directly within the workspace view.

### 3. ✍️ AI Study Notes Studio
- **Supabase Realtime Sync**: Persistent note storage backed by Supabase database & authentication.
- **AI Topic Expansion**: Select any study note and trigger AI expansion for architectural patterns, real-world edge cases, or interview cheat sheets.
- **Markdown & PDF Export**: Professional rich-text markdown viewer with one-click print and PDF document generation.

### 4. 🧠 AI Quiz & Assessment Engine
- **Targeted Quiz Generation**: Create customizable multiple-choice quizzes for any roadmap module or custom topic.
- **Instant AI Scoring & Rationales**: Detailed feedback explaining why an answer is correct or incorrect, paired with overall score analytics.
- **Historical Attempt Tracking**: Track performance over time per quiz session.

### 5. 💻 AI Coding Practice Sandbox
- **Multi-Language Browser Sandbox**: Write and execute code directly in JavaScript, Python, C++, Java, and Go.
- **AI-Powered Code Review**: Integrated AI assistant to analyze syntax errors, suggest performance optimizations, and refactor code structure.
- **Starter Templates & Challenges**: Practice coding problems mapped directly to roadmap topics.

### 6. 📄 Document RAG & Vector Q&A System
- **Document Knowledge Upload**: Upload reference documents, syllabus PDFs, or technical guides.
- **Keyword Relevance & RAG Extraction**: Smart content chunking and relevance scoring for contextual document Q&A.
- **Source Citation**: Direct context retrieval linking AI answers to specific document sections.

### 7. 📊 Study Activity & Analytics Dashboard
- **Learning Streak & Analytics**: Visual progress charts powered by Recharts showing active study hours, topic completions, and quiz performance.
- **Recent Activity Snapshots**: Quick-launch view of active roadmaps, pending tasks, and recent notes.

### 8. 🤖 Context-Aware AI Tutor Drawer
- **Persistent AI Drawer**: Accessible from anywhere in the application shell.
- **Workspace Context Injection**: Automatically aware of the current active roadmap, topic, or document context for accurate answers.

---

## 🏗️ System Architecture

```
                                ┌───────────────────────────────────────┐
                                │          User Web Browser             │
                                │   (Next.js 16 Client App / UI Shell)  │
                                └───────────────────┬───────────────────┘
                                                    │
                                                    ▼
                                ┌───────────────────────────────────────┐
                                │        Next.js App Router             │
                                │     (Server Components / API)         │
                                └───────┬───────────────────────┬───────┘
                                        │                       │
                                        ▼                       ▼
      ┌─────────────────────────────────┴───┐       ┌───────────┴───────────────────┐
      │          AI Gateway Layer           │       │    Supabase Client SDK        │
      │       (Gemini 2.5 / Groq API)       │       │    (@supabase/supabase-js)    │
      └─────────────────┬───────────────────┘       └───────────┬───────────────────┘
                        │                                       │
                        ▼                                       ▼
      ┌─────────────────────────────────────┐       ┌───────────────────────────────┐
      │         Google Gemini 2.5 AI        │       │  Supabase PostgreSQL & Auth   │
      │   (Roadmap/Quiz/Notes/RAG Logic)   │       │  (15 Relational Tables + RLS) │
      └─────────────────────────────────────┘       └───────────────────────────────┘
```

---

## 🗄️ Database Schema (Supabase PostgreSQL)

The backend schema is structured across **15 core relational tables** defined in `supabase/schema.sql`:

| Table Name | Primary Key | Description |
|---|---|---|
| `profiles` | `UUID` | User account profile metadata and preferences |
| `roadmaps` | `UUID` | Master roadmaps generated by AI or created manually |
| `roadmap_topics` | `UUID` | Recursive parent-child tree nodes for 2D roadmaps |
| `topic_checklists` | `UUID` | Actionable checklist items attached to roadmap topics |
| `conversations` | `UUID` | AI chat session containers (Tutor, Coding, RAG) |
| `chat_messages` | `UUID` | Individual chat messages with role and content |
| `notes` | `UUID` | User notes with AI-expanded insights |
| `documents` | `UUID` | Knowledge base document metadata for RAG Q&A |
| `quizzes` | `UUID` | Quiz assessment containers per topic |
| `quiz_questions` | `UUID` | Multiple choice questions with explanations |
| `quiz_attempts` | `UUID` | History and score records of completed quizzes |
| `coding_problems` | `UUID` | Programming exercises mapped to roadmap topics |
| `coding_attempts` | `UUID` | User code submissions and execution test results |
| `tasks` | `UUID` | General study tasks, assignments, and priorities |
| `task_subtasks` | `UUID` | Subtask checklist items for tasks |

---

## 🛠️ Tech Stack

- **Frontend Framework**: [Next.js 16.3 (App Router)](https://nextjs.org/)
- **UI Core**: [React 19](https://react.dev/) & [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS Design System
- **Database & Storage**: [Supabase PostgreSQL](https://supabase.com/) & Supabase Storage Bucket
- **AI Intelligence**: [Google Gemini 2.5 Flash SDK (`@google/genai`)](https://ai.google.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Form & Validation**: [Zod](https://zod.dev/)

---

## 📁 Directory Structure

```
OS/
├── src/
│   ├── ai/                      # AI Provider Gateway & Service Routers
│   │   ├── providers/           # Google Gemini 2.5 Flash integration
│   │   ├── services/            # Roadmap, Notes, Quiz, RAG, Coding, Tutor AI services
│   │   ├── gateway.ts           # Unified AI request dispatcher
│   │   └── router.ts            # Dynamic model routing logic
│   ├── app/                     # Next.js App Router pages & API routes
│   │   ├── api/ai/              # Server-side AI API endpoints (/roadmap, /quiz, /tutor, /rag, /notes, /coding)
│   │   ├── api/storage/         # Supabase storage signed URL API
│   │   ├── auth/                # Authentication callbacks
│   │   ├── login/               # Authentication page
│   │   ├── globals.css          # Core CSS variables & glassmorphic utilities
│   │   ├── layout.tsx           # Global app layout shell
│   │   └── page.tsx             # Main interactive workspace entry point
│   ├── components/              # Modular UI components
│   │   ├── dashboard/           # Roadmap snapshot & Recharts activity charts
│   │   ├── shell/               # Header, Sidebar, AI Drawer, Context Panel, Modals
│   │   ├── ui/                  # Formatted markdown renderers & UI widgets
│   │   └── views/               # Roadmaps, Topic Workspace, Notes, Quizzes, Coding, Knowledge RAG, Tasks
│   ├── lib/                     # Supabase client helpers & utility functions
│   └── types/                   # TypeScript interfaces & types
├── public/                      # Static assets & public media
├── supabase/
│   └── schema.sql               # Complete PostgreSQL schema & indexes setup
├── .env.local.example           # Environment variables template
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Node.js dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.x` or higher
- **Package Manager**: `npm`, `yarn`, or `pnpm`
- **Supabase Account**: Free project instance at [supabase.com](https://supabase.com)
- **Google Gemini API Key**: API key from [Google AI Studio](https://aistudio.google.com/)

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Google Gemini AI Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Database Setup

1. Log into your **Supabase Dashboard**.
2. Open the **SQL Editor**.
3. Copy and execute the contents of `supabase/schema.sql` to initialize all 15 tables, indexes, and storage buckets.

### Installation & Running

```bash
# 1. Clone the repository
git clone https://github.com/SRIBALATEJESH/os_app.git
cd os_app

# 2. Install dependencies
npm install

# 3. Start development server with Turbopack
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using StudyFlow AI Studio.

---

## 📜 Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Next.js development server on `http://localhost:3000` |
| `npm run build` | Compiles optimized production build |
| `npm start` | Starts production server |
| `npm run lint` | Runs ESLint code quality checks |
| `npm run test:ai` | Executes testing script for AI model provider connections |

---

## 🔒 Security & Best Practices

- **API Protection**: AI requests route through server-side Next.js API endpoints (`/api/ai/*`) to protect server credentials and prevent key leakage.
- **Environment Isolation**: `.env.local` is ignored in `.gitignore`.
- **Database Safety**: Prepared statements and UUID constraints prevent SQL injection and data corruption.

---

## 📄 License

This project is open-source and available under the **MIT License**.
