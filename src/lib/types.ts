export interface Photo {
  id: string;
  url: string;
  uploaderName: string;
  thiefName: string;
  caption?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  steals: number;
}
