import { Activity, BarChart3, CheckCircle2, Coins } from 'lucide-react';
import { getGlobalStats } from '../services/oracleService';

export default function StatsBar() {
  const stats = getGlobalStats();

  const items = [
    {
      label: 'Total Oracles',
      value: stats.totalOracles.toString(),
      icon: BarChart3,
      color: 'text-orange',
    },
    {
      label: 'Active',
      value: stats.activeOracles.toString(),
      icon: Activity,
      color: 'text-green',
    },
    {
      label: 'Resolved',
      value: stats.resolvedOracles.toString(),
      icon: CheckCircle2,
      color: 'text-blue',
    },
    {
      label: 'Total Staked',
      value: stats.totalPoolBTC.toFixed(2) + ' BTC',
      icon: Coins,
      color: 'text-orange-light',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div className={`p-2 rounded-xl bg-card ${item.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted">{item.label}</p>
              <p className="text-base font-bold text-text">{item.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
