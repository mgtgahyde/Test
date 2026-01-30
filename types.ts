
export enum ProjectStatus {
  ANGEBOT = 'Angebot',
  ANFRAGE = 'Anfrage',
  AUFTRAG = 'Auftrag',
  ERLEDIGT = 'Erledigt',
  RECHNUNG = 'Rechnung'
}

export interface TimelineEntry {
  week: number;
  code: string;
  type: 'planning' | 'execution' | 'milestone' | 'warning' | 'info';
}

export interface Project {
  id: string;
  kzl_ktr: string;
  status: ProjectStatus;
  statusInfo: string;
  ort: string;
  bauvorhaben: string;
  l_gewerk: string;
  auftraggeber: string;
  abgabe: string;
  agnr_pnr: string;
  summe: number;
  pl: string;
  bl_ma: string;
  timeline: TimelineEntry[];
}

export interface MonthInfo {
  name: string;
  weeks: number[];
}
