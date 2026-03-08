import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        open: true,
        proxy: {
            '/api': {
                target: `http://localhost:${process.env.VITE_API_PORT || 4000}`,
                changeOrigin: true
            }
        }
    }
});