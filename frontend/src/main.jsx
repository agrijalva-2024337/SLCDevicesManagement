import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.jsx';
/* Tailwind y tokens primero; el tema de Prime se importa al final de index.css para
   que el preflight no gane y los overrides de paleta sí. */
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
