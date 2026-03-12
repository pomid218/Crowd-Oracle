import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { WalletState, OpnetConfig } from '../types';

interface WalletContextType {
  wallet: WalletState | null;
  connecting: boolean;
  error: string | null;
  opnetConfig: OpnetConfig | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  connecting: false,
  error: null,
  opnetConfig: null,
  connect: async () => {},
  disconnect: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opnetConfig, setOpnetConfig] = useState<OpnetConfig | null>(null);
  const signerRef = useRef<any>(null);

  // Build opnetConfig whenever wallet changes
  useEffect(() => {
    if (!wallet) {
      setOpnetConfig(null);
      return;
    }

    (async () => {
      try {
        const { createProvider, getBitcoinNetwork, createSigner } = await import('../services/wallet');
        const provider = createProvider();
        const network = getBitcoinNetwork();

        // Create signer (non-fatal if it fails)
        if (!signerRef.current) {
          try {
            signerRef.current = await createSigner();
          } catch (e) {
            console.warn('Failed to create signer:', e);
          }
        }

        setOpnetConfig({
          provider,
          network,
          publicKey: wallet.publicKey,
          signer: signerRef.current,
          walletAddress: wallet.address,
        });
      } catch (e) {
        console.warn('Failed to init opnet config:', e);
      }
    })();
  }, [wallet]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const { connectWallet } = await import('../services/wallet');
      const state = await connectWallet();
      setWallet(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setOpnetConfig(null);
    signerRef.current = null;
    setError(null);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!wallet) return;

    const handleAccountChange = async () => {
      try {
        const { connectWallet } = await import('../services/wallet');
        const state = await connectWallet();
        signerRef.current = null; // reset signer on account change
        setWallet(state);
      } catch {
        setWallet(null);
        setOpnetConfig(null);
      }
    };

    import('../services/wallet').then(({ onAccountChange }) => {
      onAccountChange(handleAccountChange);
    });
  }, [wallet]);

  return (
    <WalletContext.Provider value={{ wallet, connecting, error, opnetConfig, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}
