import { create } from 'zustand';

interface ExampleState {
  count: number;
  increment: () => void;
  fetchData: () => Promise<void>;
}

export const useExampleStore = create<ExampleState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  fetchData: async () => {
    try {
      // Async operation
      const response = await fetch('/api/data');
      const data = await response.json();
      set({ count: data.count });
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  }
}));
