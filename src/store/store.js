import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      name: "",
      email: "",
      avatar: "/avatars/shadcn.jpg",
      userId: "",
      isAuthenticated: false,
      
      // Setters
      SetName: (name) => set({ name }),
      SetEmail: (email) => set({ email }),
      SetAvatar: (avatar) => set({ avatar }),
      SetUserId: (userId) => set({ userId }),
      
      // Login action - set all user data at once
      login: (userData) => set({
        name: userData.name || "",
        email: userData.email || "",
        userId: userData.userId || userData._id || "",
        isAuthenticated: true
      }),
      
      // Logout action - clear all user data
      logout: () => set({
        name: "",
        email: "",
        avatar: "/avatars/shadcn.jpg",
        userId: "",
        isAuthenticated: false
      }),
      
      // Check if user is logged in
      checkAuth: () => {
        const state = get();
        return state.isAuthenticated && state.userId;
      }
    }),
    {
      name: 'papergenie-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        name: state.name,
        email: state.email,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
        avatar: state.avatar
      })
    }
  )
)

export default useStore