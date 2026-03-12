import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useWallet } from './WalletContext';
import type { Oracle, UserVote } from '../types';
import { getOracleStatus } from '../types';
import { voteOnChain } from '../lib/opnet';

interface VoteButtonsProps {
  oracle: Oracle;
  userVote: UserVote | null;
  onVoted: () => void;
}

const QUICK_AMOUNTS = [
  { label: '0.001 BTC', value: 100000 },
  { label: '0.005 BTC', value: 500000 },
  { label: '0.01 BTC', value: 1000000 },
  { label: '0.05 BTC', value: 5000000 },
];

export default function VoteButtons({ oracle, userVote, onVoted }: VoteButtonsProps) {
  const { wallet, opnetConfig } = useWallet();
  const [choice, setChoice] = useState<boolean | null>(null);
  const [amount, setAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState('');
  const [voting, setVoting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);

  const status = getOracleStatus(oracle);
  const canVote = status === 'active' && wallet && !userVote;

  const handleVote = async () => {
    if (choice === null || !canVote || !opnetConfig) return;
    setVoting(true);
    setTxError(null);
    setTxSuccess(null);
    try {
      const stakeAmount = customAmount ? Math.round(parseFloat(customAmount) * 1e8) : amount;
      const txId = await voteOnChain(opnetConfig, oracle.id, choice, stakeAmount);
      setTxSuccess(`Transaction sent: ${txId}`);
      onVoted();
    } catch (err) {
      console.error('Vote failed:', err);
      setTxError(err instanceof Error ? err.message : 'Vote transaction failed');
    } finally {
      setVoting(false);
    }
  };

  // Already voted
  if (userVote) {
    return (
      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-text mb-3">Your Vote</h4>
        <div className={`flex items-center gap-3 p-4 rounded-xl ${userVote.choice ? 'bg-green-dim border border-green/20' : 'bg-red-dim border border-red/20'}`}>
          {userVote.choice ? (
            <ThumbsUp className="w-5 h-5 text-green" />
          ) : (
            <ThumbsDown className="w-5 h-5 text-red" />
          )}
          <div>
            <p className={`font-semibold ${userVote.choice ? 'text-green' : 'text-red'}`}>
              You voted {userVote.choice ? 'YES' : 'NO'}
            </p>
            <p className="text-xs text-text-muted">
              Staked: {(userVote.amount / 1e8).toFixed(6)} BTC
            </p>
          </div>
        </div>
        {oracle.resolved && !userVote.claimed && userVote.choice === oracle.result && (
          <button className="btn-orange w-full mt-3">
            Claim Reward
          </button>
        )}
      </div>
    );
  }

  // Oracle not active
  if (status !== 'active') {
    return (
      <div className="glass-card p-5">
        <p className="text-sm text-text-muted text-center">
          {status === 'resolved' ? 'This oracle has been resolved.' : 'Voting period has ended.'}
        </p>
      </div>
    );
  }

  // Not connected
  if (!wallet) {
    return (
      <div className="glass-card p-5 text-center">
        <p className="text-sm text-text-muted mb-2">Connect your wallet to vote</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <h4 className="text-sm font-semibold text-text mb-4">Cast Your Vote</h4>

      {/* Choice buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setChoice(true)}
          className={`btn-yes flex items-center justify-center gap-2 py-3 ${choice === true ? 'active' : ''}`}
        >
          <ThumbsUp className="w-4 h-4" />
          YES
        </button>
        <button
          onClick={() => setChoice(false)}
          className={`btn-no flex items-center justify-center gap-2 py-3 ${choice === false ? 'active' : ''}`}
        >
          <ThumbsDown className="w-4 h-4" />
          NO
        </button>
      </div>

      {/* Stake amount */}
      {choice !== null && (
        <>
          <p className="text-xs text-text-muted mb-2">Stake Amount</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {QUICK_AMOUNTS.map((qa) => (
              <button
                key={qa.value}
                onClick={() => {
                  setAmount(qa.value);
                  setCustomAmount('');
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  amount === qa.value && !customAmount
                    ? 'border-orange bg-orange/10 text-orange'
                    : 'border-border bg-card text-text-muted hover:border-text-dim'
                }`}
              >
                {qa.label}
              </button>
            ))}
          </div>

          <div className="relative mb-4">
            <input
              type="number"
              placeholder="Custom amount (BTC)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-orange/50"
              step="0.001"
              min="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-dim">BTC</span>
          </div>

          {txError && (
            <div className="mb-3 p-3 rounded-xl bg-red/10 border border-red/20 text-red text-xs">
              {txError}
            </div>
          )}

          {txSuccess && (
            <div className="mb-3 p-3 rounded-xl bg-green/10 border border-green/20 text-green text-xs break-all">
              {txSuccess}
            </div>
          )}

          <button
            onClick={handleVote}
            disabled={voting || !opnetConfig}
            className="btn-orange w-full flex items-center justify-center gap-2"
          >
            {voting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                {choice ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                Vote {choice ? 'YES' : 'NO'} &mdash;{' '}
                {customAmount
                  ? `${parseFloat(customAmount).toFixed(4)} BTC`
                  : `${(amount / 1e8).toFixed(4)} BTC`}
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
