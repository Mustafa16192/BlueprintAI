# Blueprint – AI Platform for Management Consultants  
*Built for the University of Michigan Graduate Consulting Club (MGCC)*

Blueprint is a fully dockerized AI-powered web platform that helps management consultants analyze, critique, and refine client deliverables.  
It is designed for speed, clarity, and collaboration — turning raw pitch decks, market data, and meeting notes into actionable insights.

---

## ✨ Key Features

### 📄 Slide Review & Feedback
- Upload a pitch deck (PDF)  
- AI provides **structured, section-by-section critique**
- Suggestions for **clarity, structure, and impact**
- Delivered in **consultant-ready format** (Markdown)

### 🧠 Consultant Toolkit
- **Executive Summaries** – concise, C-suite friendly overviews
- **SWOT Analysis** – strengths, weaknesses, opportunities, threats
- **Market Sizing** – top-down, bottom-up, and assumptions
- **Framework Applications** – Porter’s Five Forces, 3C, 4P, Value Chain, MECE
- **Meeting Notes → Actions** – extract decisions, risks, owners, next steps

### 🎨 UI & UX
- **Glassy, minimal design** with UMich blue & maize accents
- **Unified card and input styling** for visual consistency
- Responsive layout for desktop and tablet

### ⚙️ Tech & Deployment
- **Frontend:** React + TypeScript + Vite, served via Nginx in production
- **Backend:** FastAPI (Python), integrates with LLM APIs (FireworksAI / OpenAI)
- **Containerization:** Dockerfiles for both services + `docker-compose.yml`
- **Single-command startup** for local or cloud deployment