#!/bin/bash

# RAG System Setup Script
# This script sets up the entire RAG system with one command

set -e  # Exit on error

echo "======================================"
echo "  RAG System - Complete Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
print_info "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed"

# Check if Docker Compose is installed
print_info "Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose is installed"

# Create .env file if it doesn't exist
print_info "Setting up environment variables..."
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cat > .env << EOF
# Database Configuration
DB_USER=raguser
DB_PASSWORD=ragpassword
DB_NAME=rag_db
DB_PORT=5432

# Application Configuration
DEBUG=true
APP_NAME="RAG Customer Support"

# LLM API Keys (Add your own keys here)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Default LLM Settings
DEFAULT_LLM_PROVIDER=openai
DEFAULT_MODEL=gpt-3.5-turbo

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=5173

# Frontend Environment
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/api/chat/ws
EOF
    print_success ".env file created"
    print_warning "IMPORTANT: Please edit .env file and add your LLM API keys!"
    print_warning "At least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY"
    echo ""
    read -p "Press Enter after you've added your API keys to continue..."
else
    print_success ".env file already exists"
fi

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose down 2>/dev/null || true
print_success "Containers stopped"

# Remove old volumes (optional)
read -p "Do you want to remove old data? This will delete all documents and conversations. (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Removing old volumes..."
    docker-compose down -v
    print_success "Old data removed"
fi

# Build containers
print_info "Building Docker containers (this may take a few minutes)..."
docker-compose build
print_success "Containers built successfully"

# Start services
print_info "Starting services..."
docker-compose up -d
print_success "Services started"

# Wait for services to be healthy
print_info "Waiting for services to be ready..."
sleep 5

# Check backend health
print_info "Checking backend health..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend failed to start"
        print_info "Check logs with: docker-compose logs backend"
        exit 1
    fi
    sleep 2
done

# Check frontend
print_info "Checking frontend..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        print_success "Frontend is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Frontend failed to start"
        print_info "Check logs with: docker-compose logs frontend"
        exit 1
    fi
    sleep 2
done

# Print success message
echo ""
echo "======================================"
print_success "Setup Complete!"
echo "======================================"
echo ""
print_info "Services:"
echo "  - Frontend:  http://localhost:5173"
echo "  - Backend:   http://localhost:8000"
echo "  - API Docs:  http://localhost:8000/docs"
echo ""
print_info "Useful Commands:"
echo "  - View logs:        docker-compose logs -f"
echo "  - Stop services:    docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - View status:      docker-compose ps"
echo ""
print_warning "First-time setup:"
echo "  1. Go to http://localhost:5173"
echo "  2. Navigate to 'Documents' and upload your knowledge base files"
echo "  3. Start chatting!"
echo ""
print_info "Opening browser..."
sleep 2
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173 &> /dev/null &
elif command -v open &> /dev/null; then
    open http://localhost:5173 &> /dev/null &
fi

print_success "Enjoy your RAG System! 🚀"
