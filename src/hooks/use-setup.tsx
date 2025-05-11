import { api } from "~/utils/api";
import { useStorage } from "./use-storage";
import { useEffect } from "react";

export const useSetup = () => {
  const { setHasUserBeenOnboarded, setHasUserCompletedSurvey } = useStorage();
  const has_user_been_onboarded = useStorage(
    (state) => state.has_user_been_onboarded,
  );
  const has_user_completed_survey = useStorage(
    (state) => state.has_user_completed_survey,
  );
  const userStatus = api.setUp.userStatus.useQuery();

  useEffect(() => {
    if (userStatus.data) {
      setHasUserBeenOnboarded(userStatus.data.onoBoarded ?? false);
      setHasUserCompletedSurvey(userStatus.data.surveryCompleted ?? false);
    }
  }
  , [userStatus.data]);

  return {
    has_user_completed_survey,
    setHasUserBeenOnboarded,
    has_user_been_onboarded,
    setHasUserCompletedSurvey,
  };
};