import { Link, useLocation } from 'react-router-dom';
import { Wallet, Zap, Plus, Home, LogOut } from 'lucide-react';
import { useWallet } from './WalletContext';
import { shortenAddress, formatBTCShort } from '../types';

export default function Navbar() {
  const { wallet, connecting, connect, disconnect } = useWallet();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange to-orange-dark flex items-center justify-center group-hover:shadow-lg group-hover:shadow-orange/20 transition-shadow">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-bold text-text hidden sm:block">
              Crowd<span className="text-orange">Oracle</span>
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/')
                  ? 'bg-orange/10 text-orange'
                  : 'text-text-muted hover:text-text hover:bg-card'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Oracles</span>
            </Link>
            <Link
              to="/create"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/create')
                  ? 'bg-orange/10 text-orange'
                  : 'text-text-muted hover:text-text hover:bg-card'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </Link>
          </div>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {/* Testnet badge */}
            <span className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-orange pulse-live" />
              Testnet
            </span>

            {wallet ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end text-xs">
                  <span className="text-text-muted">{formatBTCShort(wallet.balance)}</span>
                  <span className="text-orange font-mono">{shortenAddress(wallet.address)}</span>
                </div>
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-text-muted hover:text-red hover:border-red/30 transition-all text-sm"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={connecting}
                className="btn-orange flex items-center gap-2 text-sm"
              >
                <Wallet className="w-4 h-4" />
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
