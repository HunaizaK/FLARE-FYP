import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import './styles/index.css';
import 'leaflet/dist/leaflet.css';

const seedAccounts = () => {
  const existing = JSON.parse(localStorage.getItem('flare_accounts') || '[]');
  if (existing.length > 0) return;
  const defaults = [
    { username: 'admin',    password: 'Admin@123',   email: 'admin@flare.com',    contact_no: '03001234567', role: 'admin',        approved: true  },
    { username: 'org1',     password: 'Org@1234',    email: 'org1@flare.com',     contact_no: '03011234567', role: 'organization', approved: true  },
    { username: 'citizen1', password: 'Citizen@1',   email: 'citizen1@flare.com', contact_no: '03021234567', role: 'citizen',      approved: true  },
  ];
  localStorage.setItem('flare_accounts', JSON.stringify(defaults));
};

seedAccounts();

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
);