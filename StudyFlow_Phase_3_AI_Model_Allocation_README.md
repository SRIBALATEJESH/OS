# StudyFlow --- Phase 3 AI Model Allocation README

## 1. Purpose

Phase 3 adds AI capabilities to the completed StudyFlow web application.

The goal is to use a small, practical multi-model architecture instead
of calling a different model directly from every UI module.

Core architecture:

``` text
StudyFlow UI
     |
     v
AI Service Layer
     |
     v
AI Gateway
     |
     v
Model Router
     |
     +----------------------+----------------------+
     |                      |                      |
     v                      v                      v
Gemini 3.5 Flash-Lite   Gemma 4               Gemini Embedding 2
Main Cloud AI           Local/Advanced AI     RAG / Semantic Search
```

AI is added without redesigning the Phase 1 UI or changing the Phase 2
database architecture unnecessarily.

------------------------------------------------------------------------

## 2. Final Model Selection

  ----------------------------------------------------------------------------
  Priority                Model                   Primary Use
  ----------------------- ----------------------- ----------------------------
  1                       **Gemini 3.5            Main StudyFlow cloud AI
                          Flash-Lite**            model

  2                       **Gemini Embedding 2**  RAG embeddings and semantic
                                                  retrieval

  3                       **Gemma 4 12B**         Local AI, tutor/coding
                                                  experiments

  4                       **Gemma 4 26B A4B**     Advanced local/server
                                                  reasoning experiments

  5                       **Gemma 4 E4B / E2B**   Future
                                                  lightweight/offline/mobile
                                                  AI
  ----------------------------------------------------------------------------

### Models intentionally removed from the initial architecture

-   Gemini 3.6 Flash
-   Gemini 3.7 Flash
-   Gemini TTS

The initial implementation should stay simple and concentrate usage on
Gemini 3.5 Flash-Lite + Gemini Embedding 2.

------------------------------------------------------------------------

# 3. Module-to-Model Allocation

  --------------------------------------------------------------------------
  Module            AI Feature           Model Version     Usage
  ----------------- -------------------- ----------------- -----------------
  AI Roadmap        Generate learning    **Gemini 3.5      Primary
                    roadmap              Flash-Lite**      

  AI Roadmap        Complex long-term    **Gemma 4 26B     Advanced/local
  Advanced          roadmap              A4B**             experiment

  AI Tutor          Normal topic         **Gemini 3.5      Primary
                    questions            Flash-Lite**      

  AI Tutor Local    Private/offline      **Gemma 4 12B**   Local experiment
                    tutor                                  

  Conversation      Extract useful       **Gemini 3.5      Primary
  Memory            learning memories    Flash-Lite**      

  AI Notes          Generate structured  **Gemini 3.5      Primary
                    notes                Flash-Lite**      

  Note              Summarize            **Gemini 3.5      Primary
  Summarization     notes/documents      Flash-Lite**      

  AI Quiz           Generate             **Gemini 3.5      Primary
                    MCQ/T/F/scenario     Flash-Lite**      
                    questions                              

  Quiz Explanation  Explain answers      **Gemini 3.5      Primary
                                         Flash-Lite**      

  AI Coding         Generate coding      **Gemini 3.5      Primary
                    problems             Flash-Lite**      

  Coding            Explain              **Gemini 3.5      Primary
  Explanation       mistakes/solutions   Flash-Lite**      

  Coding Local      Private coding       **Gemma 4 12B**   Local experiment
                    assistant                              

  Document          Understand uploaded  **Gemini 3.5      Primary
  Processing        material             Flash-Lite**      

  RAG Embeddings    Create               **Gemini          Required for RAG
                    document/query       Embedding 2**     
                    vectors                                

  RAG Retrieval     Semantic document    **Gemini          Required for RAG
                    search               Embedding 2**     

  RAG Tutor         Answer using         **Gemini 3.5      Primary
                    retrieved documents  Flash-Lite**      

  Learning Gap      Identify weak topics **Gemini 3.5      Primary
  Analysis                               Flash-Lite**      

  AI Study Planner  Daily/weekly study   **Gemini 3.5      Primary
                    planning             Flash-Lite**      

  AI                Recommend next topic **Gemini 3.5      Primary
  Recommendations                        Flash-Lite**      

  Progress Analysis Explain learning     **Gemini 3.5      Primary
                    progress             Flash-Lite**      

  Advanced Local AI Complex reasoning    **Gemma 4 26B     Optional
                    experiments          A4B**             

  Future Offline AI Lightweight Android  **Gemma 4 E4B /   Future
                    AI                   E2B**             
  --------------------------------------------------------------------------

