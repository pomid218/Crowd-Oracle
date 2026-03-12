import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Users, Coins, CheckCircle, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import VoteButtons from '../components/VoteButtons';
import { getOracleById, getUserVote } from '../services/oracleService';
import { useWallet } from '../components/WalletContext';
import { resolveOracleOnChain, claimRewardOnChain, getUserVoteOnChain } from '../lib/opnet';
import {
  getOracleStatus,
  formatBTCShort,
  timeRemaining,
  yesPercentage,
  shortenAddress,
} from '../types';
import { useState, useEffect } from 'react';

export default function OracleDetail() {
  const { id } = useParams<{ id: string }>();
  const { wallet, opnetConfig } = useWallet();
  const [, setRefresh] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [onChainVote, setOnChainVote] = useState<{ exists: boolean; choice: boolean; amount: number; claimed: boolean } | null>(null);

  const oracle = getOracleById(Number(id));

  // Try to fetch on-chain user vote
  useEffect(() => {
    if (!opnetConfig || !wallet || !oracle) return;
    getUserVoteOnChain(opnetConfig, oracle.id, wallet.address).then((v) => {
      if (v && v.exists) setOnChainVote(v);
    });
  }, [opnetConfig, wallet, oracle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!oracle) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-text-muted text-lg">Oracle not found</p>
        <Link to="/" className="text-orange hover:underline text-sm mt-2 inline-block">
          Back to Oracles
        </Link>
      </div>
    );
  }

  const status = getOracleStatus(oracle);
  const yesPct = yesPercentage(oracle);
  const totalPool = oracle.totalYes + oracle.totalNo;

  // Use on-chain vote if available, otherwise fall back to mock
  const userVote = onChainVote
    ? onChainVote
    : wallet
      ? getUserVote(oracle.id, wallet.address)
      : null;

  const handleResolve = async (result: boolean) => {
    if (!opnetConfig) return;
    setResolving(true);
    setTxError(null);
    setTxSuccess(null);
    try {
      const txId = await resolveOracleOnChain(opnetConfig, oracle.id, result);
      setTxSuccess(`Resolve transaction sent: ${txId}`);
      setRefresh((r) => r + 1);
    } catch (err) {
      console.error('Resolve failed:', err);
      setTxError(err instanceof Error ? err.message : 'Resolve transaction failed');
    } finally {
      setResolving(false);
    }
  };

  const handleClaim = async () => {
    if (!opnetConfig) return;
    setClaiming(true);
    setTxError(null);
    setTxSuccess(null);
    try {
      const txId = await claimRewardOnChain(opnetConfig, oracle.id);
      setTxSuccess(`Claim transaction sent: ${txId}`);
      setRefresh((r) => r + 1);
    } catch (err) {
      console.error('Claim failed:', err);
      setTxError(err instanceof Error ? err.message : 'Claim transaction failed');
    } finally {
      setClaiming(false);
    }
  };

  const handleVoted = () => {
    setRefresh((r) => r + 1);
    // Re-fetch on-chain vote
    if (opnetConfig && wallet) {
      setTimeout(() => {
        getUserVoteOnChain(opnetConfig, oracle.id, wallet.address).then((v) => {
          if (v && v.exists) setOnChainVote(v);
        });
      }, 3000);
    }
  };

  const statusConfig = {
    active: { label: 'Active', color: 'text-green', bg: 'bg-green-dim' },
    pending_resolution: { label: 'Pending Resolution', color: 'text-orange', bg: 'bg-orange/10' },
    resolved: {
      label: oracle.result ? 'Resolved: YES' : 'Resolved: NO',
      color: oracle.result ? 'text-green' : 'text-red',
      bg: oracle.result ? 'bg-green-dim' : 'bg-red-dim',
    },
  };

  const cfg = statusConfig[status];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-orange transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Oracles
      </Link>

      {/* Tx feedback */}
      {txError && (
        <div className="mb-4 p-3 rounded-xl bg-red/10 border border-red/20 text-red text-sm">
          {txError}
        </div>
      )}
      {txSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-green/10 border border-green/20 text-green text-sm break-all">
          {txSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main content - 3 cols */}
        <div className="lg:col-span-3 space-y-6">
          {/* Oracle header */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-xs text-text-dim bg-card px-2 py-1 rounded-lg">
                {oracle.category}
              </span>
              <span className="text-xs text-text-dim">#{oracle.id}</span>
            </div>

            <h1 className="text-lg md:text-xl font-bold text-text mb-6 min-h-[2.5rem] leading-relaxed">
              {oracle.question}
            </h1>

            {/* Pool visualization */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-text-muted mb-1">YES Pool</p>
                  <p className="text-lg font-bold text-green">{formatBTCShort(oracle.totalYes)} <span className="text-xs font-normal text-text-dim">BTC</span></p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-text-muted mb-1">Total Pool</p>
                  <p className="text-lg font-bold text-orange">{formatBTCShort(totalPool)} <span className="text-xs font-normal text-text-dim">BTC</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted mb-1">NO Pool</p>
                  <p className="text-lg font-bold text-red">{formatBTCShort(oracle.totalNo)} <span className="text-xs font-normal text-text-dim">BTC</span></p>
                </div>
              </div>

              {/* Big pool bar */}
              <div className="relative h-12 rounded-xl overflow-hidden bg-red/20">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green to-green/70 transition-all duration-500 rounded-l-xl flex items-center justify-center"
                  style={{ width: `${yesPct}%` }}
                >
                  {yesPct > 15 && (
                    <span className="text-sm font-bold text-black">{yesPct}% YES</span>
                  )}
                </div>
                {100 - yesPct > 15 && (
                  <div
                    className="absolute inset-y-0 right-0 flex items-center justify-center"
                    style={{ width: `${100 - yesPct}%` }}
                  >
                    <span className="text-sm font-bold text-red">{100 - yesPct}% NO</span>
                  </div>
                )}
              </div>

              {/* If YES, payout ratio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-green/5 border border-green/10">
                  <p className="text-xs text-text-muted mb-1">YES Payout</p>
                  <p className="text-base font-bold text-green">
                    {oracle.totalYes > 0
                      ? (totalPool / oracle.totalYes).toFixed(2) + 'x'
                      : '-.--x'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red/5 border border-red/10">
                  <p className="text-xs text-text-muted mb-1">NO Payout</p>
                  <p className="text-base font-bold text-red">
                    {oracle.totalNo > 0
                      ? (totalPool / oracle.totalNo).toFixed(2) + 'x'
                      : '-.--x'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Oracle details */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-text mb-4">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-text-dim" />
                <div>
                  <p className="text-xs text-text-dim">Deadline</p>
                  <p className="text-sm text-text">
                    {new Date(oracle.deadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-text-dim" />
                <div>
                  <p className="text-xs text-text-dim">Time Remaining</p>
                  <p className="text-sm text-text">{timeRemaining(oracle.deadline)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-text-dim" />
                <div>
                  <p className="text-xs text-text-dim">Creator</p>
                  <p className="text-sm text-orange font-mono">{shortenAddress(oracle.creator)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Coins className="w-4 h-4 text-text-dim" />
                <div>
                  <p className="text-xs text-text-dim">Total Pool</p>
                  <p className="text-sm text-text">{formatBTCShort(totalPool)} BTC</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resolve panel (if pending resolution) */}
          {status === 'pending_resolution' && (
            <div className="glass-card p-6 border-orange/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange" />
                <h3 className="text-sm font-semibold text-orange">Resolution Required</h3>
              </div>
              <p className="text-sm text-text-muted mb-4">
                The voting period has ended. Anyone can resolve this oracle now.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleResolve(true)}
                  disabled={resolving || !opnetConfig}
                  className="btn-yes py-3 flex items-center justify-center gap-2"
                >
                  {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Resolve YES
                </button>
                <button
                  onClick={() => handleResolve(false)}
                  disabled={resolving || !opnetConfig}
                  className="btn-no py-3 flex items-center justify-center gap-2"
                >
                  {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Resolve NO
                </button>
              </div>
            </div>
          )}

          {/* Resolved result */}
          {status === 'resolved' && (
            <div
              className={`glass-card p-6 ${
                oracle.result ? 'border-green/20' : 'border-red/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className={`w-5 h-5 ${oracle.result ? 'text-green' : 'text-red'}`} />
                <h3 className={`text-lg font-bold ${oracle.result ? 'text-green' : 'text-red'}`}>
                  Result: {oracle.result ? 'YES' : 'NO'}
                </h3>
              </div>
              <p className="text-sm text-text-muted">
                This oracle has been resolved. Winners can claim their rewards.
              </p>
              {/* Claim button for winners */}
              {userVote && userVote.exists && !userVote.claimed && userVote.choice === oracle.result && (
                <button
                  onClick={handleClaim}
                  disabled={claiming || !opnetConfig}
                  className="btn-orange w-full mt-4 flex items-center justify-center gap-2"
                >
                  {claiming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    'Claim Reward'
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vote panel */}
          <VoteButtons oracle={oracle} userVote={userVote} onVoted={handleVoted} />

          {/* Contract info */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-text-dim" />
              <h4 className="text-sm font-semibold text-text">Contract Info</h4>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-text-dim">Network</span>
                <span className="text-orange font-medium">OP_NET Testnet</span>
              </div>
              <div>
                <span className="text-text-dim block mb-1">Contract Address</span>
                <span className="text-text-muted font-mono text-[10px] break-all leading-relaxed select-all">
                  {import.meta.env.VITE_CONTRACT_ADDRESS || 'Not configured'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Oracle ID</span>
                <span className="text-text-muted font-medium">#{oracle.id}</span>
              </div>
              <div>
                <span className="text-text-dim block mb-1">Question Hash</span>
                <span className="text-text-muted font-mono text-[10px] break-all select-all">{oracle.questionHash}</span>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="glass-card p-5">
            <h4 className="text-sm font-semibold text-text mb-3">How It Works</h4>
            <ol className="space-y-2 text-xs text-text-muted">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange/10 text-orange text-xs flex items-center justify-center font-bold">1</span>
                <span>Connect your OP Wallet</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange/10 text-orange text-xs flex items-center justify-center font-bold">2</span>
                <span>Choose YES or NO and stake BTC</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange/10 text-orange text-xs flex items-center justify-center font-bold">3</span>
                <span>After deadline, anyone resolves the oracle</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange/10 text-orange text-xs flex items-center justify-center font-bold">4</span>
                <span>Winners share the full reward pool</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
