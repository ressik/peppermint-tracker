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
  replyTo?: string | null;
  replyToComment?: {
    name: string;
    comment: string;
  } | null;
}

export interface Reaction {
  id: string;
  messageId: string;
  userName: string;
  emoji: string;
  createdAt: string;
}

export interface PhotoReaction {
  id: string;
  photoId: string;
  userName: string;
  emoji: string;
  createdAt: string;
}

export interface CommentReaction {
  id: string;
  commentId: string;
  userName: string;
  emoji: string;
  createdAt: string;
}
