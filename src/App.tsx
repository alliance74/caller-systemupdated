import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Scripts from './pages/Scripts';
import Campaigns from './pages/Campaigns';
import Contacts from './pages/Contacts';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scripts" element={<Scripts />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/contacts" element={<Contacts />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;