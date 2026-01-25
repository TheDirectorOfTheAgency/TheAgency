'use client';

import { useState } from 'react';
import { questions } from '@/lib/questions';
import { UserAnswers, Recommendation } from '@/lib/types';
import QuestionCard from '@/components/QuestionCard';
import ProgressBar from '@/components/ProgressBar';
import RecommendationCard from '@/components/RecommendationCard';
import LoadingScreen from '@/components/LoadingScreen';

type AppState = 'welcome' | 'quiz' | 'loading' | 'results';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const handleStart = () => {
    setAppState('quiz');
    setCurrentQuestion(0);
    setAnswers({});
  };

  const handleOptionSelect = (optionId: string) => {
    const question = questions[currentQuestion];
    const currentAnswers = answers[question.id] || [];

    let newAnswers: string[];
    if (question.multiSelect) {
      // Toggle selection for multi-select
      if (currentAnswers.includes(optionId)) {
        newAnswers = currentAnswers.filter((id) => id !== optionId);
      } else {
        newAnswers = [...currentAnswers, optionId];
      }
    } else {
      // Single select - replace
      newAnswers = [optionId];
    }

    setAnswers({
      ...answers,
      [question.id]: newAnswers,
    });

    // Auto-advance for single select after a brief delay
    if (!question.multiSelect && newAnswers.length > 0) {
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        }
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Submit and get recommendations
      submitAnswers();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitAnswers = async () => {
    setAppState('loading');

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setAppState('results');
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      setAppState('results');
    }
  };

  const handleStartOver = () => {
    setAppState('welcome');
    setCurrentQuestion(0);
    setAnswers({});
    setRecommendations([]);
  };

  // Welcome Screen
  if (appState === 'welcome') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl mx-auto animate-fade-in">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
              <span className="text-4xl">📺</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              <span className="gradient-text">The Mounting Man</span>
            </h1>
            <p className="text-xl text-gray-400">What Should You Watch?</p>
          </div>

          {/* Value Prop */}
          <p className="text-lg text-gray-300 mb-8 max-w-md mx-auto">
            Just got your TV mounted? Answer a few quick questions and we&apos;ll find
            the perfect movies and shows for you - plus where to stream them!
          </p>

          {/* CTA */}
          <button onClick={handleStart} className="btn-primary text-lg px-8 py-4">
            Find My Perfect Watch
          </button>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
              <span className="text-2xl mb-2 block">🎯</span>
              <h3 className="font-semibold text-white mb-1">Personalized Picks</h3>
              <p className="text-sm text-gray-400">
                Tailored to your mood, taste, and who you&apos;re watching with
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
              <span className="text-2xl mb-2 block">📍</span>
              <h3 className="font-semibold text-white mb-1">Where to Watch</h3>
              <p className="text-sm text-gray-400">
                See which streaming services have your recommendations
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
              <span className="text-2xl mb-2 block">⚡</span>
              <h3 className="font-semibold text-white mb-1">Quick & Easy</h3>
              <p className="text-sm text-gray-400">
                Just 6 questions to your perfect movie night
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Loading Screen
  if (appState === 'loading') {
    return <LoadingScreen />;
  }

  // Results Screen
  if (appState === 'results') {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="gradient-text">Your Perfect Watchlist</span>
            </h1>
            <p className="text-gray-400">
              Based on your preferences, here&apos;s what we recommend for your new TV
            </p>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 ? (
            <div className="space-y-4 mb-8">
              {recommendations.map((rec, index) => (
                <RecommendationCard
                  key={`${rec.media_type}-${rec.id}`}
                  recommendation={rec}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">
                No recommendations found. Try different preferences!
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button onClick={handleStartOver} className="btn-secondary">
              Start Over
            </button>
            <button
              onClick={() => window.print()}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <span>Save Watchlist</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-sm">
              Powered by{' '}
              <span className="text-indigo-400 font-semibold">
                The Mounting Man
              </span>
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Data provided by TMDB. Streaming availability may vary by region.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Quiz Screen
  const question = questions[currentQuestion];
  const currentAnswerCount = (answers[question.id] || []).length;
  const canProceed =
    currentAnswerCount > 0 || (question.multiSelect && currentQuestion > 0);
  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <main className="min-h-screen flex flex-col p-6">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Progress */}
        <ProgressBar current={currentQuestion} total={questions.length} />

        {/* Question */}
        <div className="flex-1 flex flex-col justify-center">
          <QuestionCard
            question={question}
            selectedOptions={answers[question.id] || []}
            onSelect={handleOptionSelect}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-800">
          <button
            onClick={handleBack}
            disabled={currentQuestion === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentQuestion === 0
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          {question.multiSelect && (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`btn-primary flex items-center gap-2 ${
                !canProceed ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLastQuestion ? 'Get Recommendations' : 'Next'}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {!question.multiSelect && isLastQuestion && currentAnswerCount > 0 && (
            <button onClick={handleNext} className="btn-primary flex items-center gap-2">
              Get Recommendations
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
