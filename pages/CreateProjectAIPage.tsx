import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import { useAuth } from "../hooks/useAuth";
import { PromptPanel } from "../components/ai-generator/PromptPanel";
import { PreviewPanel } from "../components/ai-generator/PreviewPanel";
import { generateGameCodeStream } from "../services/geminiService";
import {
  PlanAccessRequirement,
  getPlanCode,
  meetsPlanRequirements,
} from "../utils/planAccess";

const INITIAL_HTML_PLACEHOLDER = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Preview</title>
    <style>
        body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #1f2937; color: #d1d5db; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; text-align: center; }
        .container { padding: 2rem; }
        h1 { color: #f9fafb; font-size: 1.8rem; margin-bottom: 1rem; }
        p { font-size: 1rem; max-width: 400px; margin: 0 auto; line-height: 1.5; }
        .logo { font-size: 2.5rem; margin-bottom: 1rem; animation: float 3s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
          <svg class="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h1>AI Game Generator</h1>
        <p>Describe the game you want to create in the panel on the left, and watch it come to life here!</p>
    </div>
</body>
</html>`;

const CreateProjectAIPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const aiRequirement: PlanAccessRequirement = {
    minPlan: "pro",
    features: ["hasAdvancedFeatures"],
  };

  const [prompt, setPrompt] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState<string>(
    INITIAL_HTML_PLACEHOLDER
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");
  const [isGenerationComplete, setIsGenerationComplete] =
    useState<boolean>(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setIsGenerationComplete(false);
    setError(null);
    setGeneratedCode(""); // Clear previous code
    setActiveView("code"); // Switch to code view to show progress

    try {
      // Use the streaming service
      await generateGameCodeStream(prompt, (chunk) => {
        // Append chunks as they arrive
        setGeneratedCode((prevCode) => prevCode + chunk);
      });
      // Mark generation as complete when streaming finishes
      setIsGenerationComplete(true);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred.";
      setError(
        `Failed to generate game. ${errorMessage}. Please check your API key and try again.`
      );
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading]);

  const handleExamplePrompt = (example: string) => {
    setPrompt(example);
    setIsGenerationComplete(false); // Reset completion state when selecting new example
  };

  const handleCreate = () => {
    // Navigate to the new create project page with generated code
    navigate("/create-project/create", {
      state: {
        generatedCode: generatedCode,
        prompt: prompt,
        source: "ai-generator",
      },
    });
  };

  if (!meetsPlanRequirements(user || null, aiRequirement)) {
    const requiredPlan = aiRequirement.minPlan ?? "pro";
    const currentPlan = getPlanCode(user || null);
    return (
      <div className="min-h-screen bg-gray-dark text-gray-text flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-gray-900 border border-gray-700 rounded-2xl p-8 space-y-6 text-center">
          <h1 className="text-3xl font-semibold text-white">
            Upgrade Required
          </h1>
          <p className="text-gray-400">
            The AI Game Generator is available starting from the{" "}
            <span className="font-semibold text-indigo-300 capitalize">
              {requiredPlan}
            </span>{" "}
            plan. Your current plan{" "}
            <span className="font-semibold text-white capitalize">
              {currentPlan}
            </span>{" "}
            does not include this feature.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
            <button
              onClick={() =>
                navigate("/plan?required=ai-generator", { replace: true })
              }
              className="px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
            >
              View Plans
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-dark text-gray-text font-sans flex flex-col overflow-hidden">
      <ResponsiveNavbar
        title="AI Studio"
        titleColor="text-purple-400"
        user={user}
        onLogout={handleLogout}
        backButton={{
          text: "Back",
          onClick: () => navigate("/create-project"),
        }}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <div className="flex-1 lg:flex-none lg:w-1/2 min-h-0 overflow-hidden">
          <PromptPanel
            prompt={prompt}
            setPrompt={(newPrompt) => {
              setPrompt(newPrompt);
              if (newPrompt !== prompt) {
                setIsGenerationComplete(false); // Reset completion state when prompt changes
              }
            }}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            onExampleSelect={handleExamplePrompt}
            onCreate={handleCreate}
            hasGeneratedCode={isGenerationComplete && !isLoading}
          />
        </div>
        <div className="flex-1 lg:flex-none lg:w-1/2 border-t lg:border-t-0 lg:border-l border-gray-600 min-h-0 overflow-hidden">
          <PreviewPanel
            code={generatedCode}
            isLoading={isLoading}
            error={error}
            view={activeView}
            setView={setActiveView}
          />
        </div>
      </main>
    </div>
  );
};

export default CreateProjectAIPage;
