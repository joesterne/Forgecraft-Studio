import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import express from 'express';
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

function apiPlugin(): Plugin {
  return {
    name: 'forgecraft-api-plugin',
    configureServer(server) {
      const app = express();
      app.use(express.json({ limit: '20mb' }));

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

      server.middlewares.use(app);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

