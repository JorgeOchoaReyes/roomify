import { create } from "zustand";
import { devtools, persist } from "zustand/middleware"; 

interface Storage {
    has_user_been_onboarded: boolean;
    setHasUserBeenOnboarded: (has_user_been_onboarded: boolean) => void;
    has_user_completed_survey: boolean;
    setHasUserCompletedSurvey: (has_user_completed_survey: boolean) => void;
}

export const useStorage = create<Storage>()(
  devtools(
    persist(
      (set) => ({
        has_user_been_onboarded: false,
        setHasUserBeenOnboarded: (has_user_been_onboarded) =>
          set(() => ({ has_user_been_onboarded })),
        has_user_completed_survey: false,
        setHasUserCompletedSurvey: (has_user_completed_survey) =>
          set(() => ({ has_user_completed_survey })),
      }),
      {
        name: "roomify-storage",
      },
    ),
  ),
);