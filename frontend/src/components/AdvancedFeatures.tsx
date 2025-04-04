import React, { useState, ChangeEvent, SyntheticEvent } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { Image as ImageIcon, Code as CodeIcon, Sentiment as SentimentIcon } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`advanced-tabpanel-${index}`}
      aria-labelledby={`advanced-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `advanced-tab-${index}`,
    'aria-controls': `advanced-tabpanel-${index}`,
  };
}

interface SentimentResult {
  sentiment: string;
  polarity: number;
  subjectivity: number;
}

interface ImageAnalysisResult {
  description: string;
  tags: string[];
}

interface CodeGenerationResult {
  code: string;
}

const AdvancedFeatures: React.FC = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [sentimentText, setSentimentText] = useState<string>('');
  const [sentimentResult, setSentimentResult] = useState<SentimentResult | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState<boolean>(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<ImageAnalysisResult | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  const [codePrompt, setCodePrompt] = useState<string>('');
  const [codeResult, setCodeResult] = useState<CodeGenerationResult | null>(null);
  const [codeLoading, setCodeLoading] = useState<boolean>(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleTabChange = (event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSentimentAnalysis = async () => {
    if (!sentimentText.trim()) return;
    
    setSentimentLoading(true);
    setSentimentError(null);
    
    try {
      const formData = new FormData();
      formData.append('text', sentimentText);
      
      const response = await fetch('http://localhost:8000/analyze/sentiment', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze sentiment');
      }
      
      const result = await response.json();
      setSentimentResult(result);
    } catch (err) {
      setSentimentError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSentimentLoading(false);
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async () => {
    if (!imageFile) return;
    
    setImageLoading(true);
    setImageError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const response = await fetch('http://localhost:8000/analyze/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }
      
      const result = await response.json();
      setImageResult(result);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setImageLoading(false);
    }
  };

  const handleCodeGeneration = async () => {
    if (!codePrompt.trim()) return;
    
    setCodeLoading(true);
    setCodeError(null);
    
    try {
      const formData = new FormData();
      formData.append('prompt', codePrompt);
      
      const response = await fetch('http://localhost:8000/code/generate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate code');
      }
      
      const result = await response.json();
      setCodeResult(result);
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="advanced features tabs">
          <Tab icon={<SentimentIcon />} label="Sentiment Analysis" {...a11yProps(0)} />
          <Tab icon={<ImageIcon />} label="Image Analysis" {...a11yProps(1)} />
          <Tab icon={<CodeIcon />} label="Code Generation" {...a11yProps(2)} />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Sentiment Analysis
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Enter text to analyze"
          value={sentimentText}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSentimentText(e.target.value)}
          margin="normal"
        />
        <Button
          variant="contained"
          onClick={handleSentimentAnalysis}
          disabled={!sentimentText.trim() || sentimentLoading}
          sx={{ mt: 2 }}
        >
          {sentimentLoading ? <CircularProgress size={24} /> : 'Analyze Sentiment'}
        </Button>
        
        {sentimentError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {sentimentError}
          </Alert>
        )}
        
        {sentimentResult && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Results:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography>
                <strong>Sentiment:</strong> {sentimentResult.sentiment}
              </Typography>
              <Typography>
                <strong>Polarity:</strong> {sentimentResult.polarity.toFixed(2)}
              </Typography>
              <Typography>
                <strong>Subjectivity:</strong> {sentimentResult.subjectivity.toFixed(2)}
              </Typography>
            </Paper>
          </Box>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Image Analysis
        </Typography>
        <Box sx={{ mb: 2 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="image-upload"
            type="file"
            onChange={handleImageChange}
          />
          <label htmlFor="image-upload">
            <Button variant="outlined" component="span">
              Upload Image
            </Button>
          </label>
        </Box>
        
        {imagePreview && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: '200px' }} 
            />
          </Box>
        )}
        
        <Button
          variant="contained"
          onClick={handleImageAnalysis}
          disabled={!imageFile || imageLoading}
          sx={{ mt: 2 }}
        >
          {imageLoading ? <CircularProgress size={24} /> : 'Analyze Image'}
        </Button>
        
        {imageError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {imageError}
          </Alert>
        )}
        
        {imageResult && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Results:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography>
                <strong>Description:</strong> {imageResult.description}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography>
                <strong>Tags:</strong> {imageResult.tags.join(', ')}
              </Typography>
            </Paper>
          </Box>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Code Generation
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Describe the code you want to generate"
          value={codePrompt}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setCodePrompt(e.target.value)}
          margin="normal"
        />
        <Button
          variant="contained"
          onClick={handleCodeGeneration}
          disabled={!codePrompt.trim() || codeLoading}
          sx={{ mt: 2 }}
        >
          {codeLoading ? <CircularProgress size={24} /> : 'Generate Code'}
        </Button>
        
        {codeError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {codeError}
          </Alert>
        )}
        
        {codeResult && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Generated Code:
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                backgroundColor: '#1e1e1e', 
                color: '#fff',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                overflow: 'auto'
              }}
            >
              {codeResult.code}
            </Paper>
          </Box>
        )}
      </TabPanel>
    </Paper>
  );
};

export default AdvancedFeatures; 