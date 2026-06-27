export interface EventDTO {
  igId: string;
  username: string;
  profilePicUrl: string | null;
  eventType: 'new_follower' | 'unfollow';
  wasMutual: boolean;
  detectedAt: string;
  bucket: 'today' | 'week' | 'expired';
}

export interface SummaryDTO {
  newToday: number; newWeek: number;
  unfollowToday: number; unfollowWeek: number;
  mutualUnfollowToday: number; mutualUnfollowWeek: number;
}

export type SummaryCardKind = keyof SummaryDTO;
