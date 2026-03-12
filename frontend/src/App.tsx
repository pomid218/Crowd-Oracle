import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './components/WalletContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateOracle from './pages/CreateOracle';
import OracleDetail from './pages/OracleDetail';

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <div className="min-h-screen bg-background text-text">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateOracle />} />
            <Route path="/oracle/:id" element={<OracleDetail />} />
          </Routes>
        </div>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;
