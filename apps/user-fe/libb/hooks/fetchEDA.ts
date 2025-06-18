// hooks/useDataset.ts
import { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/libb/hooks';
import { fetchDatasetIdByProjectId, fetchEDAByDatasetId } from '@/libb/features/data/dataActions';

export function fetchEDA(projectId: string) {
  const dispatch = useAppDispatch();
  const { datasets, status } = useAppSelector((state) => state.data);
  const dataset = datasets.length > 0 ? datasets[0] : null;
  const [timeoutReached, setTimeoutReached] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [isPolling, setIsPolling] = useState(false);

  const startPolling = useCallback((datasetId: string) => {
    setIsPolling(true);
    setTimeoutReached(false);

    // Set timeout (3 minutes)
    timeoutRef.current = setTimeout(() => {
      setTimeoutReached(true);
      stopPolling();
    }, 180000);

    // Immediate first request
    dispatch(fetchEDAByDatasetId(datasetId));

    // Start polling interval (10 seconds)
    pollIntervalRef.current = setInterval(() => {
      dispatch(fetchEDAByDatasetId(datasetId));
    }, 10000);
  }, [dispatch]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsPolling(false);
  }, []);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const datasetId = await dispatch(fetchDatasetIdByProjectId(projectId)).unwrap();
      if (datasetId) startPolling(datasetId);
    } catch (error) {
      console.error("Failed to fetch dataset ID:", error);
    }
  }, [projectId, dispatch, startPolling]);

  // Cleanup on unmount would still need useEffect, but polling is initiated manually
  // useEffect(() => () => stopPolling(), [stopPolling]);
  console.log("FEDA,",dataset)
  console.log("FEDA 2nd", dataset?.edaReport?.url)
  console.log(status, isPolling)
  return {
    dataset,
    isLoading: status === 'loading',
    error: timeoutReached 
      ? 'EDA generation timed out after 3 minutes' 
      : status === 'failed' ? 'Failed to load dataset' : null,
    isPolling,
    fetchData, // Expose for manual triggering
    stopPolling // Expose for manual cleanup
  };
}