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

### 🤖 Core AI Capabilities
- **Multi-LLM Support**: Choose between OpenAI GPT, Anthropic Claude, or Google Gemini
- **🆕 Real-Time Model Selection**: Switch between AI models during chat (GPT-4o, Claude 3.5, Gemini 1.5)
- **🆕 Dynamic Model Discovery**: Automatically fetches available models from OpenAI API
- **🆕 Latest Models Support**: Access to GPT-4o, GPT-4o-mini, Claude 3.5 Sonnet/Haiku, Gemini 1.5 Pro/Flash
- **RAG Pipeline**: Semantic search with ChromaDB vector database
- **Context-Aware Responses**: Intelligent retrieval with source attribution
- **Auto-Categorization**: Automatic message classification by topic
- **LLM Comparison**: Side-by-side comparison of different models' responses
- **Conversation Memory**: Multi-turn conversations with full context preservation

### 📄 Document Management
- **Multi-Format Support**: PDF, TXT, DOCX, Markdown processing
- **Drag-and-Drop Upload**: Intuitive file upload interface
- **Smart Chunking**: Intelligent document splitting for optimal retrieval
- **Document Tagging**: Organize documents with custom tags and categories
- **Multi-Document Chat**: Filter conversations by specific documents
- **Document Analytics**: Track usage and performance metrics

### 💬 Chat Experience
- **Real-Time Chat**: WebSocket-based instant messaging
- **🆕 Embeddable Widget**: Standalone chat widget for embedding on any website
- **🆕 Customizable Widget**: Configurable colors, position, and title via URL parameters
- **Chat Templates**: Quick-start questions for common topics
- **Voice Input**: Speech-to-text for hands-free interaction
- **Message Feedback**: Thumbs up/down rating system
- **PDF Export**: Generate downloadable conversation reports
- **Chat History**: Browse, search, and continue previous conversations

### 📊 Analytics & Monitoring
- **Real-Time Dashboard**: Live metrics with auto-refresh
- **Time-Series Analysis**: Track trends over time
- **Topic Analysis**: Popular topics and conversation patterns
- **Document Usage Stats**: Most referenced documents
- **User Satisfaction Metrics**: Average ratings and feedback
- **Activity Logs**: Comprehensive audit trail of all system actions

### 🔔 Notifications & Alerts
- **Toast Notifications**: Real-time success/error/warning alerts
- **Auto-Dismiss**: Configurable notification duration
- **Action Feedback**: Instant confirmation for uploads, deletions, exports

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based auth system
- **User Management**: Registration, login, logout
- **Activity Logging**: Track all user actions for audit
- **CORS Protection**: Configurable origin restrictions

### 🎨 User Experience
- **Dark/Light Mode**: Theme toggle with system preference detection
- **Modern UI**: Clean, responsive Tailwind CSS design
- **Mobile Responsive**: Optimized for all screen sizes
- **Fast Performance**: React Query caching and optimization
- **Intuitive Navigation**: Sidebar with icon-based navigation

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

- **Docker** and **Docker Compose** (recommended for one-command setup)
- **OR** Manual setup requires:
  - Python 3.10+
  - Node.js 18+
  - PostgreSQL 13+
- **API Keys** for at least one LLM provider (OpenAI, Anthropic, or Google)

### Quick Start (Recommended) 🎯

**One-command installation with Docker:**

```bash
# Clone the repository
git clone https://github.com/yourusername/rag_system.git
cd rag_system

# Run setup script
chmod +x setup.sh
./setup.sh
```

The setup script will:
✅ Check Docker and Docker Compose installation
✅ Create .env configuration file
✅ Build all containers
✅ Start all services (backend, frontend, database)
✅ Run health checks
✅ Open your browser automatically

**Important:** Edit the `.env` file and add your LLM API key(s) before the setup completes.

### Manual Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rag_system.git
cd rag_system
```

#### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env
```