------------------------------------------------------------------------

# 4. Why Gemini 3.5 Flash-Lite Is the Main Model

Gemini 3.5 Flash-Lite should handle most StudyFlow requests.

Use it for:

-   Roadmap generation
-   AI Tutor
-   Notes
-   Quiz generation
-   Quiz explanations
-   Coding problem generation
-   Coding explanations
-   Document understanding
-   Conversation memory extraction
-   Study planning
-   Learning-gap analysis
-   Recommendations

The reason is simple:

``` text
High-volume feature
        |
        v
Gemini 3.5 Flash-Lite
        |
        v
Fast + structured + economical
```

Do not waste limited higher-capability models on ordinary chat,
summaries, quizzes, or simple explanations.

------------------------------------------------------------------------

# 5. Gemma 4 Role

Gemma is not required for the first cloud AI implementation.

It provides a second AI path for:

-   Local inference
-   Private processing
-   Model experimentation
-   Offline AI
-   Future Android/edge AI

Recommended versions:

### Gemma 4 12B

Use for:

-   Local AI Tutor
-   Local coding assistant
-   Local explanations
-   Development experiments

### Gemma 4 26B A4B

Use for:

-   Advanced local reasoning
-   Complex coding experiments
-   Complex roadmap experiments
-   Future server-side/local AI

### Gemma 4 E4B / E2B

Reserve for future:

-   Flutter
-   Android
-   Offline study assistant
-   Lightweight local AI

Do not make Gemma a hard dependency for Phase 3.

------------------------------------------------------------------------

# 6. Gemini Embedding 2

Gemini Embedding 2 is dedicated to the RAG pipeline.

Architecture:

``` text
Uploaded Document
       |
       v
Text Extraction
       |
       v
Chunking
       |
       v
Gemini Embedding 2
       |
       v
Vector Embeddings
       |
       v
Supabase PostgreSQL + pgvector
```

For a user question:

``` text
Question
   |
   v
Gemini Embedding 2
   |
   v
Query Vector
   |
   v
Similarity Search
   |
   v
Relevant Document Chunks
   |
   v
Gemini 3.5 Flash-Lite
   |
   v
Answer + Sources
```

Initially use text chunks. Multimodal RAG can be added later.

------------------------------------------------------------------------

# 7. AI Gateway Architecture

Do not call Gemini directly from React components.

Bad:

``` text
React Component
     |
     v
Gemini API
```

Correct:

``` text
React Component
     |
     v
AI Service
     |
     v
AI Gateway
     |
     v
Model Router
     |
     v
Gemini / Gemma
```

This allows models to be changed without changing the UI.

------------------------------------------------------------------------

# 8. Recommended Project Structure

``` text
src/
|
+-- ai/
|   |
|   +-- gateway.ts
|   +-- router.ts
|   |
|   +-- providers/
|   |   +-- gemini.ts
|   |   +-- gemma.ts
|   |
|   +-- models/
|   |   +-- flash-lite.ts
|   |   +-- gemma.ts
|   |   +-- embedding.ts
|   |
|   +-- services/
|   |   +-- roadmap.ts
|   |   +-- tutor.ts
|   |   +-- notes.ts
|   |   +-- quiz.ts
|   |   +-- coding.ts
|   |   +-- memory.ts
|   |   +-- rag.ts
|   |   +-- planner.ts
|   |
|   +-- prompts/
|   |   +-- roadmap.ts
|   |   +-- tutor.ts
|   |   +-- notes.ts
|   |   +-- quiz.ts
|   |   +-- coding.ts
|   |
|   +-- schemas/
|       +-- roadmap.ts
|       +-- quiz.ts
|       +-- coding.ts
|
+-- app/
+-- components/
+-- services/
+-- hooks/
+-- types/
+-- lib/
```

------------------------------------------------------------------------

# 9. Model Router

The router decides which model handles each operation.

Example:

``` text
generateQuiz()
      |
      v
AI Router
      |
      v
Gemini 3.5 Flash-Lite
```

Complex local experiment:

``` text
complexCodingAnalysis()
      |
      v
AI Router
      |
      v
Gemma 4 26B A4B
```

RAG:

``` text
embedDocument()
      |
      v
AI Router
      |
      v
Gemini Embedding 2
```

The UI never needs to know the selected model.

------------------------------------------------------------------------

# 10. Structured AI Output

For Roadmaps, Quizzes, Coding Problems, Notes metadata, and other
machine-consumed results, prefer structured JSON.

Example roadmap:

