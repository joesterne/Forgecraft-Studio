import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import {
  handleTrends,
  handleGenerateCad,
  handleChat,
  handleEtsyListing,
  handleGenerateMockup,
  handlePrintQuote,
  handleGetLibrary,
  handleSaveLibrary,
  handleDeleteLibrary,
  handleDescribeAndCreate,
} from './server/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// API Endpoints
app.post('/api/trends', handleTrends);
app.post('/api/generate-cad', handleGenerateCad);
app.post('/api/describe-and-create', handleDescribeAndCreate);
app.post('/api/chat', handleChat);
app.post('/api/etsy-listing', handleEtsyListing);
app.post('/api/generate-mockup', handleGenerateMockup);
app.post('/api/print-quote', handlePrintQuote);
app.get('/api/library', handleGetLibrary);
app.post('/api/library', handleSaveLibrary);
app.delete('/api/library/:id', handleDeleteLibrary);

// Serve static frontend in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
