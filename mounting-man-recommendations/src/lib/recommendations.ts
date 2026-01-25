import { UserAnswers, MediaItem, Recommendation, PersonalityProfile } from './types';
import { questions, genreIdMap } from './questions';

// Build a personality profile from user answers
export function buildPersonalityProfile(answers: UserAnswers): PersonalityProfile {
  const profile: PersonalityProfile = {
    mood: [],
    genres: [],
    pacing: [],
    content: [],
    watchWith: [],
  };

  // Extract tags from each answer
  for (const question of questions) {
    const selectedOptions = answers[question.id] || [];
    for (const optionId of selectedOptions) {
      const option = question.options.find(o => o.id === optionId);
      if (option) {
        switch (question.id) {
          case 'mood':
            profile.mood.push(...option.tags);
            break;
          case 'genre':
            profile.genres.push(...option.tags);
            break;
          case 'pacing':
            profile.pacing.push(...option.tags);
            break;
          case 'length':
          case 'era':
            profile.content.push(...option.tags);
            break;
          case 'audience':
            profile.watchWith.push(...option.tags);
            break;
        }
      }
    }
  }

  return profile;
}

// Get all unique tags from user answers
export function getTagsFromAnswers(answers: UserAnswers): string[] {
  const tags: Set<string> = new Set();

  for (const question of questions) {
    const selectedOptions = answers[question.id] || [];
    for (const optionId of selectedOptions) {
      const option = question.options.find(o => o.id === optionId);
      if (option) {
        option.tags.forEach(tag => tags.add(tag));
      }
    }
  }

  return Array.from(tags);
}

// Score a media item based on user preferences
export function scoreMedia(item: MediaItem, userTags: string[]): { score: number; matchedTags: string[] } {
  const matchedTags: string[] = [];
  let score = 0;

  // Get tags from the media's genres
  const mediaTags: Set<string> = new Set();
  for (const genreId of item.genre_ids) {
    const tags = genreIdMap[genreId] || [];
    tags.forEach(tag => mediaTags.add(tag));
  }

  // Score based on matching tags
  for (const userTag of userTags) {
    if (mediaTags.has(userTag)) {
      score += 10;
      matchedTags.push(userTag);
    }
  }

  // Boost score for highly rated content
  if (item.vote_average >= 8) {
    score += 15;
  } else if (item.vote_average >= 7) {
    score += 10;
  } else if (item.vote_average >= 6) {
    score += 5;
  }

  // Small boost for having a poster (better UI)
  if (item.poster_path) {
    score += 2;
  }

  return { score, matchedTags };
}

// Convert TMDB genre IDs to readable names
export const genreNames: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  // TV
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

// Get TMDB genre IDs from user preferences
export function getGenreIdsFromTags(tags: string[]): number[] {
  const genreIds: Set<number> = new Set();

  for (const [id, genreTags] of Object.entries(genreIdMap)) {
    for (const tag of tags) {
      if (genreTags.includes(tag)) {
        genreIds.add(parseInt(id));
      }
    }
  }

  return Array.from(genreIds);
}

// Determine if user wants movies, TV, or both
export function getMediaTypes(answers: UserAnswers): ('movie' | 'tv')[] {
  const lengthAnswer = answers['length']?.[0];

  if (lengthAnswer === 'series') {
    return ['tv'];
  } else if (lengthAnswer === 'short' || lengthAnswer === 'medium' || lengthAnswer === 'long') {
    return ['movie'];
  }

  return ['movie', 'tv'];
}

// Sort and filter recommendations
export function processRecommendations(
  items: MediaItem[],
  userTags: string[],
  limit: number = 10
): Recommendation[] {
  const scored = items.map(item => {
    const { score, matchedTags } = scoreMedia(item, userTags);
    return {
      ...item,
      matchScore: score,
      matchedTags,
    } as Recommendation;
  });

  // Sort by score descending, then by rating
  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return b.vote_average - a.vote_average;
  });

  // Return top results
  return scored.slice(0, limit);
}
