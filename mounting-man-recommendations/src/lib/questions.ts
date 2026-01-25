import { Question } from './types';

export const questions: Question[] = [
  {
    id: 'mood',
    question: "What mood are you in right now?",
    subtitle: "Pick what feels right for tonight",
    options: [
      { id: 'excited', label: 'Pumped & Ready for Action', icon: '⚡', tags: ['action', 'adventure', 'thriller'] },
      { id: 'relaxed', label: 'Chill & Easy-going', icon: '😌', tags: ['comedy', 'romance', 'feel-good'] },
      { id: 'curious', label: 'Ready to Learn Something', icon: '🧠', tags: ['documentary', 'mystery', 'sci-fi'] },
      { id: 'emotional', label: 'In My Feelings', icon: '💭', tags: ['drama', 'romance', 'tearjerker'] },
      { id: 'scared', label: 'Scare Me!', icon: '👻', tags: ['horror', 'thriller', 'suspense'] },
      { id: 'nostalgic', label: 'Missing the Good Old Days', icon: '📼', tags: ['classic', 'retro', 'family'] },
    ],
  },
  {
    id: 'genre',
    question: "What genres do you usually enjoy?",
    subtitle: "Select all that apply",
    multiSelect: true,
    options: [
      { id: 'action', label: 'Action & Adventure', icon: '💥', tags: ['action', 'adventure'] },
      { id: 'comedy', label: 'Comedy', icon: '😂', tags: ['comedy'] },
      { id: 'drama', label: 'Drama', icon: '🎭', tags: ['drama'] },
      { id: 'scifi', label: 'Sci-Fi & Fantasy', icon: '🚀', tags: ['sci-fi', 'fantasy'] },
      { id: 'horror', label: 'Horror & Thriller', icon: '🔪', tags: ['horror', 'thriller'] },
      { id: 'romance', label: 'Romance', icon: '💕', tags: ['romance'] },
      { id: 'documentary', label: 'Documentary', icon: '🎬', tags: ['documentary'] },
      { id: 'animation', label: 'Animation', icon: '🎨', tags: ['animation', 'family'] },
    ],
  },
  {
    id: 'pacing',
    question: "How do you like your entertainment paced?",
    subtitle: "Fast and furious or slow and steady?",
    options: [
      { id: 'fast', label: 'Fast-paced & Action-packed', icon: '🏎️', tags: ['action', 'thriller', 'fast-paced'] },
      { id: 'medium', label: 'Balanced Mix', icon: '⚖️', tags: ['balanced', 'drama'] },
      { id: 'slow', label: 'Slow Burn & Character-driven', icon: '🕯️', tags: ['slow-burn', 'character-study', 'indie'] },
    ],
  },
  {
    id: 'length',
    question: "How much time do you have?",
    subtitle: "Movie night or binge session?",
    options: [
      { id: 'short', label: 'Quick Watch (< 2 hours)', icon: '⏱️', tags: ['movie', 'short'] },
      { id: 'medium', label: 'Standard Movie (~2 hours)', icon: '🎬', tags: ['movie'] },
      { id: 'long', label: 'Epic Film (2.5+ hours)', icon: '🎞️', tags: ['epic', 'movie'] },
      { id: 'series', label: 'Start a New Series', icon: '📺', tags: ['tv', 'series', 'binge'] },
    ],
  },
  {
    id: 'audience',
    question: "Who are you watching with?",
    subtitle: "This helps us filter appropriately",
    options: [
      { id: 'solo', label: 'Just Me', icon: '🙋', tags: ['any-rating'] },
      { id: 'partner', label: 'Date Night', icon: '💑', tags: ['romance', 'thriller', 'comedy'] },
      { id: 'friends', label: 'Friends Hangout', icon: '👯', tags: ['comedy', 'action', 'horror'] },
      { id: 'family', label: 'Family Time', icon: '👨‍👩‍👧‍👦', tags: ['family', 'animation', 'pg'] },
      { id: 'kids', label: 'With Kids', icon: '🧒', tags: ['kids', 'animation', 'family', 'g-rated'] },
    ],
  },
  {
    id: 'era',
    question: "Any preference on when it was made?",
    subtitle: "Classic or contemporary?",
    options: [
      { id: 'new', label: 'Recent Releases (Last 2 years)', icon: '✨', tags: ['new', 'recent'] },
      { id: 'modern', label: 'Modern Classics (2010s-2020s)', icon: '🎯', tags: ['modern'] },
      { id: 'classic', label: 'Timeless Classics (Pre-2010)', icon: '🏆', tags: ['classic', 'retro'] },
      { id: 'any', label: "Doesn't Matter", icon: '🎲', tags: ['any-era'] },
    ],
  },
];

// Map of TMDB genre IDs to our tags
export const genreIdMap: Record<number, string[]> = {
  // Movie genres
  28: ['action'],
  12: ['adventure'],
  16: ['animation', 'family'],
  35: ['comedy'],
  80: ['thriller', 'drama'],
  99: ['documentary'],
  18: ['drama'],
  10751: ['family', 'kids'],
  14: ['fantasy'],
  36: ['drama', 'classic'],
  27: ['horror'],
  10402: ['drama'],
  9648: ['mystery', 'thriller'],
  10749: ['romance'],
  878: ['sci-fi'],
  10770: ['drama'],
  53: ['thriller', 'suspense'],
  10752: ['action', 'drama'],
  37: ['western', 'classic'],
  // TV genres
  10759: ['action', 'adventure'],
  10762: ['kids', 'animation'],
  10763: ['documentary'],
  10764: ['reality'],
  10765: ['sci-fi', 'fantasy'],
  10766: ['drama'],
  10767: ['talk'],
  10768: ['drama', 'thriller'],
};
