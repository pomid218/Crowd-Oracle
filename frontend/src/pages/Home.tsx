import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Zap, Filter } from 'lucide-react';
import OracleCard from '../components/OracleCard';
import StatsBar from '../components/StatsBar';
import { getAllOracles, getCategories, getOraclesByCategory } from '../services/oracleService';
import { getOracleStatus } from '../types';

type SortOption = 'newest' | 'pool' | 'deadline';

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const categories = getCategories();

  const oracles = useMemo(() => {
    let filtered = category === 'All' ? getAllOracles() : getOraclesByCategory(category);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((o) => o.question.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => getOracleStatus(o) === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case 'pool':
        filtered.sort((a, b) => (b.totalYes + b.totalNo) - (a.totalYes + a.totalNo));
        break;
      case 'deadline':
        filtered.sort((a, b) => a.deadline - b.deadline);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    return filtered;
  }, [search, category, sortBy, statusFilter]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-surface to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange/5 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange/10 text-orange text-xs font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              Powered by OP_NET on Bitcoin L1
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-text via-text to-orange bg-clip-text text-transparent">
              Crowd Oracle
            </h1>
            <p className="text-text-muted text-base md:text-lg mb-8 max-w-xl mx-auto">
              Decentralized prediction markets on Bitcoin. Create questions, stake BTC, and let the wisdom of the crowd decide.
            </p>
            <Link to="/create" className="btn-orange inline-flex items-center gap-2 text-base px-6 py-3">
              <Plus className="w-5 h-5" />
              Create Oracle
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <StatsBar />

        {/* Filters */}
        <div className="mt-8 space-y-4">
          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type="text"
                placeholder="Search oracles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-card border border-border text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-orange/50"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2.5 rounded-xl bg-card border border-border text-text text-sm focus:outline-none focus:border-orange/50 appearance-none cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="pool">Highest Pool</option>
                <option value="deadline">Ending Soon</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-card border border-border text-text text-sm focus:outline-none focus:border-orange/50 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending_resolution">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-text-dim mr-1 flex-shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-orange text-black'
                    : 'bg-card border border-border text-text-muted hover:text-text'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Oracle Grid */}
        <div className="mt-6">
          {oracles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oracles.map((oracle) => (
                <OracleCard key={oracle.id} oracle={oracle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-text-muted text-lg mb-2">No oracles found</p>
              <p className="text-text-dim text-sm">
                {search ? 'Try a different search term' : 'Be the first to create one!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