``` json
{
  "title": "Backend Development",
  "description": "A structured backend learning path",
  "topics": [
    {
      "title": "Node.js",
      "children": [
        {
          "title": "Modules"
        },
        {
          "title": "Async Programming"
        }
      ]
    }
  ]
}
```

Pipeline:

``` text
User Request
     |
     v
Gemini
     |
     v
Structured JSON
     |
     v
Zod Validation
     |
     +---- invalid ---> Retry / Repair
     |
     v
Supabase
     |
     v
StudyFlow UI
```

Never make the roadmap UI depend on parsing arbitrary AI prose.

------------------------------------------------------------------------

# 11. AI Roadmap Flow

``` text
User Goal
   |
   v
Collect:
- Goal
- Level
- Duration
- Daily study time
- Preferences
- Prerequisites
   |
   v
Gemini 3.5 Flash-Lite
   |
   v
Structured Roadmap
   |
   v
Validate
   |
   v
Create Roadmap
   |
   v
Create Topics
   |
   v
Create Parent/Child Relationships
   |
   v
Interactive React Flow Roadmap
```

For advanced/local experimentation:

``` text
Complex Goal
     |
     v
Gemma 4 26B A4B
```

------------------------------------------------------------------------

# 12. AI Tutor Flow

The Tutor should not send the entire history on every request.

``` text
User Question
      |
      v
Context Builder
      |
      +-- Current Topic
      +-- Recent Messages
      +-- Learning Progress
      +-- Weak Areas
      +-- Relevant Notes
      +-- RAG Results
      |
      v
Model Router
      |
      v
Gemini 3.5 Flash-Lite
      |
      v
Response
      |
      +-- Save Message
      +-- Extract Memory
      +-- Update Context
```

For local experimentation:

``` text
Tutor
  |
  v
Gemma 4 12B
```

------------------------------------------------------------------------

# 13. Conversation Memory

Chat history and learning memory should be separate.

``` text
Conversation
     |
     v
Messages
     |
     v
Memory Extraction
     |
     v
Useful Learning Memory
```

Example memory:

``` text
Understands:
- HashMap basics
- put/get operations

Needs practice:
- Collision handling
- Load factor

Preference:
- Likes practical examples
```

The system should retrieve only relevant memory for future
conversations.

Do not send thousands of old messages to the model.

------------------------------------------------------------------------

# 14. AI Notes Flow

``` text
Topic
  |
  v
Gemini 3.5 Flash-Lite
  |
  v
Structured Notes
  |
  +-- Summary
  +-- Key Concepts
  +-- Examples
  +-- Common Mistakes
  +-- Revision Points
  |
  v
Validate
  |
  v
Supabase
  |
  v
Notes UI
```

------------------------------------------------------------------------

# 15. AI Quiz Flow

Input:

``` text
Topic
Difficulty
Question count
Question types
User level
```

Output:

``` text
Quiz
|
+-- Question
|   +-- Options
|   +-- Correct Answer
|   +-- Explanation
|
+-- Question
|
+-- Question
```

Model:

``` text
Gemini 3.5 Flash-Lite
```

Store generated questions in Supabase.

------------------------------------------------------------------------

# 16. AI Coding Flow

``` text
Topic
Language
Difficulty
Problem Type
      |
      v
Gemini 3.5 Flash-Lite
      |
      v
Coding Problem
      |
      +-- Description
      +-- Constraints
      +-- Examples
      +-- Starter Code
      +-- Hints
      +-- Test Cases
      |
      v
Supabase
```

For local coding experiments:

``` text
Gemma 4 12B
```

Do not allow the LLM itself to execute arbitrary user code.

A separate sandboxed code-execution service is required if real
execution is added later.

------------------------------------------------------------------------

# 17. RAG Architecture

``` text
PDF / DOCX / TXT
       |
       v
Supabase Storage
       |
       v
Text Extraction
       |
       v
Chunking
       |
       v
Gemini Embedding 2
       |
       v
pgvector
       |
       v
User Question
       |
       v
Embedding 2
       |
       v
Similarity Search
       |
       v
Relevant Chunks
       |
       v
Gemini 3.5 Flash-Lite
       |
       v
Grounded Answer
       |
       v
Sources
```

The final response should show which document/page/chunk supported the
answer whenever source metadata is available.

------------------------------------------------------------------------

# 18. AI Study Planner

Use:

**Gemini 3.5 Flash-Lite**

Input:

``` text
Current roadmap
Current progress
Incomplete topics
Available daily time
Upcoming tasks
Quiz performance
Coding performance
```

Output:

