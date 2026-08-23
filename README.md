# 🎓 StudyFlow AI Studio — Next-Gen AI Learning Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)

**StudyFlow AI Studio** is an all-in-one, intelligent learning workspace designed to generate personalized interactive roadmaps, topic-by-topic study environments, AI-powered study notes, interactive quizzes, coding practice grounds, and document RAG Q&A.

---

## 🌟 Key Features

### 1. 🗺️ Dynamic Interactive 2D Canvas Roadmaps
- **AI Roadmap Generator**: Instant, structured learning path generation for any domain (Software Engineering, DevOps, Data Science, AI/ML, etc.).
- **Hierarchical Canvas & Edge Connections**: Smooth bezier curves linking Root Milestones, Tier-1 Modules, and Sub-topic nodes with drag/pan/zoom capabilities.
- **Bottom-Up Dynamic Progress Propagation**:
  - Completing sub-topic checklist items automatically updates sub-node completion (`100%`).
  - Tier-1 module progress dynamically recalculates as the average of its child sub-nodes.
  - Root Milestone node progress reflects real-time overall roadmap completion.
- **Floating Glass Node Inspector**: Interactive drawer providing sub-topic previews, quick AI explanations, and direct workspace navigation.

### 2. 📚 Topic Learning Workspaces
- **Actionable Task Checklists**: Complete topics with instant progress tracking saved across sessions.
- **AI Key Takeaways & Code Examples**: Structured breakdown of foundational concepts, practical code snippets, and common pitfalls.
- **Instant AI Doubt Resolution**: Embedded AI Tutor drawer for real-time concept clarification.

### 3. ✍️ AI Study Notes Studio
- **Supabase Realtime Sync**: Persistent note storage backed by Supabase database & authentication.
- **Custom AI Topic Expansion**: Expand any study note with technical edge cases, architecture patterns, and interview cheat sheets via screen-centered AI modals.
- **Clean PDF Document Export**: One-click professional PDF print & save workflow for offline review.

### 4. 🧠 AI Quiz & Assessment Engine
- **Custom Quiz Generator**: Generate targeted multiple-choice quizzes tailored to any roadmap node or custom topic.
- **Instant Feedback & Explanations**: Deep-dive answer rationales and score analytics.

### 5. 💻 AI Coding Practice Ground
- **Multi-Language Sandbox**: Practice JavaScript, Python, C++, Java, and Go directly in the browser.
- **Instant AI Debugging & Code Structuring**: AI-assisted code review and syntax optimization.

### 6. 📄 Document RAG & Vector Q&A
- **Smart Chunk Relevance Scoring**: Upload study documents and query specific sections with keyword-scored RAG context extraction.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router & Turbopack)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS + TailwindCSS (Glassmorphism Dark Mode Palette)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **AI Engines**: Google Gemini 2.5 Flash / Groq LLMs
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Installation

```bash
# Clone the repository
git clone https://github.com/SRIBALATEJESH/OS.git
cd OS

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Folder Structure

```
OS/
├── src/
│   ├── app/                    # Next.js App Router routes & API endpoints
│   │   ├── api/ai/             # Gemini & Groq AI API routes
│   │   ├── page.tsx            # Main application workspace shell
│   ├── components/             # Reusable UI & workspace views
│   │   ├── shell/              # Header, Ask AI drawer, Context panels
│   │   ├── views/              # Roadmap canvas, Topic workspace, Notes, Quizzes, Code studio
│   │   └── ui/                 # Formatted markdown & UI utilities
│   ├── services/               # Roadmap, Notes, Quiz, and Supabase integrations
│   └── styles/                 # Global styling & CSS variables
├── public/                     # Static media & assets
├── README.md                   # Project documentation
└── package.json
```

---

## 🔒 Security & Deployment

- Environment variables (`.env.local`) are strictly excluded from version control.
- API keys utilize secure server-side proxy routes (`/api/ai/*`) or standard header configurations.

---

## 📄 License

This project is licensed under the MIT License.
