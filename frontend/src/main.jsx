import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.jsx';
import './index.css';
import 'flag-icons/css/flag-icons.min.css';
import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
