
import React, { useState } from 'react';
import { ProjectStatus } from '../types';

interface TimelineCellProps {
  value: string;
  status: ProjectStatus;
  projectId: string;
  rowIdx: number;
  colIdx: number;
  onChange: (newValue: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onDrop: (sourceProjectId: string, sourceWeek: number, targetProjectId: string, targetWeek: number) => void;
}

export const TimelineCell: React.FC<TimelineCellProps> = ({ 
  value, 
  status, 
  projectId,
  rowIdx, 
  colIdx, 
  onChange, 
  onKeyDown,
  onDrop
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const getStatusColor = () => {
    if (!value.trim()) return 'bg-white hover:bg-gray-50';

    switch (status) {
      case ProjectStatus.ANGEBOT:
      case ProjectStatus.ANFRAGE:
        return 'bg-green-100 text-green-800';
      case ProjectStatus.AUFTRAG:
        return 'bg-blue-100 text-blue-800';
      case ProjectStatus.ERLEDIGT:
        return 'bg-red-100 text-red-800';
      case ProjectStatus.RECHNUNG:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!value.trim()) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('projectId', projectId);
    e.dataTransfer.setData('week', colIdx.toString());
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a ghost effect class or custom drag image if needed
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDropInternal = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const sourceProjectId = e.dataTransfer.getData('projectId');
    const sourceWeek = parseInt(e.dataTransfer.getData('week'), 10);
    
    if (sourceProjectId && !isNaN(sourceWeek)) {
      onDrop(sourceProjectId, sourceWeek, projectId, colIdx);
    }
  };

  return (
    <div 
      className={`h-full w-full border-r border-gray-200 flex items-stretch transition-all relative
        ${getStatusColor()} 
        ${isDragOver ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' : ''}
        ${value.trim() ? 'cursor-grab active:cursor-grabbing' : ''}`}
      draggable={!!value.trim()}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropInternal}
    >
      <textarea
        data-row={rowIdx}
        data-col={colIdx}
        className="w-full h-full bg-transparent border-none outline-none text-center text-[10px] font-bold uppercase focus:ring-1 focus:ring-blue-400 resize-none overflow-hidden leading-[1.1] pt-1 z-0"
        value={value}
        rows={2}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
      />
      {/* Visual handle indicator when hovering non-empty cells */}
      {value.trim() && (
        <div className="absolute top-0 right-0 p-0.5 opacity-0 group-hover:opacity-100 pointer-events-none">
          <div className="w-1 h-1 bg-gray-400 rounded-full mb-0.5" />
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
        </div>
      )}
    </div>
  );
};
