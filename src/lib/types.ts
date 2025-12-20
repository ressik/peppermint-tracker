export interface Photo {
  id: string;
  url: string;
  uploaderName: string;
  caption?: string;
  videoUrl?: string;
  createdAt: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isSteal?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  steals: number;
}

export interface TimeHeldEntry {
  name: string;
  totalSeconds: number;
  formattedTime: string;
}

export interface Comment {
  id: string;
  photoId: string;
  name: string;
  comment: string;
  createdAt: string;
}
