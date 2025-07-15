import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { WishlistProvider } from './contexts/WishlistContext';
import { OrdersProvider } from './contexts/OrdersContext';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  //   <App />
  // </StrictMode>
  <StrictMode>
    <BrowserRouter>
      <WishlistProvider>
        <OrdersProvider>
      <App />
        </OrdersProvider>
      </WishlistProvider>
    </BrowserRouter>
  </StrictMode>
);
