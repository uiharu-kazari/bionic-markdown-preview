import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { EditorProvider } from './contexts/EditorContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <EditorProvider>
        <App />
      </EditorProvider>
    </LanguageProvider>
  </StrictMode>
);
