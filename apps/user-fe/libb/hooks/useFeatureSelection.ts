// hooks/useFeatureSelection.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/libb/hooks";
import {  fetchFeatureSelectionResults, startFeatureSelection } from '@/libb/features/data/dataActions';;

export function useFeatureSelection(datasetId: string) {
  const dispatch = useAppDispatch();
  const { datasets, status } = useAppSelector((state) => state.data);
  console.log("Hook dataset", datasets)
  const [timeoutReached, setTimeoutReached] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dataset = datasets.length > 0 ? datasets[0] : null;
  const featureEngDone = Boolean(dataset?.featureEngArtifacts);

  const stopSelPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const startPolling = useCallback(() => {
    stopSelPolling(); // clear any existing polling

    timeoutRef.current = setTimeout(() => {
      setTimeoutReached(true);
      stopSelPolling();
    }, 180000); // 3 minutes

    pollIntervalRef.current = setInterval(() => {
      dispatch(fetchFeatureSelectionResults(datasetId));
    }, 10000);
  }, [datasetId, dispatch, stopSelPolling]);

  const startFeatureSel = useCallback(async () => {
    setTimeoutReached(false);
    console.log("dispatched start feature selection")
    await dispatch(startFeatureSelection(datasetId));
    console.log("this is from use feature selection hook", dataset)
    startPolling();
  }, [datasetId, dispatch, startPolling]);

  // 💡 Automatically stop polling if results are found
  useEffect(() => {
    if (featureEngDone) {
      stopSelPolling();
    }
  }, [featureEngDone, stopSelPolling]);

  useEffect(() => {
    return () => stopSelPolling();
  }, [stopSelPolling]);

  return {
    selResults: dataset?.featureEngArtifacts,
    isSelLoading: status === "loading",
    selError: timeoutReached 
      ? 'Feature engineering timed out after 3 minutes' 
      : status === 'failed' ? 'Failed to fetch results' : null,
    startFeatureSel,
    stopSelPolling
  };
}
