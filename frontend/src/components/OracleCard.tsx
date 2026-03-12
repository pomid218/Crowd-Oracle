import { Link } from 'react-router-dom';
import { Clock, Users, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import type { Oracle } from '../types';
import { getOracleStatus, formatBTCShort, timeRemaining, yesPercentage, shortenAddress } from '../types';

interface OracleCardProps {
  oracle: Oracle;
}

export default function OracleCard({ oracle }: OracleCardProps) {
  const status = getOracleStatus(oracle);
  const yesPct = yesPercentage(oracle);
  const totalPool = oracle.totalYes + oracle.totalNo;

  const statusConfig = {
    active: {
      label: 'Active',
      color: 'text-green',
      bgColor: 'bg-green-dim',
      icon: TrendingUp,
    },
    pending_resolution: {
      label: 'Pending',
      color: 'text-orange',
      bgColor: 'bg-orange/10',
      icon: AlertCircle,
    },
    resolved: {
      label: oracle.result ? 'YES Won' : 'NO Won',
      color: oracle.result ? 'text-green' : 'text-red',
      bgColor: oracle.result ? 'bg-green-dim' : 'bg-red-dim',
      icon: CheckCircle,
    },
  };

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  return (
    <Link to={`/oracle/${oracle.id}`} className="block">
      <div className="glass-card p-5 hover:translate-y-[-2px] transition-all duration-200 cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bgColor} ${cfg.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </span>
          <span className="text-xs text-text-dim bg-card px-2 py-1 rounded-lg">
            {oracle.category}
          </span>
        </div>

        {/* Question */}
        <h3 className="text-base font-semibold text-text mb-4 leading-snug group-hover:text-orange transition-colors line-clamp-2">
          {oracle.question}
        </h3>

        {/* Pool Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-green font-medium">YES {yesPct}%</span>
            <span className="text-red font-medium">NO {100 - yesPct}%</span>
          </div>
          <div className="pool-bar">
            <div className="pool-bar-yes" style={{ width: `${yesPct}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Pool: {formatBTCShort(totalPool)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{status === 'active' ? timeRemaining(oracle.deadline) : status === 'resolved' ? 'Resolved' : 'Awaiting'}</span>
          </div>
        </div>

        {/* Creator */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-text-dim">Creator</span>
          <span className="text-text-muted font-mono">{shortenAddress(oracle.creator)}</span>
        </div>
      </div>
    </Link>
  );
}
