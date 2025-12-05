
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import { Layout } from './components/Layout';

// Pages
import { Dashboard } from './pages/Dashboard';
import { ShipmentsPage } from './pages/Shipments';
import { CreateShipment } from './pages/CreateShipment';
import { TrackingPage } from './pages/Tracking';
import { Catalog } from './pages/Catalog';
import { SellerStudio } from './pages/SellerStudio';

const App: React.FC = () => {
  return (
    <Web3Provider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/create" element={<CreateShipment />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/seller-studio" element={<SellerStudio />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </Web3Provider>
  );
};

export default App;
