-- ========================================================
-- STUDYFLOW PHASE 2 SUPABASE POSTGRESQL DATABASE SCHEMA
-- Execute this SQL script in your Supabase SQL Editor
-- ========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE DEFAULT 'DEV_USER_ID',
    name TEXT NOT NULL DEFAULT 'StudyFlow Scholar',
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ROADMAPS TABLE
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL DEFAULT 'DEV_USER_ID',
    title TEXT NOT NULL,
    description TEXT,
    goal TEXT,
    category TEXT DEFAULT 'Computer Science',
    difficulty TEXT DEFAULT 'Intermediate',
    duration TEXT DEFAULT '4 Weeks',
    status TEXT DEFAULT 'Active',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ROADMAP TOPICS TABLE (Includes parent_id for recursive 2D canvas trees)
CREATE TABLE IF NOT EXISTS public.roadmap_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.roadmap_topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'Beginner',
    estimated_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'Not Started',
    progress INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TOPIC CHECKLISTS TABLE
CREATE TABLE IF NOT EXISTS public.topic_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES public.roadmap_topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL DEFAULT 'DEV_USER_ID',
    roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.roadmap_topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'New AI Session',
    module_type TEXT DEFAULT 'tutor',
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL DEFAULT 'DEV_USER_ID',
    roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.roadmap_topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated', 'document')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. KNOWLEDGE DOCUMENTS METADATA TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL DEFAULT 'DEV_USER_ID',
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size TEXT NOT NULL,
    topic_id UUID REFERENCES public.roadmap_topics(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'ready' CHECK (status IN ('uploaded', 'processing', 'ready', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL DEFAULT 'DEV_USER_ID',
    topic_id UUID REFERENCES public.roadmap_topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'Medium',
    question_count INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice',
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    order_index INTEGER DEFAULT 0
);

-- 11. QUIZ ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'DEV_USER_ID',
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 5,
    correct_answers INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. CODING PROBLEMS TABLE
CREATE TABLE IF NOT EXISTS public.coding_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL DEFAULT 'DEV_USER_ID',
    topic_id UUID REFERENCES public.roadmap_topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Easy',
    language TEXT DEFAULT 'javascript',
    constraints TEXT,
    examples JSONB DEFAULT '[]'::jsonb,
    starter_code TEXT NOT NULL,
    solution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. CODING ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.coding_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES public.coding_problems(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'DEV_USER_ID',
    code TEXT NOT NULL,
    status TEXT DEFAULT 'Accepted',
    tests_passed INTEGER DEFAULT 0,
    tests_total INTEGER DEFAULT 0,
    execution_time TEXT DEFAULT '45ms',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL DEFAULT 'DEV_USER_ID',
    topic_id UUID REFERENCES public.roadmap_topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT DEFAULT 'assignment',
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending',
    estimated_minutes INTEGER DEFAULT 30,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. TASK SUBTASKS TABLE
CREATE TABLE IF NOT EXISTS public.task_subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0
);

-- ========================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_roadmap_topics_roadmap_id ON public.roadmap_topics(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_topics_parent_id ON public.roadmap_topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_coding_attempts_problem_id ON public.coding_attempts(problem_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);

-- ========================================================
-- SUPABASE STORAGE BUCKET CREATION
-- ========================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('studyflow', 'studyflow', true)
ON CONFLICT (id) DO NOTHING;
