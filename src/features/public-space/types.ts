export type PublicSpaceData = {
  publicId: string;
  memberCount: number;
  members: {
    displayName: string;
    bio: string;
    avatarUrl: string;
    fallbackAvatarUrl: string;
  }[];
  coupleStats: {
    streakDays: number | null;
    togetherDays: number | null;
    asOfDate: string;
  } | null;
};
