import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Divider,
  IconButton,
  Paper,
  Button
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatSessionListProps {
  onSelectSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
}

const ChatSessionList: React.FC<ChatSessionListProps> = ({
  onSelectSession,
  onCreateNewSession
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Not authenticated');
          return;
        }

        const response = await fetch('http://localhost:8000/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }

        const data = await response.json();
        setSessions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleCreateNewSession = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('http://localhost:8000/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'New Chat' })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const newSession = await response.json();
      setSessions(prev => [newSession, ...prev]);
      onSelectSession(newSession.id);
      onCreateNewSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  if (loading) {
    return <Typography>Loading sessions...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Paper elevation={2} sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Chat History</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNewSession}
          size="small"
        >
          New Chat
        </Button>
      </Box>
      <Divider />
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {sessions.length === 0 ? (
          <ListItem>
            <ListItemText primary="No chat sessions yet" />
          </ListItem>
        ) : (
          sessions.map((session) => (
            <React.Fragment key={session.id}>
              <ListItemButton onClick={() => onSelectSession(session.id)}>
                <ListItemText
                  primary={session.title}
                  secondary={new Date(session.updated_at).toLocaleString()}
                />
              </ListItemButton>
              <Divider component="li" />
            </React.Fragment>
          ))
        )}
      </List>
    </Paper>
  );
};

export default ChatSessionList; 