**Required environment variables:**
```env
# At least ONE LLM API key is required
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here

# Database (auto-configured with Docker)
DB_USER=raguser
DB_PASSWORD=ragpassword
DB_NAME=rag_db
DB_PORT=5432
```

#### 3. Start with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 4. Manual Setup (Without Docker)

<details>
<summary>Click to expand manual setup instructions</summary>

**Backend Setup:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup PostgreSQL database
createdb rag_db

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Setup:**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
</details>

### Accessing the Application

Once running, access:

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

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

### 1. Upload & Manage Documents

1. Navigate to **Documents** page
2. Drag and drop files or click to select (PDF, TXT, DOCX, MD)
3. Add tags to organize documents by category
4. View processing status and metadata
5. Delete or re-tag documents as needed

### 2. Chat with AI

1. Go to **Chat** page
2. **🆕 Select AI Model**: Click "Model" button to choose:
   - **Provider**: OpenAI, Anthropic, or Google
   - **Model**: Select from available models (e.g., GPT-4o, Claude 3.5 Sonnet, Gemini 1.5)
   - Models are fetched dynamically based on your API key permissions
3. Choose chat templates for quick questions, or type your own
4. Use 🎤 **voice input** button for speech-to-text
5. Filter by specific documents for focused answers
6. View AI response with **source attribution**
7. Rate responses with 👍/👎 feedback
8. Export conversation as **PDF report**

**Available Models:**
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus/Sonnet/Haiku
- **Google**: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro

### 3. Compare LLM Responses

1. Visit **Comparison** page
2. Enter a question to test
3. Select multiple LLM models to compare
4. View side-by-side responses
5. Analyze differences in answers, speed, and quality

### 4. Monitor Analytics

1. Open **Analytics** page
2. View real-time dashboard with:
   - Total conversations and messages
   - Average satisfaction ratings
   - Time-series trends (7/30/90 days)
   - Popular topics and categories
   - Document usage statistics
   - Auto-refresh every 30 seconds

### 5. Browse History

1. Visit **History** page
2. Search and filter past conversations
3. View conversation metadata and categories
4. Click to view full conversation
5. Continue previous chats or delete them

### 6. Review Activity Logs

1. Go to **Activity Logs** page
2. Monitor all system actions:
   - Document uploads/deletes
   - Chat messages sent
   - User authentication events
3. Filter by action type, resource, status
4. Search by description
5. View statistics and trends

### 7. 🆕 Use Embedded Chat Widget

**Embed AI chat on any website:**

1. **Access Widget Page**: `http://localhost:5173/embed`
2. **Customize with URL Parameters**:
   ```html
   <iframe
     src="http://localhost:5173/embed?position=bottom-right&color=%233b82f6&title=AI%20Support"
     style="position: fixed; bottom: 0; right: 0; width: 100%; height: 100%; border: none; pointer-events: none;"
     allow="clipboard-read; clipboard-write"
   ></iframe>
   ```

