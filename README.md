# Sahara

An AI-powered companion platform designed for elderly users in India. Sahara provides a friendly AI chat companion, medication reminders, emergency SOS, document management, and nearby hospital navigation.

## Features

- **AI Companion** - Chat with a warm, patient AI powered by Ollama (Llama 3.2). Responds in English, Hindi, or Hinglish.
- **Medication Reminders** - Track medicines, set reminders, and manage doctor appointments.
- **Emergency SOS** - One-tap emergency alert that records location and notifies contacts.
- **Document Vault** - Store and organize important documents (Aadhaar, prescriptions, insurance).
- **Hospital Navigation** - Find the nearest hospital using Leaflet maps with directions.
- **Profile Management** - Store personal, medical, and insurance information with tap-to-copy.

## Tech Stack

### Frontend
- Vanilla HTML/JS with Vite
- Tailwind CSS
- Supabase Auth (client-side)
- Leaflet.js for maps
- Lucide icons

### Backend
- Node.js + Express 5
- Ollama (local LLM via Llama 3.2)
- Supabase (PostgreSQL database)
- JWT authentication (HS256)

## Getting Started

### Prerequisites
- Node.js 18+
- [Ollama](https://ollama.ai) installed and running with `llama3.2` model
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repository
```bash
git clone https://github.com/Yash3710/Sahara.git
cd Sahara
```

2. Set up the backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials and Ollama config
npm run dev
```

3. Set up the frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase and API URLs
npm run dev
```

4. Make sure Ollama is running
```bash
ollama serve
ollama pull llama3.2
```

### Environment Variables

#### Backend (.env)
| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3001) |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |
| `OLLAMA_BASE_URL` | Ollama API URL |
| `OLLAMA_MODEL` | LLM model name |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | JWT secret for token verification |

#### Frontend (.env)
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_API_URL` | Backend API URL |

## Project Structure

```
Sahara/
├── backend/
│   ├── config/          # Environment and system prompt config
│   ├── controllers/     # Route handlers
│   ├── middleware/       # CORS, auth, error handling
│   ├── migrations/      # SQL migration scripts
│   ├── routes/          # Express route definitions
│   ├── services/        # Ollama, Supabase, context services
│   ├── utils/           # Logger, response helpers
│   └── server.js        # Express app entry point
├── frontend/
│   ├── css/             # Tailwind and custom styles
│   ├── js/              # Client-side JavaScript modules
│   ├── public/          # Static assets (logo)
│   └── *.html           # Page templates
└── README.md
```

## License

This project is for educational purposes.
