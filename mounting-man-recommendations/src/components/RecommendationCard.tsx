'use client';

import Image from 'next/image';
import { Recommendation, StreamingProvider } from '@/lib/types';
import { getPosterUrl, getLogoUrl } from '@/lib/tmdb';
import { genreNames } from '@/lib/recommendations';

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

export default function RecommendationCard({
  recommendation,
  index,
}: RecommendationCardProps) {
  // Get title - movies have title, TV shows have name
  const title = recommendation.title || recommendation.name || 'Unknown Title';

  // Get release date - movies have release_date, TV shows have first_air_date
  const releaseDate = recommendation.release_date || recommendation.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  const genres = recommendation.genre_ids
    .slice(0, 3)
    .map((id) => genreNames[id])
    .filter(Boolean);

  const { watchProviders } = recommendation;

  // Combine all available providers
  const allProviders: { provider: StreamingProvider; type: string }[] = [];

  if (watchProviders?.flatrate) {
    watchProviders.flatrate.forEach((p) =>
      allProviders.push({ provider: p, type: 'Stream' })
    );
  }
  if (watchProviders?.rent) {
    watchProviders.rent.slice(0, 2).forEach((p) =>
      allProviders.push({ provider: p, type: 'Rent' })
    );
  }
  if (watchProviders?.buy && allProviders.length < 4) {
    watchProviders.buy.slice(0, 2).forEach((p) =>
      allProviders.push({ provider: p, type: 'Buy' })
    );
  }

  return (
    <div
      className="card-hover bg-gray-800/60 rounded-2xl overflow-hidden border border-gray-700/50 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Poster */}
        <div className="relative w-full sm:w-40 h-60 sm:h-auto flex-shrink-0">
          <Image
            src={getPosterUrl(recommendation.poster_path)}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 160px"
          />
          <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded-lg">
            <span className="text-yellow-400 font-bold text-sm">
              {recommendation.vote_average.toFixed(1)}
            </span>
          </div>
          <div className="absolute top-2 right-2 bg-indigo-600/90 px-2 py-1 rounded-lg">
            <span className="text-white text-xs font-medium uppercase">
              {recommendation.media_type}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            <p className="text-gray-400 text-sm mb-3">
              {year} {genres.length > 0 && `\u2022 ${genres.join(', ')}`}
            </p>
            <p className="text-gray-300 text-sm line-clamp-3 mb-4">
              {recommendation.overview}
            </p>

            {/* Match tags */}
            {recommendation.matchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {recommendation.matchedTags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Streaming providers */}
          {allProviders.length > 0 && (
            <div className="border-t border-gray-700 pt-4 mt-auto">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Where to Watch
              </p>
              <div className="flex flex-wrap gap-2">
                {allProviders.map(({ provider, type }) => (
                  <div
                    key={`${provider.provider_id}-${type}`}
                    className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-2 py-1"
                  >
                    {provider.logo_path && (
                      <Image
                        src={getLogoUrl(provider.logo_path, 'w45')}
                        alt={provider.provider_name}
                        width={20}
                        height={20}
                        className="rounded"
                      />
                    )}
                    <span className="text-xs text-gray-300">
                      {provider.provider_name}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        type === 'Stream'
                          ? 'bg-green-500/20 text-green-400'
                          : type === 'Rent'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allProviders.length === 0 && (
            <div className="border-t border-gray-700 pt-4 mt-auto">
              <p className="text-xs text-gray-500">
                Streaming info unavailable - search on JustWatch.com
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
