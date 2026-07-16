import { StrictMode } from 'react';
import { render } from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '../App';

render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
  document.getElementById('root')
);
