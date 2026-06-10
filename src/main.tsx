import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext.tsx'
import { EditorProvider } from './contexts/EditorContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <EditorProvider>
        <App />
      </EditorProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
