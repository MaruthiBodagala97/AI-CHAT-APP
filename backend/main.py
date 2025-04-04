from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
from pydantic import BaseModel
import json
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain.agents import Tool, AgentExecutor, LLMChain
from langchain.prompts import PromptTemplate
import redis
import asyncio
import uuid
import base64
from io import BytesIO
from PIL import Image
import io
import aiohttp
import numpy as np
from textblob import TextBlob
import logging

# Import authentication module
from auth import (
    User, UserInDB, Token, TokenData, 
    authenticate_user, create_access_token, 
    get_current_active_user, fake_users_db
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Chat Application",
    description="Real-time AI chat application with WebSocket support",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Redis connection
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0
)

# Models
class Message(BaseModel):
    content: str
    role: str
    timestamp: datetime

class ChatSession(BaseModel):
    id: str
    user_id: Optional[str] = None
    messages: List[Message]
    created_at: datetime
    updated_at: datetime
    title: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None

class SentimentResponse(BaseModel):
    sentiment: str
    polarity: float
    subjectivity: float

class ImageAnalysisResponse(BaseModel):
    description: str
    tags: List[str]

class CodeGenerationResponse(BaseModel):
    code: str

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.chat_sessions: Dict[str, ChatSession] = {}
        self.user_sessions: Dict[str, List[str]] = {}  # user_id -> [session_ids]

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

    def get_chat_session(self, session_id: str) -> Optional[ChatSession]:
        return self.chat_sessions.get(session_id)

    def create_chat_session(self, user_id: Optional[str] = None, title: Optional[str] = None) -> ChatSession:
        session_id = str(uuid.uuid4())
        session = ChatSession(
            id=session_id,
            user_id=user_id,
            messages=[],
            created_at=datetime.now(),
            updated_at=datetime.now(),
            title=title or "New Chat"
        )
        self.chat_sessions[session_id] = session
        
        # Associate session with user if provided
        if user_id:
            if user_id not in self.user_sessions:
                self.user_sessions[user_id] = []
            self.user_sessions[user_id].append(session_id)
        
        return session

    def add_message_to_session(self, session_id: str, message: Message):
        if session_id in self.chat_sessions:
            self.chat_sessions[session_id].messages.append(message)
            self.chat_sessions[session_id].updated_at = datetime.now()
            
            # Update session title if it's the first message
            if len(self.chat_sessions[session_id].messages) == 1 and message.role == "user":
                self.chat_sessions[session_id].title = message.content[:30] + "..." if len(message.content) > 30 else message.content

    def get_user_sessions(self, user_id: str) -> List[ChatSession]:
        if user_id not in self.user_sessions:
            return []
        return [self.chat_sessions[session_id] for session_id in self.user_sessions[user_id]]

manager = ConnectionManager()

# AI Chat setup
def get_chat_model():
    return ChatOpenAI(
        temperature=0.7,
        model_name="gpt-3.5-turbo"
    )

def get_conversation_chain():
    llm = get_chat_model()
    memory = ConversationBufferMemory()
    return ConversationChain(llm=llm, memory=memory)

# Sentiment analysis
def analyze_sentiment(text: str) -> SentimentResponse:
    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity
    
    if polarity > 0.1:
        sentiment = "positive"
    elif polarity < -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"
        
    return SentimentResponse(
        sentiment=sentiment,
        polarity=polarity,
        subjectivity=analysis.sentiment.subjectivity
    )

# Image analysis
async def analyze_image(image_data: bytes) -> ImageAnalysisResponse:
    # In a real application, you would use a proper image analysis API
    # For this example, we'll use a mock response
    return ImageAnalysisResponse(
        description="A beautiful landscape with mountains and a lake",
        tags=["landscape", "mountains", "lake", "nature", "outdoors"]
    )

