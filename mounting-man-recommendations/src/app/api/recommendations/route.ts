import { NextRequest, NextResponse } from 'next/server';
import { UserAnswers, MediaItem, Recommendation } from '@/lib/types';
import {
  getTagsFromAnswers,
  getGenreIdsFromTags,
  getMediaTypes,
  processRecommendations,
} from '@/lib/recommendations';
import {
  discoverMovies,
  discoverTV,
  batchGetWatchProviders,
} from '@/lib/tmdb';

// You can get a free API key from https://www.themoviedb.org/settings/api
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { answers } = (await request.json()) as { answers: UserAnswers };

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'No answers provided' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!TMDB_API_KEY) {
      // Return demo data if no API key is configured
      return NextResponse.json({
        recommendations: getDemoRecommendations(answers),
        message: 'Demo mode - configure TMDB_API_KEY for real recommendations',
      });
    }

    // Extract user preferences
    const userTags = getTagsFromAnswers(answers);
    const genreIds = getGenreIdsFromTags(userTags);
    const mediaTypes = getMediaTypes(answers);

    // Determine year filter based on era preference
    const eraAnswer = answers['era']?.[0];
    let yearGte: number | undefined;
    if (eraAnswer === 'new') {
      yearGte = new Date().getFullYear() - 2;
    } else if (eraAnswer === 'modern') {
      yearGte = 2010;
    }

    // Fetch content based on preferences
    const allMedia: MediaItem[] = [];

    if (mediaTypes.includes('movie')) {
      const movies = await discoverMovies(TMDB_API_KEY, genreIds, {
        minRating: 6,
        yearGte,
      });
      allMedia.push(...movies);
    }

    if (mediaTypes.includes('tv')) {
      const tvShows = await discoverTV(TMDB_API_KEY, genreIds, {
        minRating: 6,
        yearGte,
      });
      allMedia.push(...tvShows);
    }

    // Score and rank recommendations
    const recommendations = processRecommendations(allMedia, userTags, 10);

    // Fetch streaming providers for top recommendations
    const providersMap = await batchGetWatchProviders(
      TMDB_API_KEY,
      recommendations,
      'US'
    );

    // Attach providers to recommendations
    const enrichedRecommendations: Recommendation[] = recommendations.map(rec => ({
      ...rec,
      watchProviders: providersMap.get(`${rec.media_type}-${rec.id}`) || undefined,
    }));

    return NextResponse.json({
      recommendations: enrichedRecommendations,
      tags: userTags,
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

// Demo recommendations when no API key is configured
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getDemoRecommendations(answers: UserAnswers): Recommendation[] {
  const demoContent: Recommendation[] = [
    {
      id: 155,
      title: 'The Dark Knight',
      overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
      vote_average: 8.5,
      release_date: '2008-07-16',
      genre_ids: [18, 28, 80],
      media_type: 'movie',
      matchScore: 85,
      matchedTags: ['action', 'thriller', 'drama'],
      watchProviders: {
        flatrate: [
          { provider_id: 1899, provider_name: 'Max', logo_path: '/6Q3ZYUNA9Hsgj6iWnVsw2gR5V6z.jpg', display_priority: 1 },
        ],
        rent: [
          { provider_id: 2, provider_name: 'Apple iTunes', logo_path: '/peURlLlr8jggOwK53fJ5wdQl05y.jpg', display_priority: 2 },
        ],
      },
    },
    {
      id: 27205,
      title: 'Inception',
      overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception".',
      poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
      backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
      vote_average: 8.4,
      release_date: '2010-07-15',
      genre_ids: [28, 878, 12],
      media_type: 'movie',
      matchScore: 80,
      matchedTags: ['action', 'sci-fi', 'thriller'],
      watchProviders: {
        flatrate: [
          { provider_id: 8, provider_name: 'Netflix', logo_path: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg', display_priority: 1 },
        ],
      },
    },
    {
      id: 1396,
      name: 'Breaking Bad',
      overview: "When Walter White, a chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live, he becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future.",
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
      vote_average: 8.9,
      first_air_date: '2008-01-20',
      genre_ids: [18, 80],
      media_type: 'tv',
      matchScore: 78,
      matchedTags: ['drama', 'thriller'],
      watchProviders: {
        flatrate: [
          { provider_id: 8, provider_name: 'Netflix', logo_path: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg', display_priority: 1 },
        ],
      },
    },
    {
      id: 550,
      title: 'Fight Club',
      overview: 'A depressed man suffering from insomnia meets a strange soap salesman named Tyler Durden and soon finds himself living in his squalid house after his perfect apartment is destroyed.',
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
      vote_average: 8.4,
      release_date: '1999-10-15',
      genre_ids: [18],
      media_type: 'movie',
      matchScore: 75,
      matchedTags: ['drama', 'thriller'],
      watchProviders: {
        rent: [
          { provider_id: 2, provider_name: 'Apple iTunes', logo_path: '/peURlLlr8jggOwK53fJ5wdQl05y.jpg', display_priority: 2 },
          { provider_id: 3, provider_name: 'Google Play', logo_path: '/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg', display_priority: 3 },
        ],
      },
    },
    {
      id: 1399,
      name: 'Game of Thrones',
      overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north.",
      poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
      backdrop_path: '/suopoADq0k8YZr4dQXcU6pToj6s.jpg',
      vote_average: 8.4,
      first_air_date: '2011-04-17',
      genre_ids: [10765, 18, 10759],
      media_type: 'tv',
      matchScore: 72,
      matchedTags: ['fantasy', 'drama', 'action'],
      watchProviders: {
        flatrate: [
          { provider_id: 1899, provider_name: 'Max', logo_path: '/6Q3ZYUNA9Hsgj6iWnVsw2gR5V6z.jpg', display_priority: 1 },
        ],
      },
    },
    {
      id: 157336,
      title: 'Interstellar',
      overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
      poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
      vote_average: 8.4,
      release_date: '2014-11-05',
      genre_ids: [12, 18, 878],
      media_type: 'movie',
      matchScore: 70,
      matchedTags: ['sci-fi', 'drama', 'adventure'],
      watchProviders: {
        flatrate: [
          { provider_id: 531, provider_name: 'Paramount+', logo_path: '/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg', display_priority: 1 },
        ],
        rent: [
          { provider_id: 2, provider_name: 'Apple iTunes', logo_path: '/peURlLlr8jggOwK53fJ5wdQl05y.jpg', display_priority: 2 },
        ],
      },
    },
  ];

  return demoContent;
}
