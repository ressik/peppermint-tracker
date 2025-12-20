export interface Photo {
  id: string;
  url: string;
  uploaderName: string;
  caption?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  steals: number;
}

export interface Comment {
  id: string;
  photoId: string;
  name: string;
  comment: string;
  createdAt: string;
}
