import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthPage } from './AuthPage.jsx';
import '../../../css/base.css';
import '../../../css/auth.css';

createRoot(document.getElementById('root')).render(
  <AuthPage signup={document.body.dataset.page === 'cadastro'} />
);
