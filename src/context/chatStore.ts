import { create } from "zustand";

type ChatState = {
  unreadCounts: Record<string, number>;
  incrementUnread: (rideId: string) => void;
  clearUnread: (rideId: string) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  unreadCounts: {},
  incrementUnread: (rideId) =>
    set((s) => ({
      unreadCounts: {
        ...s.unreadCounts,
        [rideId]: (s.unreadCounts[rideId] || 0) + 1,
      },
    })),
  clearUnread: (rideId) =>
    set((s) => {
      const { [rideId]: _, ...rest } = s.unreadCounts;
      return { unreadCounts: rest };
    }),
}));
