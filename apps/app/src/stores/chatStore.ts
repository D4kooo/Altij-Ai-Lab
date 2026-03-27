import { create } from 'zustand';

interface ChatState {
  activeConversationId: string | null;
  streamingMessage: string;
  isStreaming: boolean;
  isThinking: boolean;
  activeToolCall: { name: string; status: 'calling' | 'done' } | null;
  activeTools: string[];
  activeSkills: string[];
  activeDataSources: string[];

  setActiveConversation: (id: string | null) => void;
  setStreamingMessage: (message: string) => void;
  appendToStreamingMessage: (chunk: string) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setIsThinking: (isThinking: boolean) => void;
  setActiveToolCall: (toolCall: { name: string; status: 'calling' | 'done' } | null) => void;
  clearStreamingMessage: () => void;
  toggleTool: (id: string) => void;
  toggleSkill: (id: string) => void;
  toggleDataSource: (id: string) => void;
  initFromAssistant: (tools: string[], skills: string[], dataSources: string[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  streamingMessage: '',
  isStreaming: false,
  isThinking: false,
  activeToolCall: null,
  activeTools: [],
  activeSkills: [],
  activeDataSources: [],

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setStreamingMessage: (message) => set({ streamingMessage: message }),

  appendToStreamingMessage: (chunk) =>
    set((state) => ({ streamingMessage: state.streamingMessage + chunk, isThinking: false })),

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  setIsThinking: (isThinking) => set({ isThinking }),

  setActiveToolCall: (toolCall) => set({ activeToolCall: toolCall }),

  clearStreamingMessage: () => set({ streamingMessage: '', isStreaming: false, isThinking: false, activeToolCall: null }),

  toggleTool: (id) => set((state) => ({
    activeTools: state.activeTools.includes(id)
      ? state.activeTools.filter((t) => t !== id)
      : [...state.activeTools, id],
  })),
  toggleSkill: (id) => set((state) => ({
    activeSkills: state.activeSkills.includes(id)
      ? state.activeSkills.filter((s) => s !== id)
      : [...state.activeSkills, id],
  })),
  toggleDataSource: (id) => set((state) => ({
    activeDataSources: state.activeDataSources.includes(id)
      ? state.activeDataSources.filter((d) => d !== id)
      : [...state.activeDataSources, id],
  })),
  initFromAssistant: (tools, skills, dataSources) => set({ activeTools: tools, activeSkills: skills, activeDataSources: dataSources }),
}));
