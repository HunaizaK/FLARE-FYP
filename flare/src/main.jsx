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
    { userName: 'admin',    password: 'Admin@123',   email: 'admin@flare.com',    contactNo: '03001234567', role: 'admin',        approved: true  },
    { userName: 'org1',     password: 'Org@1234',    email: 'org1@flare.com',     contactNo: '03011234567', role: 'organization', approved: true  },
    { userName: 'citizen1', password: 'Citizen@1',   email: 'citizen1@flare.com', contactNo: '03021234567', role: 'citizen',      approved: true  },
  ];
  localStorage.setItem('flare_accounts', JSON.stringify(defaults));
};

seedAccounts();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);