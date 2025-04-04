import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Divider,
  IconButton,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { Send as SendIcon, AttachFile as AttachFileIcon, Code as CodeIcon } from '@mui/icons-material';
import AdvancedFeatures from './AdvancedFeatures';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatInterfaceProps {
  sessionId?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const clientId = `client-${Math.random().toString(36).substring(2, 9)}`;
    const ws = new WebSocket(`ws://localhost:8000/ws/${clientId}`);

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        content: data.message,
        sender: 'ai',
        timestamp: new Date(data.timestamp)
      };
      setMessages(prev => [...prev, newMessage]);
      setIsLoading(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsLoading(false);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !socket) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Send message to WebSocket server
    const messageData = {
      session_id: sessionId,
      message: inputMessage,
      timestamp: new Date().toISOString()
    };

    socket.send(JSON.stringify(messageData));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleAdvancedFeatures = () => {
    setShowAdvancedFeatures(!showAdvancedFeatures);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          AI Chat
        </Typography>
        <Tabs value={showAdvancedFeatures ? 1 : 0} onChange={(_, newValue) => setShowAdvancedFeatures(newValue === 1)}>
          <Tab label="Chat" />
          <Tab label="Advanced Features" />
        </Tabs>
      </Paper>

      {showAdvancedFeatures ? (
        <AdvancedFeatures />
      ) : (
        <>
          <Paper 
            elevation={2} 
            sx={{ 
              flexGrow: 1, 
              mb: 2, 
              p: 2, 
              overflow: 'auto',
              maxHeight: 'calc(100vh - 300px)'
            }}
          >
            {messages.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  Start a conversation with the AI assistant
                </Typography>
              </Box>
            ) : (
              messages.map((message) => (
                <Box 
                  key={message.id} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      maxWidth: '70%',
                      backgroundColor: message.sender === 'user' ? '#e3f2fd' : '#f5f5f5'
                    }}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </Box>
              ))
            )}
            <div ref={messagesEndRef} />
          </Paper>

          <Paper elevation={3} sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
              </Grid>
              <Grid item>
                <IconButton color="primary" onClick={toggleAdvancedFeatures}>
                  <CodeIcon />
                </IconButton>
                <IconButton color="primary">
                  <AttachFileIcon />
                </IconButton>
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ChatInterface; 