# Routes
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Create or get chat session
            session = manager.get_chat_session(message_data.get("session_id"))
            if not session:
                session = manager.create_chat_session(
                    user_id=message_data.get("user_id"),
                    title=message_data.get("title")
                )
            
            # Create message objects
            user_message = Message(
                content=message_data["message"],
                role="user",
                timestamp=datetime.now()
            )
            
            # Add user message to session
            manager.add_message_to_session(session.id, user_message)
            
            # Get AI response
            conversation = get_conversation_chain()
            ai_response = conversation.predict(input=message_data["message"])
            
            # Create AI message
            ai_message = Message(
                content=ai_response,
                role="assistant",
                timestamp=datetime.now()
            )
            
            # Add AI message to session
            manager.add_message_to_session(session.id, ai_message)
            
            # Send response back to client
            await manager.send_message(
                json.dumps({
                    "session_id": session.id,
                    "message": ai_response,
                    "timestamp": datetime.now().isoformat()
                }),
                client_id
            )
            
    except WebSocketDisconnect:
        manager.disconnect(client_id)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate):
    if user.username in fake_users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # In a real application, you would save to a database
    fake_users_db[user.username] = {
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "hashed_password": get_password_hash(user.password),
        "disabled": False,
    }
    
    return UserResponse(
        username=user.username,
        email=user.email,
        full_name=user.full_name
    )

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to AI Chat Application API"}

@app.get("/sessions/{session_id}")
async def get_session(session_id: str, current_user: User = Depends(get_current_active_user)):
    """Get chat session by ID"""
    session = manager.get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if the session belongs to the user
    if session.user_id and session.user_id != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    
    return session

@app.post("/sessions")
async def create_session(
    title: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new chat session"""
    session = manager.create_chat_session(user_id=current_user.username, title=title)
    return session

@app.get("/sessions")
async def get_user_sessions(current_user: User = Depends(get_current_active_user)):
    """Get all sessions for the current user"""
    return manager.get_user_sessions(current_user.username)

@app.post("/analyze/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(text: str = Form(...)):
    """Analyze the sentiment of a text"""
    try:
        analysis = TextBlob(text)
        polarity = analysis.sentiment.polarity
        subjectivity = analysis.sentiment.subjectivity
        
        # Determine sentiment label based on polarity
        if polarity > 0.1:
            sentiment = "positive"
        elif polarity < -0.1:
            sentiment = "negative"
        else:
            sentiment = "neutral"
            
        return SentimentResponse(
            sentiment=sentiment,
            polarity=polarity,
            subjectivity=subjectivity
        )
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze sentiment")

@app.post("/analyze/image", response_model=ImageAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """Analyze an image and return description and tags"""
    try:
        # Read the image file
        contents = await file.read()
        image = Image.open(BytesIO(contents))
        
        # In a real application, you would use a proper image analysis API
        # For this example, we'll use a mock response
        # You could integrate with services like Google Cloud Vision, Azure Computer Vision, etc.
        
        # Mock response for demonstration
        return ImageAnalysisResponse(
            description="A beautiful landscape with mountains and a lake",
            tags=["landscape", "mountains", "lake", "nature", "outdoors"]
        )
    except Exception as e:
        logger.error(f"Error in image analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze image")

@app.post("/code/generate", response_model=CodeGenerationResponse)
async def generate_code(prompt: str = Form(...)):
    """Generate code based on a prompt"""
    try:
        # Initialize the language model
        llm = ChatOpenAI(
            temperature=0.7,
            model_name="gpt-3.5-turbo"
        )
        
        # Create a prompt template for code generation
        template = """
        You are an expert programmer. Generate code based on the following prompt:
        {prompt}
        
        Provide only the code without explanations, unless specifically asked.
        """
        
        prompt_template = PromptTemplate(
            input_variables=["prompt"],
            template=template
        )
        
        # Create a chain for code generation
        chain = LLMChain(llm=llm, prompt=prompt_template)
        result = chain.run(prompt=prompt)
        
        return CodeGenerationResponse(code=result)
    except Exception as e:
        logger.error(f"Error in code generation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate code")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 