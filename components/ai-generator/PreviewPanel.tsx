import React from "react";
import { CodeIcon } from "./icons/CodeIcon";
import { PlayIcon } from "./icons/PlayIcon";

type View = "preview" | "code";

interface PreviewPanelProps {
  code: string;
  isLoading: boolean;
  error: string | null;
  view: View;
  setView: (view: View) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  code,
  isLoading,
  error,
  view,
  setView,
}) => {
  const TabButton: React.FC<{
    currentView: View;
    viewName: View;
    children: React.ReactNode;
  }> = ({ currentView, viewName, children }) => (
    <button
      onClick={() => setView(viewName)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        currentView === viewName
          ? "bg-brand-blue-light text-white"
          : "text-gray-subtle hover:bg-gray-light hover:text-white"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-gray-dark flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-2 sm:p-4 bg-gray-medium border-b border-gray-light">
        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-gray-dark rounded-lg">
          <TabButton currentView={view} viewName="preview">
            <PlayIcon />
            <span className="hidden sm:inline">Preview</span>
          </TabButton>
          <TabButton currentView={view} viewName="code">
            <CodeIcon />
            <span className="hidden sm:inline">Code</span>
          </TabButton>
        </div>
      </div>

      <div className="flex-grow relative min-h-0 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-dark bg-opacity-95 flex flex-col justify-center items-center z-10 p-3 sm:p-4">
            <div className="w-10 h-10 sm:w-16 sm:h-16 border-4 border-t-brand-blue-light border-gray-light rounded-full animate-spin"></div>
            <p className="mt-3 sm:mt-4 text-sm sm:text-lg font-semibold text-white text-center">
              Generating your game...
            </p>
            <p className="text-gray-subtle text-xs sm:text-base text-center">
              This might take a moment.
            </p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-gray-dark flex justify-center items-center z-10 p-3 sm:p-4">
            <div className="bg-red-900 border border-red-700 text-red-100 p-3 sm:p-6 rounded-lg max-w-lg text-center max-h-[80vh] overflow-y-auto">
              <h3 className="font-bold text-sm sm:text-lg mb-2">
                Generation Failed
              </h3>
              <p className="text-xs sm:text-sm break-words">{error}</p>
            </div>
          </div>
        )}

        {/* Preview Panel */}
        <div
          className={`w-full h-full p-1 sm:p-4 ${
            view === "preview" ? "block" : "hidden"
          }`}
        >
          <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-lg">
            <iframe
              srcDoc={code}
              title="Game Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
          </div>
        </div>

        {/* Code Panel */}
        <div
          className={`w-full h-full p-1 sm:p-4 ${
            view === "code" ? "block" : "hidden"
          }`}
        >
          <div className="h-full overflow-hidden flex flex-col bg-gray-800 rounded-lg shadow-lg border border-gray-600">
            <div className="flex-shrink-0 p-2 sm:p-4 bg-gray-900 border-b border-gray-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-gray-300">
                  Generated Code
                </p>
                <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-gray-subtle">
                  <span className="hidden sm:inline">HTML/CSS/JS</span>
                  <span>{code.length} chars</span>
                  <span>{code.split("\n").length} lines</span>
                </div>
              </div>
            </div>
            <div className="flex-grow overflow-hidden">
              <pre className="h-full overflow-auto p-2 sm:p-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <code className="text-xs sm:text-sm text-gray-text whitespace-pre-wrap break-words font-mono leading-relaxed block">
                  {code}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