``` text
Today
1. Review Middleware — 30 min
2. Complete Quiz — 20 min
3. Coding Practice — 30 min
```

The planner should use actual Phase 2 data rather than inventing
progress.

------------------------------------------------------------------------

# 19. Learning Gap Analysis

Use:

**Gemini 3.5 Flash-Lite**

Input:

``` text
Topic progress
Quiz results
Coding results
Checklist completion
Recent activity
```

Output:

``` text
Strong:
- Routing
- REST basics

Needs improvement:
- Middleware
- Error handling

Recommended:
Review middleware before Authentication.
```

This feeds the Dashboard and future adaptive learning features.

------------------------------------------------------------------------

# 20. Rate-Limit Strategy

The provided Gemini AI Studio screenshots show that the available limits
differ substantially by model.

Use the high-volume model for ordinary operations.

Conceptually:

``` text
                 AI REQUEST
                     |
                     v
                AI ROUTER
                     |
          +----------+----------+
          |                     |
      Normal task          Complex task
          |                     |
          v                     v
Gemini 3.5 Flash-Lite       Optional Gemma
```

Do not make higher-capability models a hard dependency for common tutor,
quiz, notes, or summary requests.

Also implement:

-   Retry with exponential backoff
-   Rate-limit detection
-   Request queue where useful
-   Fallback model
-   Request logging
-   Token/context limits
-   Maximum output limits
-   Graceful UI error states

Never expose Gemini API keys in browser code.

------------------------------------------------------------------------

# 21. Security

AI calls must be server-side.

Recommended:

``` text
Next.js
   |
   v
Server Route / Supabase Edge Function
   |
   v
Gemini API
```

Never:

``` text
Browser
   |
   v
Gemini API key
```

Store secrets in environment variables.

------------------------------------------------------------------------

# 22. Phase 3 Implementation Order

### Phase 3A --- AI Foundation

1.  Gemini API project/key
2.  Secure environment variables
3.  Gemini SDK
4.  AI Gateway
5.  Model Router
6.  Provider abstraction
7.  Structured output
8.  Zod validation
9.  Retry handling
10. Rate-limit handling
11. AI request logging

### Phase 3B --- AI Generators

12. AI Roadmap
13. AI Notes
14. AI Quiz
15. AI Coding

### Phase 3C --- AI Tutor

16. Tutor chat
17. Multiple persistent conversations
18. Context builder
19. Conversation memory
20. Memory retrieval

### Phase 3D --- RAG

21. Document extraction
22. Chunking
23. Gemini Embedding 2
24. pgvector
25. Similarity search
26. Source metadata
27. RAG Tutor

### Phase 3E --- Intelligence

28. Learning-gap analysis
29. Adaptive recommendations
30. AI study planner
31. Difficulty adaptation
32. Personalized learning path
33. AI progress analysis

------------------------------------------------------------------------

# 23. Final Phase 3 Architecture

``` text
                         STUDYFLOW
                             |
                             v
                       NEXT.JS WEB
                             |
                             v
                       AI SERVICES
                             |
                             v
                        AI GATEWAY
                             |
                       MODEL ROUTER
                             |
        +--------------------+--------------------+
        |                    |                    |
        v                    v                    v
Gemini 3.5 Flash-Lite    Gemma 4             Embedding 2
        |                    |                    |
        |                    |                    |
   Main Cloud AI        Local / Private        RAG
        |                    |                    |
   +----+----+          +----+----+              |
   |    |    |          |         |              |
Roadmap Tutor Notes    Local    Coding      Vector Search
Quiz   Coding Planner  Tutor     Assistant       |
        |                    |                    |
        +--------------------+--------------------+
                             |
                             v
                         SUPABASE
                             |
        +--------------------+--------------------+
        |                    |                    |
   PostgreSQL             Storage             Realtime
        |
        +-- Roadmaps
        +-- Topics
        +-- Progress
        +-- Chats
        +-- Messages
        +-- Notes
        +-- Documents
        +-- Quizzes
        +-- Coding
        +-- Tasks
        +-- AI Memory
```

------------------------------------------------------------------------

# 24. Final Decision

For the **first working Phase 3 implementation**, use only:

``` text
1. Gemini 3.5 Flash-Lite
   → All normal AI modules

2. Gemini Embedding 2
   → RAG / semantic search

3. Gemma 4
   → Local/advanced experimentation
```

Do not make Gemini 3.6, Gemini 3.7, or TTS dependencies.

The most important architectural decision is:

> **Modules choose an AI capability, the Model Router chooses the
> model.**

That means your UI remains independent from the model provider and you
can replace or add models later without rebuilding StudyFlow.
