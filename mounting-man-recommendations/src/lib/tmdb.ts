import { MediaItem, WatchProviders, Movie, TVShow } from './types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Image URL helpers
export function getPosterUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342'): string {
  if (!path) return '/placeholder-poster.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) return '/placeholder-poster.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getLogoUrl(path: string | null, size: 'w45' | 'w92' | 'w154' | 'original' = 'w92'): string {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// Fetch discover movies with genre filters
export async function discoverMovies(
  apiKey: string,
  genreIds: number[],
  options: {
    page?: number;
    sortBy?: string;
    minRating?: number;
    year?: number;
    yearGte?: number;
  } = {}
): Promise<MediaItem[]> {
  const params = new URLSearchParams({
    api_key: apiKey,
    language: 'en-US',
    page: String(options.page || 1),
    sort_by: options.sortBy || 'popularity.desc',
    include_adult: 'false',
    'vote_count.gte': '100',
  });

  if (genreIds.length > 0) {
    params.append('with_genres', genreIds.slice(0, 3).join('|')); // Use OR for genres
  }

  if (options.minRating) {
    params.append('vote_average.gte', String(options.minRating));
  }

  if (options.year) {
    params.append('primary_release_year', String(options.year));
  }

  if (options.yearGte) {
    params.append('primary_release_date.gte', `${options.yearGte}-01-01`);
  }

  const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${params}`);

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.results.map((movie: any) => ({ ...movie, media_type: 'movie' as const })) as Movie[];
}

// Fetch discover TV shows with genre filters
export async function discoverTV(
  apiKey: string,
  genreIds: number[],
  options: {
    page?: number;
    sortBy?: string;
    minRating?: number;
    yearGte?: number;
  } = {}
): Promise<MediaItem[]> {
  const params = new URLSearchParams({
    api_key: apiKey,
    language: 'en-US',
    page: String(options.page || 1),
    sort_by: options.sortBy || 'popularity.desc',
    'vote_count.gte': '50',
  });

  if (genreIds.length > 0) {
    params.append('with_genres', genreIds.slice(0, 3).join('|'));
  }

  if (options.minRating) {
    params.append('vote_average.gte', String(options.minRating));
  }

  if (options.yearGte) {
    params.append('first_air_date.gte', `${options.yearGte}-01-01`);
  }

  const response = await fetch(`${TMDB_BASE_URL}/discover/tv?${params}`);

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.results.map((show: any) => ({ ...show, media_type: 'tv' as const })) as TVShow[];
}

// Fetch trending content
export async function getTrending(
  apiKey: string,
  mediaType: 'movie' | 'tv' | 'all' = 'all',
  timeWindow: 'day' | 'week' = 'week'
): Promise<MediaItem[]> {
  const response = await fetch(
    `${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}?api_key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results;
}

// Fetch watch providers for a specific title
export async function getWatchProviders(
  apiKey: string,
  mediaType: 'movie' | 'tv',
  id: number,
  region: string = 'US'
): Promise<WatchProviders | null> {
  const response = await fetch(
    `${TMDB_BASE_URL}/${mediaType}/${id}/watch/providers?api_key=${apiKey}`
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.results?.[region] || null;
}

// Batch fetch watch providers for multiple items
export async function batchGetWatchProviders(
  apiKey: string,
  items: Array<{ media_type: 'movie' | 'tv'; id: number }>,
  region: string = 'US'
): Promise<Map<string, WatchProviders>> {
  const providersMap = new Map<string, WatchProviders>();

  // Fetch in parallel with rate limiting (batch of 5)
  const batchSize = 5;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(item =>
        getWatchProviders(apiKey, item.media_type, item.id, region)
          .then(providers => ({ key: `${item.media_type}-${item.id}`, providers }))
          .catch(() => ({ key: `${item.media_type}-${item.id}`, providers: null }))
      )
    );

    for (const result of results) {
      if (result.providers) {
        providersMap.set(result.key, result.providers);
      }
    }
  }

  return providersMap;
}

// Get movie/TV details
export async function getDetails(
  apiKey: string,
  mediaType: 'movie' | 'tv',
  id: number
): Promise<Movie | TVShow | null> {
  const response = await fetch(
    `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${apiKey}&language=en-US`
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return { ...data, media_type: mediaType };
}

// Popular streaming service info for nice display
export const streamingServices: Record<number, { name: string; color: string }> = {
  8: { name: 'Netflix', color: '#E50914' },
  9: { name: 'Amazon Prime', color: '#00A8E1' },
  337: { name: 'Disney+', color: '#113CCF' },
  384: { name: 'HBO Max', color: '#5822B4' },
  15: { name: 'Hulu', color: '#1CE783' },
  386: { name: 'Peacock', color: '#000000' },
  387: { name: 'Peacock Premium', color: '#000000' },
  531: { name: 'Paramount+', color: '#0064FF' },
  350: { name: 'Apple TV+', color: '#000000' },
  283: { name: 'Crunchyroll', color: '#F47521' },
  2: { name: 'Apple iTunes', color: '#000000' },
  3: { name: 'Google Play', color: '#4285F4' },
  7: { name: 'Vudu', color: '#3399FF' },
  10: { name: 'Amazon Video', color: '#00A8E1' },
  192: { name: 'YouTube', color: '#FF0000' },
  257: { name: 'fuboTV', color: '#FA4616' },
  37: { name: 'Showtime', color: '#FF0000' },
  73: { name: 'Tubi', color: '#FA382F' },
  300: { name: 'Pluto TV', color: '#000000' },
  1899: { name: 'Max', color: '#002BE7' },
};
