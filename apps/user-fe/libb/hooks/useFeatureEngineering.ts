// hooks/useFeatureEngineering.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/libb/hooks";
import { startFeatureEngineering, fetchFeatureEngineeringResults } from '@/libb/features/data/dataActions';;

export function useFeatureEngineering(datasetId: string) {
  const dispatch = useAppDispatch();
  const { datasets, status } = useAppSelector((state) => state.data);
  console.log("Hook dataset", datasets)
  const [timeoutReached, setTimeoutReached] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dataset = datasets.length > 0 ? datasets[0] : null;
  const featureEngDone = Boolean(dataset?.featureEngArtifacts);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const startPolling = useCallback(() => {
    stopPolling(); // clear any existing polling

    timeoutRef.current = setTimeout(() => {
      setTimeoutReached(true);
      stopPolling();
    }, 180000); // 3 minutes

    pollIntervalRef.current = setInterval(() => {
      dispatch(fetchFeatureEngineeringResults(datasetId));
    }, 10000);
  }, [datasetId, dispatch, stopPolling]);

  const startFeatureEng = useCallback(async () => {
    setTimeoutReached(false);
    await dispatch(startFeatureEngineering(datasetId));
    console.log("this is from use feature engineering hook", dataset)
    startPolling();
  }, [datasetId, dispatch, startPolling]);

  // 💡 Automatically stop polling if results are found
  useEffect(() => {
    if (featureEngDone) {
      stopPolling();
    }
  }, [featureEngDone, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    results: dataset?.featureEngArtifacts,
    isLoading: status === "loading",
    error: timeoutReached 
      ? 'Feature engineering timed out after 3 minutes' 
      : status === 'failed' ? 'Failed to fetch results' : null,
    startFeatureEng,
    stopPolling
  };
}
