import { create } from 'zustand';
import { Language } from '@/types';

interface StepperState {
  currentStep: number;
  totalSteps: number;
  selectedLanguage: Language;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setLanguage: (lang: Language) => void;
  initSteps: (total: number) => void;
}

export const useStepperStore = create<StepperState>((set) => ({
  currentStep: 0,
  totalSteps: 0,
  selectedLanguage: 'python',
  setStep: (step) => set((state) => ({ currentStep: Math.max(0, Math.min(step, Math.max(0, state.totalSteps - 1))) })),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, Math.max(0, state.totalSteps - 1)) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
  setLanguage: (lang) => set({ selectedLanguage: lang }),
  initSteps: (total) => set({ totalSteps: total, currentStep: 0 }),
}));
