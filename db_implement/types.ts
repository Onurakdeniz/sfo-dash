export interface WorkspaceSettings {
  timezone: string;
  currency: string;
  workingHours: {
    start: string;
    end: string;
  };
  holidays: string[];
} 