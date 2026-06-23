export interface Movie {
  id: string;
  title: string;
  banglaTitle?: string;
  category: string;
  rating: string;
  releaseDate: string;
  imageUrl: string;
  teaserImageUrl?: string;
  downloadUrl: string;
  isBanner: boolean;
  isUpcoming: boolean;
  status: 'Released' | 'Upcoming' | 'Coming Soon';
  initials?: string; // e.g., 'MB'
  timerSeconds?: number; // Custom timer for this movie or null
  adSlots: string[]; // Exactly 10 ad slots
}

export interface AppSettings {
  defaultTimerSeconds: number;
  telegramBotUrl: string;
  facebookGroupUrl: string;
  mainChannelUrl: string;
  chatGroupUrl: string;
  adultChannelUrl: string;
  livetvChannelUrl: string;
  rotationHours: number; // e.g. 1 or 3 hours
  categories: string[];
  allowedTelegramUsernames: string;
}

export interface UserState {
  fullName: string;
  username: string;
  phoneNumber?: string;
  coins: number;
  referrals: number;
  vipStatus: string;
  favorites: string[]; // movie IDs
  isBangla: boolean;
  isDarkMode: boolean;
  profilePicUrl?: string;
}
