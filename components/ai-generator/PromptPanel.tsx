import React from "react";
import { SparklesIcon } from "./icons/SparklesIcon";
import { Spinner } from "./Spinner";
import { GamepadIcon } from "../icons/Icons";

interface PromptPanelProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  onExampleSelect: (prompt: string) => void;
  onCreate: () => void;
  hasGeneratedCode: boolean;
}

const examplePrompts = [
  "A simple Snake game",
  "A Breakout-style paddle game",
  "A Flappy Bird clone using simple shapes",
  "A Tic-Tac-Toe game for two players",
  "A memory matching card game",
];

export const PromptPanel: React.FC<PromptPanelProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  isLoading,
  onExampleSelect,
  onCreate,
  hasGeneratedCode,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      onGenerate();
    }
  };

  return (
    <div className="bg-gray-medium p-3 sm:p-6 lg:p-8 flex flex-col h-full overflow-hidden">
      <header className="mb-3 sm:mb-6 flex-shrink-0">
        <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center">
          <span className="text-xl sm:text-3xl mr-2 sm:mr-3">
            <GamepadIcon className="w-8 h-8 text-blue-400" />
          </span>
          <span className="hidden sm:inline">AI Game Generator</span>
          <span className="sm:hidden">AI Generator</span>
        </h1>
        <p className="text-gray-subtle mt-1 sm:mt-2 text-xs sm:text-base">
          Describe a simple game, and let AI build a playable prototype for you.
        </p>
      </header>

      <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
        <label
          htmlFor="prompt"
          className="text-xs sm:text-sm font-medium text-gray-subtle mb-2 flex-shrink-0"
        >
          Game Idea
        </label>
        <div className="flex-grow min-h-0">
          <div className="h-full bg-gray-800 rounded-lg p-1 shadow-lg border border-gray-600">
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., A simple clicker game where you click a button to get points"
              className="w-full h-full min-h-[100px] sm:min-h-[120px] p-2 sm:p-4 bg-gray-dark border border-gray-light rounded-lg resize-none focus:ring-2 focus:ring-brand-blue-light focus:border-brand-blue-light outline-none transition-all duration-200 text-xs sm:text-base scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 flex-shrink-0">
        <p className="text-xs sm:text-sm font-medium text-gray-subtle mb-2">
          Or try an example:
        </p>
        <div className="bg-gray-800 rounded-lg p-2 sm:p-3 shadow-lg border border-gray-600">
          <div className="flex flex-wrap gap-1 sm:gap-2 max-h-12 sm:max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {examplePrompts.map((p) => (
              <button
                key={p}
                onClick={() => onExampleSelect(p)}
                className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-light hover:bg-gray-600 text-gray-text rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 shadow-sm hover:shadow-md"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mt-6 flex-shrink-0 space-y-2 sm:space-y-3">
        <div className="bg-gray-800 rounded-lg p-1 shadow-lg border border-gray-600">
          <button
            onClick={onGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-4 bg-brand-blue-light text-white font-semibold rounded-lg shadow-md hover:bg-brand-blue-dark disabled:bg-gray-light disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100 text-xs sm:text-base"
          >
            {isLoading ? (
              <>
                <Spinner />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Generating</span>
              </>
            ) : (
              <>
                <SparklesIcon />
                <span className="hidden sm:inline">Generate Game</span>
                <span className="sm:hidden">Generate</span>
              </>
            )}
          </button>
        </div>

        {hasGeneratedCode && (
          <div className="bg-gray-800 rounded-lg p-1 shadow-lg border border-gray-600">
            <button
              onClick={onCreate}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 text-xs sm:text-base"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="hidden sm:inline">Create Project</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        )}

        <p className="text-xs text-gray-subtle text-center">
          <span className="hidden sm:inline">Press Ctrl+Enter to generate</span>
          <span className="sm:hidden">Ctrl+Enter to generate</span>
        </p>
      </div>
    </div>
  );
};
