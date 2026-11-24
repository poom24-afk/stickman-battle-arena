import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
['20px "Dela Gothic One"', '20px Kanit'].forEach((f) => document.fonts?.load(f).catch(() => {})); /* โหลดฟอนต์ให้ canvas ใช้ได้ทันที */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
createRoot(document.getElementById('root')).render(<App />);
