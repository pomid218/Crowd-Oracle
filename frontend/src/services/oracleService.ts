import type { Oracle, UserVote } from '../types';

// =================== MOCK DATA ===================
// In production: replace with real OP_NET contract calls

const CATEGORIES = ['Crypto', 'Sports', 'Politics', 'Tech', 'Economics', 'Culture'];

const MOCK_ORACLES: Oracle[] = [
  {
    id: 0,
    question: 'Will BTC price exceed $150k by end of 2026?',
    questionHash: '0xabc123',
    creator: 'bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755vpj05gg',
    deadline: Date.now() + 1000 * 60 * 60 * 24 * 90,
    resolved: false,
    result: null,
    totalYes: 42500000,
    totalNo: 28750000,
    category: 'Crypto',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 1,
    question: 'Will Ethereum implement full sharding before 2027?',
    questionHash: '0xdef456',
    creator: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    deadline: Date.now() + 1000 * 60 * 60 * 24 * 180,
    resolved: false,
    result: null,
    totalYes: 15200000,
    totalNo: 31800000,
    category: 'Crypto',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
  },
  {
    id: 2,
    question: 'Will the US approve a national Bitcoin reserve in 2026?',
    questionHash: '0x789abc',
    creator: 'bc1q5d67r2fa3gp2q3ymxfgq2eqaq6hd3dfq2jmv9t',
    deadline: Date.now() + 1000 * 60 * 60 * 24 * 270,
    resolved: false,
    result: null,
    totalYes: 67100000,
    totalNo: 44300000,
    category: 'Politics',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 3,
    question: 'Will AI achieve AGI capabilities by 2030?',
    questionHash: '0xcde789',
    creator: 'bc1qp3k8mu94e54r3q37vfax6drqey2a2fr6k4z5n4',
    deadline: Date.now() + 1000 * 60 * 60 * 24 * 1400,
    resolved: false,
    result: null,
    totalYes: 89400000,
    totalNo: 56700000,
    category: 'Tech',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
  },
  {
    id: 4,
    question: 'Will Bitcoin Lightning Network reach 100k nodes?',
    questionHash: '0xfed321',
    creator: 'bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755vpj05gg',
    deadline: Date.now() - 1000 * 60 * 60 * 24 * 2, // Expired, pending resolution
    resolved: false,
    result: null,
    totalYes: 22100000,
    totalNo: 18700000,
    category: 'Crypto',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
  },
  {
    id: 5,
    question: 'Did the global crypto market cap surpass $5T in Q1 2026?',
    questionHash: '0x456fed',
    creator: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    deadline: Date.now() - 1000 * 60 * 60 * 24 * 10,
    resolved: true,
    result: true,
    totalYes: 55000000,
    totalNo: 38500000,
    category: 'Crypto',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
  },
  {
    id: 6,
    question: 'Will SpaceX successfully land on Mars before 2030?',
    questionHash: '0xaaa111',
    creator: 'bc1q5d67r2fa3gp2q3ymxfgq2eqaq6hd3dfq2jmv9t',
    deadline: Date.now() + 1000 * 60 * 60 * 24 * 1200,
    resolved: false,
    result: null,
    totalYes: 34200000,
    totalNo: 71500000,
    category: 'Tech',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
  },
  {
    id: 7,
    question: 'Will OP_NET TVL exceed 1000 BTC by end of 2026?',
    questionHash: '0xbbb222',
    creator: 'bc1qp3k8mu94e54r3q37vfax6drqey2a2fr6k4z5n4',
    deadline: Date.now() + 1000 * 60 * 60 * 24 * 260,
    resolved: false,
    result: null,
    totalYes: 120500000,
    totalNo: 45800000,
    category: 'Crypto',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
];

let nextId = MOCK_ORACLES.length;

// =================== SERVICE FUNCTIONS ===================

export function getAllOracles(): Oracle[] {
  return [...MOCK_ORACLES].sort((a, b) => b.createdAt - a.createdAt);
}

export function getOracleById(id: number): Oracle | undefined {
  return MOCK_ORACLES.find((o) => o.id === id);
}

export function getOraclesByCategory(category: string): Oracle[] {
  if (category === 'All') return getAllOracles();
  return MOCK_ORACLES.filter((o) => o.category === category).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

export function getCategories(): string[] {
  return ['All', ...CATEGORIES];
}

export function createOracle(question: string, deadline: number, category: string): Oracle {
  const oracle: Oracle = {
    id: nextId++,
    question,
    questionHash: '0x' + Math.random().toString(16).slice(2, 10),
    creator: 'bc1q_your_address_here',
    deadline,
    resolved: false,
    result: null,
    totalYes: 0,
    totalNo: 0,
    category,
    createdAt: Date.now(),
  };
  MOCK_ORACLES.push(oracle);
  return oracle;
}

export function voteOnOracle(oracleId: number, choice: boolean, amount: number): boolean {
  const oracle = MOCK_ORACLES.find((o) => o.id === oracleId);
  if (!oracle) return false;
  if (choice) {
    oracle.totalYes += amount;
  } else {
    oracle.totalNo += amount;
  }
  return true;
}

export function resolveOracle(oracleId: number, result: boolean): boolean {
  const oracle = MOCK_ORACLES.find((o) => o.id === oracleId);
  if (!oracle || oracle.resolved) return false;
  oracle.resolved = true;
  oracle.result = result;
  return true;
}

export function getUserVote(oracleId: number, _address: string): UserVote | null {
  // Mock: return null (no vote) for demo, or simulate a vote
  // In production: call contract getUserVote(oracleId, address)
  if (oracleId === 0) {
    return {
      exists: true,
      choice: true,
      amount: 5000000,
      claimed: false,
    };
  }
  return null;
}

export function getGlobalStats(): {
  totalOracles: number;
  totalPoolBTC: number;
  activeOracles: number;
  resolvedOracles: number;
} {
  const totalPool = MOCK_ORACLES.reduce(
    (sum, o) => sum + o.totalYes + o.totalNo,
    0,
  );
  return {
    totalOracles: MOCK_ORACLES.length,
    totalPoolBTC: totalPool / 1e8,
    activeOracles: MOCK_ORACLES.filter(
      (o) => !o.resolved && Date.now() < o.deadline,
    ).length,
    resolvedOracles: MOCK_ORACLES.filter((o) => o.resolved).length,
  };
}
