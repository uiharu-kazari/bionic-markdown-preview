import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'math', test: /node_modules\/katex/, priority: 20 },
            { name: 'react', test: /node_modules\/(react|react-dom|scheduler)\//, priority: 10 },
          ],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