3. **Configuration Options**:
   - `position`: `bottom-right` or `bottom-left`
   - `color`: Hex color (URL encoded, e.g., `%233b82f6` for #3b82f6)
   - `title`: Widget header text (URL encoded)

4. **Features**:
   - Model selection within widget
   - Minimizable interface
   - Fully responsive design
   - Same AI capabilities as main app

5. **View Documentation**: Open `frontend/public/embed-example.html` for examples and integration guide

## 📚 API Documentation

### Interactive API Docs

Once the backend is running, visit:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

#### Authentication
```
POST /api/auth/register         # Create new user
POST /api/auth/login            # Login user
GET  /api/auth/me               # Get current user
```

#### Chat
```
POST   /api/chat/               # Send message (supports llm_provider & model params)
GET    /api/chat/conversations  # List conversations
GET    /api/chat/conversations/{id}  # Get conversation
DELETE /api/chat/conversations/{id}  # Delete conversation
POST   /api/chat/feedback       # Submit message rating
GET    /api/chat/providers      # 🆕 Get available LLM providers and models
POST   /api/chat/compare        # Compare LLM responses
WS     /api/chat/ws             # WebSocket for real-time chat
```

#### Documents
```
POST   /api/documents/upload    # Upload document
GET    /api/documents/          # List documents
GET    /api/documents/{id}      # Get document
DELETE /api/documents/{id}      # Delete document
GET    /api/documents/stats/overview  # Document stats
PUT    /api/documents/{id}/tags # Update document tags
```

#### Tags
```
GET    /api/tags/               # List all tags
POST   /api/tags/               # Create tag
PUT    /api/tags/{id}           # Update tag
DELETE /api/tags/{id}           # Delete tag
GET    /api/tags/{id}/documents # Get documents by tag
```

#### Analytics
```
GET /api/analytics/summary            # Overall metrics
GET /api/analytics/time-series        # Time-based trends
GET /api/analytics/top-topics         # Popular topics
GET /api/analytics/document-usage     # Document stats
GET /api/analytics/real-time          # Real-time metrics
```

#### Activity Logs
```
GET    /api/logs/               # List activity logs
GET    /api/logs/stats          # Log statistics
POST   /api/logs/               # Create log entry
DELETE /api/logs/{id}           # Delete log
```

## 📁 Project Structure

```
rag_system/
├── backend/
│   ├── app/
│   │   ├── api/                    # API endpoints
│   │   │   ├── auth.py             # Authentication
│   │   │   ├── chat.py             # Chat & conversations
│   │   │   ├── documents.py        # Document management
│   │   │   ├── analytics.py        # Analytics & metrics
│   │   │   ├── tags.py             # Document tags
│   │   │   └── activity_logs.py    # Activity logging
│   │   ├── core/                   # Core configuration
│   │   │   ├── config.py           # App settings
│   │   │   ├── database.py         # Database connection
│   │   │   └── security.py         # JWT & auth utils
│   │   ├── models/                 # Database models
│   │   │   ├── user.py             # User model
│   │   │   ├── document.py         # Document model
│   │   │   ├── conversation.py     # Conversation & messages
│   │   │   ├── tag.py              # Tag model
│   │   │   └── activity_log.py     # Activity log model
│   │   ├── schemas/                # Pydantic schemas
│   │   │   ├── auth.py
│   │   │   ├── chat.py
│   │   │   ├── document.py
│   │   │   ├── tag.py
│   │   │   └── activity_log.py
│   │   ├── services/               # Business logic
│   │   │   ├── llm_provider.py     # Multi-LLM integration
│   │   │   ├── vector_store.py     # ChromaDB manager
│   │   │   ├── rag_service.py      # RAG pipeline
│   │   │   └── document_processor.py # Doc processing
│   │   ├── utils/                  # Utilities
│   │   │   └── activity_logger.py  # Activity log helper
│   │   └── main.py                 # FastAPI app
│   ├── data/                       # Data storage
│   │   ├── documents/              # Uploaded files
│   │   └── chroma_db/              # Vector database
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                    # API client
│   │   │   └── client.ts           # Axios client & endpoints
│   │   ├── components/             # React components
│   │   │   ├── Layout.tsx          # Main layout
│   │   │   ├── ThemeToggle.tsx     # Dark mode toggle
│   │   │   ├── Toast.tsx           # Notification toasts
│   │   │   ├── ChatWidget.tsx      # 🆕 Embeddable chat widget
│   │   │   └── ...                 # Other components
│   │   ├── contexts/               # React contexts
│   │   │   ├── AuthContext.tsx     # Auth state
│   │   │   └── ToastContext.tsx    # Toast notifications
│   │   ├── hooks/                  # Custom React hooks
│   │   │   └── useWebSocket.ts     # WebSocket hook
│   │   ├── pages/                  # Page components
│   │   │   ├── ChatPage.tsx        # Main chat interface
│   │   │   ├── DocumentsPage.tsx   # Document management
│   │   │   ├── ComparisonPage.tsx  # LLM comparison
│   │   │   ├── AnalyticsPage.tsx   # Analytics dashboard
│   │   │   ├── ActivityLogsPage.tsx # Activity logs
│   │   │   ├── HistoryPage.tsx     # Chat history
│   │   │   ├── EmbedPage.tsx       # 🆕 Standalone embed page
│   │   │   ├── LoginPage.tsx       # Login
│   │   │   └── RegisterPage.tsx    # Registration
│   │   ├── types/                  # TypeScript types
│   │   ├── utils/                  # Utility functions
│   │   │   ├── cn.ts               # Class name utils
│   │   │   └── pdfExport.ts        # PDF generation
│   │   ├── vite-env.d.ts           # 🆕 Vite environment types
│   │   ├── App.tsx                 # Main app component
│   │   └── main.tsx                # Entry point
│   ├── public/
│   │   └── embed-example.html      # 🆕 Widget integration guide
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env.example
├── sample_documents/               # Sample knowledge base
│   ├── product_catalog.md
│   ├── return_policy.md
│   ├── warranty_terms.md
│   ├── shipping_delivery.md
│   └── faq.md
├── docker-compose.yml              # Docker orchestration
├── setup.sh                        # One-command setup script
├── .env.example                    # Environment template
└── README.md                       # This file
```

## 🐳 Docker Commands

### Common Operations

```bash
# Start all services
docker-compose up -d

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build

# Check service status
docker-compose ps

# Execute command in container
docker-compose exec backend python -c "print('Hello')"
docker-compose exec postgres psql -U postgres -d rag_db
```

### Database Operations

```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d rag_db

# Backup database
docker-compose exec postgres pg_dump -U postgres rag_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres rag_db < backup.sql

# View database tables
docker-compose exec postgres psql -U postgres -d rag_db -c "\dt"
```

## 🚢 Deployment

### Docker Production Deployment

#### 1. Update docker-compose.yml for Production

```yaml
# Set production environment variables
environment:
  DEBUG: "False"
  CORS_ORIGINS: "https://yourdomain.com"

# Use production command
command: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### 2. Production Environment Variables

```bash
# Copy and edit .env for production
cp .env.example .env

# Set production values
DEBUG=False
SECRET_KEY=<generate-with-openssl-rand-hex-32>
DB_PASSWORD=<strong-password>
CORS_ORIGINS=https://yourdomain.com
```

#### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d --build

# Check health
curl http://localhost:8000/health
```

### Manual Deployment (Without Docker)

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

### Production Checklist

- ✅ Set `DEBUG=False` in .env
- ✅ Generate strong `SECRET_KEY` with `openssl rand -hex 32`
- ✅ Use strong database credentials
- ✅ Configure proper `CORS_ORIGINS`
- ✅ Set up HTTPS with SSL certificates
- ✅ Configure firewall rules
- ✅ Set up monitoring and logging
- ✅ Configure automatic backups
- ✅ Use environment secrets management (AWS Secrets Manager, etc.)

## 🔧 Troubleshooting

### Backend Not Starting

```bash
# Check backend logs
docker-compose logs backend

# Common issues:
# 1. Missing API key - Add to .env
# 2. Database connection - Check postgres service
# 3. Port already in use - Change BACKEND_PORT in .env
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Verify API URL
echo $VITE_API_URL  # Should be http://localhost:8000

# Check backend is responding
curl http://localhost:8000/health
```

### Database Issues

```bash
# Restart database
docker-compose restart postgres

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Document Upload Failing

```bash
# Check file permissions
ls -la backend/data/documents/

# Check ChromaDB
docker-compose exec backend ls -la /app/data/chroma_db/

# View backend logs during upload
docker-compose logs -f backend
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase database connection pool in .env
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

# Reduce vector search results
VECTOR_SEARCH_K=3
```

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