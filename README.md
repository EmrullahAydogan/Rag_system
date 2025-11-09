# 🤖 TechStore AI Support - Full-Stack RAG System

A production-ready, full-stack **Retrieval-Augmented Generation (RAG)** customer support system built with **FastAPI**, **React**, and **multi-LLM support** (OpenAI, Anthropic Claude, Google Gemini).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![React](https://img.shields.io/badge/react-18.2+-blue.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.109+-green.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Functionality
- 🤖 **Multi-LLM Support**: Choose between OpenAI GPT, Anthropic Claude, or Google Gemini
- 📚 **RAG Pipeline**: Semantic search with context-aware responses
- 💬 **Real-time Chat**: Interactive chat interface with conversation history
- 📄 **Document Management**: Upload and manage knowledge base documents (PDF, TXT, DOCX, MD)
- 📊 **Analytics Dashboard**: Monitor usage, performance, and user satisfaction
- 🔍 **Source Attribution**: See which documents were used to generate responses

### Advanced Features
- **Vector Database**: ChromaDB for fast semantic search
- **Smart Chunking**: Intelligent document splitting for optimal retrieval
- **Conversation Memory**: Multi-turn conversations with context preservation
- **Multi-format Support**: PDF, TXT, DOCX, Markdown document processing
- **File Upload**: Drag-and-drop interface with real-time processing
- **Chat History**: Browse and continue previous conversations
- **Feedback System**: Rate AI responses to improve quality
- **Analytics**: Time-series data, topic analysis, document usage stats

### User Experience
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- ⚡ **Fast Performance**: Optimized for speed with React Query caching
- 🔄 **Real-time Updates**: Instant feedback and status updates
- 🎯 **Intuitive Navigation**: Easy-to-use sidebar navigation

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI/ML**: LangChain, OpenAI, Anthropic, Google Gemini
- **Vector DB**: ChromaDB
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Embeddings**: HuggingFace Sentence Transformers
- **Document Processing**: PyPDF, python-docx, markdown

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **HTTP Client**: Axios
- **UI Components**: Custom components with Lucide icons

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database Migrations**: Alembic
- **Environment Management**: python-dotenv

## 🏗 Architecture

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │
       │ HTTP/REST API
       │
┌──────▼──────────────────────────────────────┐
│           FastAPI Backend                    │
│                                              │
│  ┌────────────┐  ┌─────────────────────┐   │
│  │  REST API  │  │   RAG Service       │   │
│  │  Endpoints │  │  - LangChain        │   │
│  └─────┬──────┘  │  - Multi-LLM        │   │
│        │         │  - Prompt Templates │   │
│        │         └──────┬──────────────┘   │
│        │                │                   │
│  ┌─────▼────────────────▼─────────┐        │
│  │    Business Logic Services     │        │
│  │  - Document Processor           │        │
│  │  - Vector Store Manager         │        │
│  │  - Analytics Service            │        │
│  └─────┬──────────────┬────────────┘        │
│        │              │                      │
└────────┼──────────────┼──────────────────────┘
         │              │
    ┌────▼─────┐  ┌────▼────────┐
    │PostgreSQL│  │  ChromaDB   │
    │  (Data)  │  │  (Vectors)  │
    └──────────┘  └─────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher
- **PostgreSQL** 13 or higher
- **API Keys** for at least one LLM provider (OpenAI, Anthropic, or Google)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rag_system.git
cd rag_system
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required environment variables:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rag_system
GOOGLE_API_KEY=your_gemini_api_key_here
# Or use OpenAI/Anthropic
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

#### 3. Database Setup

```bash
# Create PostgreSQL database
createdb rag_system

# Run migrations (tables will be created automatically on first run)
```

#### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit if needed (default points to localhost:8000)
```

#### 5. Load Sample Documents

```bash
# Sample documents are in sample_documents/
# You can upload them through the UI after starting the application
```

### Running the Application

#### Start Backend (Terminal 1)

```bash
cd backend
source venv/bin/activate
python -m app.main

# Or use uvicorn directly:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`

#### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:5173`

## ⚙️ Configuration

### Backend Configuration

Edit `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Vector Database
CHROMA_PERSIST_DIRECTORY=./data/vectordb

# LLM Provider (choose one or configure all)
DEFAULT_LLM_PROVIDER=google  # openai, anthropic, google
DEFAULT_MODEL=gemini-pro

# API Keys
GOOGLE_API_KEY=your_key
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key

# Application
DEBUG=True
CORS_ORIGINS=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

### Frontend Configuration

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## 📖 Usage

### 1. Upload Documents

1. Navigate to **Documents** page
2. Drag and drop files or click to select
3. Supported formats: PDF, TXT, DOCX, MD
4. Wait for processing to complete

### 2. Chat with AI

1. Go to **Chat** page
2. Type your question in the input box
3. View AI response with source attribution
4. Continue multi-turn conversations

### 3. View Analytics

1. Visit **Analytics** page
2. Monitor key metrics:
   - Total conversations and messages
   - Average ratings
   - Time-series trends
   - Popular topics

### 4. Browse History

1. Open **History** page
2. View all past conversations
3. Click to view full conversation
4. Continue previous chats or delete them

## 📚 API Documentation

### Interactive API Docs

Once the backend is running, visit:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

#### Chat
```
POST /api/chat/
GET /api/chat/conversations
GET /api/chat/conversations/{id}
DELETE /api/chat/conversations/{id}
POST /api/chat/feedback
```

#### Documents
```
POST /api/documents/upload
GET /api/documents/
GET /api/documents/{id}
DELETE /api/documents/{id}
GET /api/documents/stats/overview
```

#### Analytics
```
GET /api/analytics/summary
GET /api/analytics/time-series?days=7
GET /api/analytics/top-topics?limit=10
GET /api/analytics/document-usage
```

## 📁 Project Structure

```
rag_system/
├── backend/
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   │   ├── chat.py
│   │   │   ├── documents.py
│   │   │   └── analytics.py
│   │   ├── core/             # Core configuration
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/           # Database models
│   │   │   ├── document.py
│   │   │   ├── conversation.py
│   │   │   └── analytics.py
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   │   ├── llm_provider.py
│   │   │   ├── vector_store.py
│   │   │   ├── rag_service.py
│   │   │   └── document_processor.py
│   │   └── main.py           # FastAPI app
│   ├── data/                 # Data storage
│   │   ├── documents/        # Uploaded files
│   │   └── vectordb/         # ChromaDB data
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── .env.example
├── sample_documents/         # Sample knowledge base
│   ├── product_catalog.md
│   ├── return_policy.md
│   ├── warranty_terms.md
│   ├── shipping_delivery.md
│   └── faq.md
└── README.md
```

## 🚢 Deployment

### Manual Deployment

#### Backend (Production)

```bash
# Install production dependencies
pip install gunicorn

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend (Production)

```bash
# Build for production
npm run build

# Serve with nginx or any static server
# Build output is in dist/
```

### Environment Variables for Production

- Set `DEBUG=False`
- Use strong database credentials
- Configure proper CORS origins
- Use environment secrets management
- Enable HTTPS

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **LangChain** for the RAG framework
- **FastAPI** for the excellent web framework
- **React** and **Vite** for the frontend
- **OpenAI**, **Anthropic**, and **Google** for LLM APIs
- **ChromaDB** for vector storage

---

**Built with ❤️ for Upwork Portfolio**

*This is a demonstration project showcasing full-stack RAG implementation with modern web technologies.*