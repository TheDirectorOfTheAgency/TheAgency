'use client';

export default function LoadingScreen() {
  const loadingMessages = [
    'Analyzing your taste...',
    'Finding perfect matches...',
    'Checking streaming services...',
    'Curating your watchlist...',
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="relative mb-8">
        {/* Animated rings */}
        <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 animate-ping absolute" />
        <div className="w-24 h-24 rounded-full border-4 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">🎬</span>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">
          Building Your Recommendations
        </h2>
        <div className="flex flex-col gap-1">
          {loadingMessages.map((message, index) => (
            <p
              key={message}
              className="text-gray-400 text-sm animate-pulse-custom"
              style={{ animationDelay: `${index * 500}ms` }}
            >
              {message}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
