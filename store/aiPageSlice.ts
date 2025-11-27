import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string; // ISO string for serialization
  isGenerating?: boolean;
}

interface AIPageState {
  projectName: string;
  messages: ChatMessage[];
  generatedCode: string;
  isGenerationComplete: boolean;
}

const initialState: AIPageState = {
  projectName: "Project name",
  messages: [
    {
      id: "1",
      text: "Hello! I'm your AI assistant. Describe a game you'd like to create, and I'll generate the code for you!",
      isUser: false,
      timestamp: new Date().toISOString(),
    },
  ],
  generatedCode: "",
  isGenerationComplete: false,
};

const aiPageSlice = createSlice({
  name: "aiPage",
  initialState,
  reducers: {
    setProjectName: (state, action: PayloadAction<string>) => {
      state.projectName = action.payload;
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    updateMessage: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ChatMessage> }>
    ) => {
      const index = state.messages.findIndex(
        (msg) => msg.id === action.payload.id
      );
      if (index !== -1) {
        state.messages[index] = {
          ...state.messages[index],
          ...action.payload.updates,
        };
      }
    },
    removeMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(
        (msg) => msg.id !== action.payload
      );
    },
    setGeneratedCode: (state, action: PayloadAction<string>) => {
      state.generatedCode = action.payload;
    },
    setIsGenerationComplete: (state, action: PayloadAction<boolean>) => {
      state.isGenerationComplete = action.payload;
    },
    resetAIPageState: (state) => {
      state.projectName = "Project name";
      state.messages = [
        {
          id: "1",
          text: "Hello! I'm your AI assistant. Describe a game you'd like to create, and I'll generate the code for you!",
          isUser: false,
          timestamp: new Date().toISOString(),
        },
      ];
      state.generatedCode = "";
      state.isGenerationComplete = false;
    },
  },
});

export const {
  setProjectName,
  setMessages,
  addMessage,
  updateMessage,
  removeMessage,
  setGeneratedCode,
  setIsGenerationComplete,
  resetAIPageState,
} = aiPageSlice.actions;

export default aiPageSlice.reducer;

