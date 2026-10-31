import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: string;
  trend?: string;
}

export function MetricsCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = '#652D3D',
  trend,
}: MetricsCardProps) {
  return (
    <div className="bg-white border border-[#E7DFD5] rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#B58B83] hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6E5D59]">{title}</p>
          <h3 className="text-2xl font-bold text-[#252222] mt-1.5 tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-[#6E5D59] mt-1">{subtext}</p>}
        </div>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}35`,
            color: color,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-[#EFE7DD] flex items-center gap-1.5 text-xs text-[#6E5D59]">
          <span className="text-[#652D3D] font-medium">{trend}</span>
          <span>vs last week</span>
        </div>
      )}
    </div>
  );
}
