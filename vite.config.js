import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { attachWsServer } from './ws-server.js';

export default defineConfig({
  base: './',
  server: {
    host: true,
    allowedHosts: true,
  },
  plugins: [
    react(),
    {
      name: 'arena-ws-server',
      configureServer(server) {
        if (server.httpServer) attachWsServer(server.httpServer);
      },
    },
  ],
});
