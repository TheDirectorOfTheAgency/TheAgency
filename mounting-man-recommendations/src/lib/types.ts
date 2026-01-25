export interface Question {
  id: string;
  question: string;
  subtitle?: string;
  options: QuestionOption[];
  multiSelect?: boolean;
}

export interface QuestionOption {
  id: string;
  label: string;
  icon?: string;
  tags: string[]; // Tags that influence recommendations
}

export interface UserAnswers {
  [questionId: string]: string[];
}

// Base media item with all shared properties
export interface BaseMediaItem {
  id: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  genre_ids: number[];
  media_type: 'movie' | 'tv';
}

export interface Movie extends BaseMediaItem {
  media_type: 'movie';
  title: string;
  release_date: string;
}

export interface TVShow extends BaseMediaItem {
  media_type: 'tv';
  name: string;
  first_air_date: string;
}

export type MediaItem = Movie | TVShow;

export interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface WatchProviders {
  flatrate?: StreamingProvider[]; // Subscription streaming
  rent?: StreamingProvider[];     // Rent
  buy?: StreamingProvider[];      // Buy
}

export interface Recommendation extends BaseMediaItem {
  // Movie-specific (optional for TV)
  title?: string;
  release_date?: string;
  // TV-specific (optional for movies)
  name?: string;
  first_air_date?: string;
  // Recommendation-specific
  matchScore: number;
  matchedTags: string[];
  watchProviders?: WatchProviders;
}

export interface PersonalityProfile {
  mood: string[];
  genres: string[];
  pacing: string[];
  content: string[];
  watchWith: string[];
}
