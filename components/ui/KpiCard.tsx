
import React from 'react';
import Card from './Card';
import { formatCurrencyPHP } from '../../utils/formatters';

interface KpiCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  isLoading?: boolean;
  isCurrency?: boolean;
  change?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, isLoading = false, isCurrency = true, change }) => {
  const isChangeVisible = change !== undefined && isFinite(change);
  const isPositive = isChangeVisible && change >= 0;
  const changeText = isChangeVisible ? `${isPositive ? '+' : ''}${change.toFixed(1)}%` : 'N/A';

  return (
    <Card className="flex-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>
      <div className="mt-2">
        {isLoading ? (
          <div className="h-8 bg-gray-700 rounded-md animate-pulse w-3/4"></div>
        ) : (
          <p className="text-3xl font-bold text-white">{isCurrency ? formatCurrencyPHP(value) : value.toLocaleString()}</p>
        )}
      </div>
      {isChangeVisible && !isLoading && (
        <div className="mt-2 flex items-center text-sm">
            <span className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '▲' : '▼'} {changeText}
            </span>
            <span className="text-gray-500 ml-1">vs. previous period</span>
        </div>
      )}
    </Card>
  );
};

export default KpiCard;
