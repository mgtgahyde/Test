
import React from 'react';
import { ProjectStatus } from '../types';

interface StatusBadgeProps {
  status: ProjectStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case ProjectStatus.ANGEBOT:
      case ProjectStatus.ANFRAGE:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case ProjectStatus.AUFTRAG:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case ProjectStatus.ERLEDIGT:
        return 'bg-red-50 text-red-700 border-red-200';
      case ProjectStatus.RECHNUNG:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStyles()}`}>
      {status}
    </span>
  );
};
