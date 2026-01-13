import { create } from 'zustand';

interface ChatState {
  activeConversationId: string | null;
  streamingMessage: string;
  isStreaming: boolean;
  isThinking: boolean;

  setActiveConversation: (id: string | null) => void;
  setStreamingMessage: (message: string) => void;
  appendToStreamingMessage: (chunk: string) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setIsThinking: (isThinking: boolean) => void;
  clearStreamingMessage: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  streamingMessage: '',
  isStreaming: false,
  isThinking: false,

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setStreamingMessage: (message) => set({ streamingMessage: message }),

  appendToStreamingMessage: (chunk) =>
    set((state) => ({ streamingMessage: state.streamingMessage + chunk, isThinking: false })),

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  setIsThinking: (isThinking) => set({ isThinking }),

  clearStreamingMessage: () => set({ streamingMessage: '', isStreaming: false, isThinking: false }),
}));
