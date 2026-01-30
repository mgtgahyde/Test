
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Filter, Settings, Bell, Plus, Trash2, X } from 'lucide-react';
import { MOCK_PROJECTS, MONTHS } from './constants';
import { ProjectStatus, Project } from './types';
import { StatusBadge } from './components/StatusBadge';
import { TimelineCell } from './components/TimelineCell';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  
  const [newProject, setNewProject] = useState<Partial<Project>>({
    status: ProjectStatus.ANGEBOT,
    ort: '',
    bauvorhaben: '',
    auftraggeber: '',
    summe: 0,
    kzl_ktr: 'NEU',
    l_gewerk: 'HLS',
    abgabe: '',
    pl: '',
    bl_ma: '',
    statusInfo: '',
  });

  useEffect(() => {
    // Calculate current ISO week
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime() + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000;
    const oneDay = 86400000;
    const day = Math.floor(diff / oneDay);
    const week = Math.ceil((day + start.getDay() + 1) / 7);
    setCurrentWeek(Math.min(Math.max(week, 1), 52));
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.bauvorhaben.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.ort.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.auftraggeber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = activeStatusFilter === 'All' || p.status === activeStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, activeStatusFilter]);

  const handleTimelineChange = (projectId: string, week: number, newValue: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      
      const existingEntryIndex = p.timeline.findIndex(t => t.week === week);
      const newTimeline = [...p.timeline];
      
      if (existingEntryIndex >= 0) {
        if (!newValue.trim()) {
          newTimeline.splice(existingEntryIndex, 1);
        } else {
          newTimeline[existingEntryIndex] = { ...newTimeline[existingEntryIndex], code: newValue };
        }
      } else if (newValue.trim()) {
        newTimeline.push({ week, code: newValue, type: 'execution' });
      }
      
      return { ...p, timeline: newTimeline };
    }));
  };

  const handleTimelineDrop = (sourceProjectId: string, sourceWeek: number, targetProjectId: string, targetWeek: number) => {
    if (sourceProjectId === targetProjectId && sourceWeek === targetWeek) return;

    setProjects(prev => {
      const sourceProject = prev.find(p => p.id === sourceProjectId);
      if (!sourceProject) return prev;
      
      const sourceEntry = sourceProject.timeline.find(t => t.week === sourceWeek);
      if (!sourceEntry) return prev;

      const movingValue = sourceEntry.code;

      return prev.map(p => {
        let newTimeline = [...p.timeline];
        
        // Remove from source
        if (p.id === sourceProjectId) {
          newTimeline = newTimeline.filter(t => t.week !== sourceWeek);
        }
        
        // Add to target
        if (p.id === targetProjectId) {
          // Remove existing at target first if any
          newTimeline = newTimeline.filter(t => t.week !== targetWeek);
          newTimeline.push({ week: targetWeek, code: movingValue, type: sourceEntry.type });
        }
        
        return { ...p, timeline: newTimeline };
      });
    });
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Möchten Sie dieses Projekt wirklich löschen?')) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddProject = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const project: Project = {
      ...newProject as Project,
      id,
      timeline: [],
    };
    setProjects(prev => [project, ...prev]);
    setIsAddModalOpen(false);
    setNewProject({
      status: ProjectStatus.ANGEBOT,
      ort: '',
      bauvorhaben: '',
      auftraggeber: '',
      summe: 0,
      kzl_ktr: 'NEU',
      l_gewerk: 'HLS',
      abgabe: '',
      pl: '',
      bl_ma: '',
      statusInfo: '',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, row: number, col: number) => {
    let nextRow = row;
    let nextCol = col;

    if (e.key === 'Enter' && !e.shiftKey) {
        return;
    }

    switch (e.key) {
      case 'ArrowUp':
        if (e.currentTarget.selectionStart === 0 || e.ctrlKey || e.metaKey) {
            nextRow--;
        } else return;
        break;
      case 'ArrowDown':
        if (e.currentTarget.selectionStart === e.currentTarget.value.length || e.ctrlKey || e.metaKey) {
            nextRow++;
        } else return;
        break;
      case 'ArrowLeft':
        if (e.currentTarget.selectionStart === 0 || e.ctrlKey || e.metaKey) {
            nextCol--;
        } else return;
        break;
      case 'ArrowRight':
        if (e.currentTarget.selectionStart === e.currentTarget.value.length || e.ctrlKey || e.metaKey) {
            nextCol++;
        } else return;
        break;
      default:
        return;
    }

    const target = document.querySelector(`[data-row="${nextRow}"][data-col="${nextCol}"]`) as HTMLElement;
    if (target) {
      e.preventDefault();
      target.focus();
      if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
        (target as any).setSelectionRange(0, (target as any).value.length);
      }
    }
  };

  const totalSum = filteredProjects.reduce((acc, p) => acc + p.summe, 0);

  // Width definitions
  const COL_WIDTHS = {
    actions: 40,
    kzl: 56,
    status: 112,
    ort: 200,
    bauvorhaben: 300,
    l: 64,
    auftraggeber: 180,
    summe: 100,
    abgabe: 80,
    pl: 36,
    bl: 36,
    ma: 36,
  };

  // Pre-calculate cumulative left positions
  const stickyLeft = {
    actions: 0,
    kzl: COL_WIDTHS.actions,
    status: COL_WIDTHS.actions + COL_WIDTHS.kzl,
    ort: COL_WIDTHS.actions + COL_WIDTHS.kzl + COL_WIDTHS.status,
    bauvorhaben: COL_WIDTHS.actions + COL_WIDTHS.kzl + COL_WIDTHS.status + COL_WIDTHS.ort,
    l: COL_WIDTHS.actions + COL_WIDTHS.kzl + COL_WIDTHS.status + COL_WIDTHS.ort + COL_WIDTHS.bauvorhaben,
    auftraggeber: COL_WIDTHS.actions + COL_WIDTHS.kzl + COL_WIDTHS.status + COL_WIDTHS.ort + COL_WIDTHS.bauvorhaben + COL_WIDTHS.l,
    summe: COL_WIDTHS.actions + COL_WIDTHS.kzl + COL_WIDTHS.status + COL_WIDTHS.ort + COL_WIDTHS.bauvorhaben + COL_WIDTHS.l + COL_WIDTHS.auftraggeber,
    abgabe: COL_WIDTHS.actions + COL_WIDTHS.kzl + COL_WIDTHS.status + COL_WIDTHS.ort + COL_WIDTHS.bauvorhaben + COL_WIDTHS.l + COL_WIDTHS.auftraggeber + COL_WIDTHS.summe,
    pl: COL_WIDTHS.actions + COL_WIDTHS.kzl + COL_WIDTHS.status + COL_WIDTHS.ort + COL_WIDTHS.bauvorhaben + COL_WIDTHS.l + COL_WIDTHS.auftraggeber + COL_WIDTHS.summe + COL_WIDTHS.abgabe,
    bl: COL_WIDTHS.actions + COL_WIDTHS.kzl + COL_WIDTHS.status + COL_WIDTHS.ort + COL_WIDTHS.bauvorhaben + COL_WIDTHS.l + COL_WIDTHS.auftraggeber + COL_WIDTHS.summe + COL_WIDTHS.abgabe + COL_WIDTHS.pl,
    ma: COL_WIDTHS.actions + COL_WIDTHS.kzl + COL_WIDTHS.status + COL_WIDTHS.ort + COL_WIDTHS.bauvorhaben + COL_WIDTHS.l + COL_WIDTHS.auftraggeber + COL_WIDTHS.summe + COL_WIDTHS.abgabe + COL_WIDTHS.pl + COL_WIDTHS.bl,
  };

  const totalStickyWidth = stickyLeft.ma + COL_WIDTHS.ma;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">T</div>
            <div className="leading-tight">
              <h1 className="font-bold text-gray-900">TGA Hoyerswerda GmbH</h1>
              <p className="text-xs text-gray-500">Projektübersicht & Kapazitätsplanung</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">Gesamtsumme (gefiltert)</span>
            <span className="text-lg font-bold text-blue-600">€ {totalSum.toLocaleString('de-DE')}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Suche nach Projekt, Ort..." 
              className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-64 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Bell className="w-5 h-5" /></button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Settings className="w-5 h-5" /></button>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">JD</div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-2 flex items-center justify-between text-sm shadow-sm z-20">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveStatusFilter('All')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${activeStatusFilter === 'All' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Alle Projekte
          </button>
          {Object.values(ProjectStatus).map(status => (
            <button 
              key={status}
              onClick={() => setActiveStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${activeStatusFilter === status ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Projekt hinzufügen
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 border rounded-md hover:bg-gray-50 text-gray-700 font-medium">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 border rounded-md hover:bg-gray-50 text-gray-700 font-medium">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 overflow-auto relative">
        <table className="border-collapse table-fixed min-w-max">
          <thead className="sticky top-0 z-40">
            {/* Top Month Header */}
            <tr className="bg-slate-800 text-white text-[11px] font-bold">
              <th 
                colSpan={12} 
                style={{ width: totalStickyWidth + COL_WIDTHS.actions }}
                className="p-2 border-r border-slate-700 sticky left-0 bg-slate-800 text-left z-50 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"
              >
                PROJEKTDETAILS
              </th>
              {MONTHS.map(month => (
                <th key={month.name} colSpan={month.weeks.length} className="border-r border-slate-700 p-2 text-center uppercase tracking-wider">
                  {month.name}
                </th>
              ))}
            </tr>
            {/* Sub-Header */}
            <tr className="bg-slate-700 text-white text-[10px] font-medium border-b border-slate-600">
              <th style={{ width: COL_WIDTHS.actions, left: stickyLeft.actions }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40"></th>
              <th style={{ width: COL_WIDTHS.kzl, left: stickyLeft.kzl }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40">KZL</th>
              <th style={{ width: COL_WIDTHS.status, left: stickyLeft.status }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40">Status</th>
              <th style={{ width: COL_WIDTHS.ort, left: stickyLeft.ort }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40">Ort</th>
              <th style={{ width: COL_WIDTHS.bauvorhaben, left: stickyLeft.bauvorhaben }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40">Bauvorhaben</th>
              <th style={{ width: COL_WIDTHS.l, left: stickyLeft.l }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40">L</th>
              <th style={{ width: COL_WIDTHS.auftraggeber, left: stickyLeft.auftraggeber }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40">Auftraggeber</th>
              <th style={{ width: COL_WIDTHS.summe, left: stickyLeft.summe }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40 text-right">Summe €</th>
              <th style={{ width: COL_WIDTHS.abgabe, left: stickyLeft.abgabe }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40">Abgabe</th>
              <th style={{ width: COL_WIDTHS.pl, left: stickyLeft.pl }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40">PL</th>
              <th style={{ width: COL_WIDTHS.bl, left: stickyLeft.bl }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40">BL</th>
              <th style={{ width: COL_WIDTHS.ma, left: stickyLeft.ma }} className="p-1 sticky bg-slate-700 border-r border-slate-600 z-40 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">MA</th>
              {Array.from({ length: 52 }, (_, i) => {
                const weekNum = i + 1;
                const isCurrent = weekNum === currentWeek;
                return (
                  <th 
                    key={weekNum} 
                    className={`w-[30px] p-1 text-center border-r border-slate-600 text-[9px] transition-colors ${isCurrent ? 'bg-amber-500 text-slate-900 font-black' : ''}`}
                  >
                    {weekNum}
                  </th>
                );
              })}
            </tr>
          </thead>
          
          <tbody className="bg-white">
            {filteredProjects.map((project, idx) => (
              <tr key={project.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors group border-b text-[11px]`}>
                {/* Actions sticky */}
                <td style={{ left: stickyLeft.actions }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 text-center h-[38px]">
                  <button 
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
                {/* Project Details Columns - all sticky */}
                <td style={{ left: stickyLeft.kzl }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 font-mono text-gray-500 h-[38px]">{project.kzl_ktr}</td>
                <td style={{ left: stickyLeft.status }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 h-[38px]"><StatusBadge status={project.status} /></td>
                <td style={{ left: stickyLeft.ort }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 font-medium truncate h-[38px]">{project.ort}</td>
                <td style={{ left: stickyLeft.bauvorhaben }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 h-[38px]">
                  <div className="font-semibold text-gray-800 truncate leading-tight">{project.bauvorhaben}</div>
                  <div className="text-[9px] text-gray-400 italic truncate">{project.statusInfo}</div>
                </td>
                <td style={{ left: stickyLeft.l }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 text-center text-gray-600 font-bold h-[38px]">{project.l_gewerk}</td>
                <td style={{ left: stickyLeft.auftraggeber }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 truncate text-gray-600 h-[38px]">{project.auftraggeber}</td>
                <td style={{ left: stickyLeft.summe }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 text-right font-mono font-bold text-blue-600 h-[38px]">{project.summe.toLocaleString('de-DE')}</td>
                <td style={{ left: stickyLeft.abgabe }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 text-center text-gray-500 h-[38px]">{project.abgabe}</td>
                <td style={{ left: stickyLeft.pl }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 text-center font-bold text-gray-600 h-[38px]">{project.pl}</td>
                <td style={{ left: stickyLeft.bl }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 text-center font-bold text-gray-600 h-[38px]">{project.bl_ma.slice(0, 1)}</td>
                <td style={{ left: stickyLeft.ma }} className="p-2 border-r sticky z-10 bg-inherit group-hover:bg-blue-50 text-center font-bold text-gray-600 shadow-[2px_0_5px_rgba(0,0,0,0.05)] h-[38px]">{project.bl_ma.slice(1)}</td>

                {/* Timeline Columns - these scroll */}
                {Array.from({ length: 52 }, (_, i) => {
                  const weekNum = i + 1;
                  const isCurrent = weekNum === currentWeek;
                  const entry = project.timeline.find(t => t.week === weekNum);
                  return (
                    <td key={weekNum} className={`p-0 border-r h-[38px] align-stretch relative ${isCurrent ? 'bg-amber-50/40 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]' : ''}`}>
                      <TimelineCell 
                        value={entry?.code || ''} 
                        status={project.status}
                        projectId={project.id}
                        rowIdx={idx}
                        colIdx={weekNum}
                        onChange={(val) => handleTimelineChange(project.id, weekNum, val)}
                        onKeyDown={(e) => handleKeyDown(e, idx, weekNum)}
                        onDrop={handleTimelineDrop}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Neues Projekt erstellen</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bauvorhaben</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newProject.bauvorhaben}
                  onChange={e => setNewProject({...newProject, bauvorhaben: e.target.value})}
                  placeholder="Projektbezeichnung..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ort</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newProject.ort}
                    onChange={e => setNewProject({...newProject, ort: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Auftraggeber</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newProject.auftraggeber}
                    onChange={e => setNewProject({...newProject, auftraggeber: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Summe (€)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newProject.summe}
                    onChange={e => setNewProject({...newProject, summe: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newProject.status}
                    onChange={e => setNewProject({...newProject, status: e.target.value as ProjectStatus})}
                  >
                    {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-md transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleAddProject}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                Projekt anlegen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer / Legend */}
      <footer className="bg-white border-t p-3 text-[10px] flex items-center justify-between text-gray-500 shadow-inner z-30">
        <div className="flex items-center gap-6">
          <span className="font-bold text-gray-400 uppercase tracking-widest">Legende:</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border rounded" /> Angebot / Anfrage</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 border rounded" /> Auftrag / Ausführung</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border rounded" /> Erledigt</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-100 border rounded" /> Rechnung</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1"><strong>ANG:</strong> Angebot</div>
          <div className="flex items-center gap-1"><strong>FM:</strong> Fachmontage</div>
          <div className="flex items-center gap-1"><strong>IBN:</strong> Inbetriebnahme</div>
          <div className="flex items-center gap-1"><strong>ABN:</strong> Abnahme</div>
          <div className="flex items-center gap-1"><strong>x:</strong> In Bearbeitung</div>
        </div>
        <div>Stand: 12.12.2025 | TGA Dashboard v3.8</div>
      </footer>
    </div>
  );
};

export default App;
