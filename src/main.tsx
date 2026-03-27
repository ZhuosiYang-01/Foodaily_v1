import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import posthog from 'posthog-js';
import App from './App.tsx';
import './index.css';

posthog.init('phc_1T0dmJqWANgI0wI4PGtOg0uTa5JSDvhSxkfJ1U437Ti', {
  api_host: 'https://app.posthog.com',
  capture_pageview: false,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
