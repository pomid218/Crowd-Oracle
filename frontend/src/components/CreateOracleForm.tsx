import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Tag, HelpCircle, Loader2 } from 'lucide-react';
import { useWallet } from './WalletContext';
import { createOracle, getCategories } from '../services/oracleService';
import { createOracleOnChain } from '../lib/opnet';

export default function CreateOracleForm() {
  const { wallet, opnetConfig } = useWallet();
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('Crypto');
  const [deadlineDays, setDeadlineDays] = useState(30);
  const [creating, setCreating] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const categories = getCategories().filter((c) => c !== 'All');

  const handleCreate = async () => {
    if (!question.trim() || !wallet || !opnetConfig) return;
    setCreating(true);
    setTxError(null);
    try {
      const deadline = Date.now() + deadlineDays * 24 * 60 * 60 * 1000;

      // Create questionHash from question text (sha256-like via simple hash)
      const encoder = new TextEncoder();
      const data = encoder.encode(question.trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      // Convert first 32 bytes to bigint
      let questionHash = BigInt(0);
      for (let i = 0; i < Math.min(hashArray.length, 32); i++) {
        questionHash = (questionHash << BigInt(8)) | BigInt(hashArray[i]);
      }

      // Call contract
      await createOracleOnChain(opnetConfig, questionHash, BigInt(deadline));

      // Also add to local mock for display (with hex hash)
      const hexHash = '0x' + Array.from(hashArray.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
      const oracle = createOracle(question.trim(), deadline, category);
      oracle.questionHash = hexHash;

      navigate(`/oracle/${oracle.id}`);
    } catch (err) {
      console.error('Create oracle failed:', err);
      setTxError(err instanceof Error ? err.message : 'Create oracle transaction failed');
    } finally {
      setCreating(false);
    }
  };

  const deadlineDate = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-2">Create Oracle</h1>
        <p className="text-text-muted text-sm">
          Create a prediction question and let the crowd decide. Voters stake BTC — winners share the pool.
        </p>
      </div>

      <div className="glass-card p-6 space-y-6">
        {/* Question */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
            <HelpCircle className="w-4 h-4 text-orange" />
            Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will BTC price exceed $200k by 2028?"
            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-orange/50 resize-none h-24"
            maxLength={200}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-text-dim">Must be a yes/no question</span>
            <span className="text-xs text-text-dim">{question.length}/200</span>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
            <Tag className="w-4 h-4 text-orange" />
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                  category === cat
                    ? 'border-orange bg-orange/10 text-orange'
                    : 'border-border bg-card text-text-muted hover:border-text-dim'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
            <Calendar className="w-4 h-4 text-orange" />
            Voting Deadline
          </label>
          <input
            type="range"
            min={1}
            max={365}
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(Number(e.target.value))}
            className="w-full accent-orange"
          />
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-orange font-medium">{deadlineDays} days</span>
            <span className="text-text-dim">
              Expires: {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-xl bg-background border border-border">
          <p className="text-xs text-text-dim mb-2 uppercase tracking-wider">Preview</p>
          <p className="text-sm font-medium text-text mb-2">
            {question || 'Your question will appear here...'}
          </p>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="px-2 py-0.5 rounded bg-card">{category}</span>
            <span>{deadlineDays} days</span>
          </div>
        </div>

        {/* Error */}
        {txError && (
          <div className="p-3 rounded-xl bg-red/10 border border-red/20 text-red text-sm">
            {txError}
          </div>
        )}

        {/* Submit */}
        {wallet ? (
          <button
            onClick={handleCreate}
            disabled={!question.trim() || creating || !opnetConfig}
            className="btn-orange w-full flex items-center justify-center gap-2 py-3"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Oracle...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Oracle
              </>
            )}
          </button>
        ) : (
          <div className="text-center p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-text-muted">Connect your wallet to create an oracle</p>
          </div>
        )}
      </div>
    </div>
  );
}
