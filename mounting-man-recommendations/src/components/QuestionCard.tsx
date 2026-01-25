'use client';

import { Question } from '@/lib/types';

interface QuestionCardProps {
  question: Question;
  selectedOptions: string[];
  onSelect: (optionId: string) => void;
}

export default function QuestionCard({
  question,
  selectedOptions,
  onSelect,
}: QuestionCardProps) {
  const handleOptionClick = (optionId: string) => {
    onSelect(optionId);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
        {question.question}
      </h2>
      {question.subtitle && (
        <p className="text-gray-400 mb-6">{question.subtitle}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option, index) => {
          const isSelected = selectedOptions.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className={`option-card text-left animate-slide-in ${
                isSelected ? 'selected' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.icon}</span>
                <span className="font-medium text-white">{option.label}</span>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-5 h-5 text-indigo-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {question.multiSelect && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          You can select multiple options
        </p>
      )}
    </div>
  );
}
