import { create } from 'zustand';

import type { CodeLanguage } from '@/types/learning';

interface StepperState {
  currentStep: number
  totalSteps: number
  selectedLanguage: CodeLanguage
  isPlaying: boolean
  speed: number
  setStep: (n: number) => void
  nextStep: () => void
  prevStep: () => void
  setLanguage: (lang: CodeLanguage) => void
  setTotalSteps: (n: number) => void
  togglePlay: () => void
  setSpeed: (s: number) => void
}

export const useStepperStore = create<StepperState>((set, get) => ({
  currentStep: 0,
  totalSteps: 0,
  selectedLanguage: 'python',
  isPlaying: false,
  speed: 1,
  setStep: (n) => set({ currentStep: Math.max(0, Math.min(n, Math.max(0, get().totalSteps - 1))) }),
  nextStep: () => get().setStep(get().currentStep + 1),
  prevStep: () => get().setStep(get().currentStep - 1),
  setLanguage: (lang) => set({ selectedLanguage: lang }),
  setTotalSteps: (n) => set({ totalSteps: n }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeed: (s) => set({ speed: s }),
}));
