import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container } from '@mui/material';

// Import components
import Login from './components/Login';
import Register from './components/Register';
import ChatInterface from './components/ChatInterface';
import ChatSessionList from './components/ChatSessionList';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Check if user is authenticated on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleRegister = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setSelectedSessionId(null);
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleCreateNewSession = () => {
    setSelectedSessionId(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/chat" /> : 
                <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? 
                <Navigate to="/chat" /> : 
                <Register onRegister={handleRegister} />
              } 
            />
            <Route 
              path="/chat" 
              element={
                isAuthenticated ? (
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <Box sx={{ width: '300px', p: 2, borderRight: '1px solid #e0e0e0' }}>
                      <ChatSessionList 
                        onSelectSession={handleSelectSession}
                        onCreateNewSession={handleCreateNewSession}
                      />
                    </Box>
                    <Box sx={{ flexGrow: 1, p: 2 }}>
                      <ChatInterface sessionId={selectedSessionId || undefined} />
                    </Box>
                  </Box>
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route path="/" element={<Navigate to="/chat" />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App; 