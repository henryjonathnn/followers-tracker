export interface Member {
  igId: string;
  username: string;
  profilePicUrl?: string;
}

export interface Unfollower extends Member {
  wasMutual: boolean;
}

export interface DiffResult {
  newFollowers: Member[];
  unfollowers: Unfollower[];
}

export type Bucket = 'today' | 'week' | 'expired';
export type EventType = 'new_follower' | 'unfollow';
