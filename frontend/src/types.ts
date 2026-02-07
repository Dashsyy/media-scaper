export type VideoItem = {
  id: string;
  title: string;
  originalTitle?: string | null;
  uploader?: string | null;
  duration?: string | number | null;
  date?: string | null;
  url: string;
  thumbnail?: string | null;
  downloaded?: boolean;
  error?: string | null;
};

export type ProgressItem = {
  id: string;
  title: string;
  status: string;
  progress: number;
  error?: string | null;
};

export type HistoryItem = {
  url: string;
  title?: string | null;
  downloadedAt: string;
  filePath?: string | null;
  thumbnail?: string | null;
};
