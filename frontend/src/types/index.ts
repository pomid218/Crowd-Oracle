export interface WalletState {
  connected: boolean;
  address: string;
  publicKey: string;
  balance: number;
  network: string;
}

export interface OpnetConfig {
  provider: any;
  network: any;
  publicKey: string | null;
  signer?: any;
  walletAddress?: string | null;
}

export interface Oracle {
  id: number;
  question: string;
  questionHash: string;
  creator: string;
  deadline: number; // unix timestamp
  resolved: boolean;
  result: boolean | null; // null = unresolved, true = YES, false = NO
  totalYes: number; // satoshis staked on YES
  totalNo: number; // satoshis staked on NO
  category: string;
  createdAt: number;
}

export interface UserVote {
  exists: boolean;
  choice: boolean; // true = YES, false = NO
  amount: number; // satoshis staked
  claimed: boolean;
}

export type OracleStatus = 'active' | 'pending_resolution' | 'resolved';

export function getOracleStatus(oracle: Oracle): OracleStatus {
  if (oracle.resolved) return 'resolved';
  if (Date.now() > oracle.deadline) return 'pending_resolution';
  return 'active';
}

export function formatBTC(satoshis: number): string {
  return (satoshis / 1e8).toFixed(8) + ' BTC';
}

export function formatBTCShort(satoshis: number): string {
  const btc = satoshis / 1e8;
  if (btc >= 1) return btc.toFixed(2) + ' BTC';
  if (btc >= 0.01) return btc.toFixed(4) + ' BTC';
  return btc.toFixed(6) + ' BTC';
}

export function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function timeRemaining(deadline: number): string {
  const now = Date.now();
  const diff = deadline - now;
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function yesPercentage(oracle: Oracle): number {
  const total = oracle.totalYes + oracle.totalNo;
  if (total === 0) return 50;
  return Math.round((oracle.totalYes / total) * 100);
}
