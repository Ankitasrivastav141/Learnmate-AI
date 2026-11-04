import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  subtitle?: string;
  icon: LucideIcon | React.ReactNode;
  color?: string;
  trend?: string;
}

export function MetricsCard({
  title,
  value,
  subtext,
  subtitle,
  icon,
  color = '#2563EB',
  trend,
}: MetricsCardProps) {
  const displayText = subtext || subtitle;

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComp = icon as LucideIcon;
      return <IconComp className="w-5 h-5" />;
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#CBD5E1] hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">{title}</p>
          <h3 className="text-2xl font-bold text-[#0F172A] mt-1.5 tracking-tight">{value}</h3>
          {displayText && <p className="text-xs text-[#64748B] mt-1">{displayText}</p>}
        </div>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}35`,
            color: color,
          }}
        >
          {renderIcon()}
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center text-xs text-[#64748B]">
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}
