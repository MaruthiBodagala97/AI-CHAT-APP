# AI Chat Application

A real-time AI-powered chat application with advanced features like context awareness, sentiment analysis, and multi-modal interactions.

## Features

- Real-time chat with AI using WebSocket
- Context-aware conversations
- Sentiment analysis
- Code generation and explanation
- Image analysis and description
- Voice input/output
- Conversation history
- User authentication
- Multiple AI models support

## Tech Stack

- **Backend:** FastAPI, Python, WebSocket
- **Frontend:** React, TypeScript, Material-UI
- **AI/ML:** LangChain, OpenAI, Hugging Face
- **Database:** PostgreSQL, Redis
- **Authentication:** JWT
- **Testing:** pytest, Jest
- **Deployment:** Docker, Kubernetes

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL
- Redis
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-chat-app.git
cd ai-chat-app
```

2. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Create a `.env` file in the backend directory:
```
OPENAI_API_KEY=your_api_key
SECRET_KEY=your_secret_key
DATABASE_URL=postgresql://user:password@localhost:5432/ai_chat
REDIS_URL=redis://localhost:6379
```

5. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

6. Start the frontend development server:
```bash
cd frontend
npm start
```

## API Documentation

Once the server is running, visit `http://localhost:8000/docs` for the interactive API documentation.

## Testing

Run the backend tests:
```bash
cd backend
pytest
```

Run the frontend tests:
```bash
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for their powerful language models
- FastAPI for the amazing web framework
- React for the frontend framework
- LangChain for the AI/ML framework # AI-CHAT-APP
