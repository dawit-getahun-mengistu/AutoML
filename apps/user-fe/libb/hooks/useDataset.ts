// hooks/useDataset.ts
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/libb/hooks';
import { fetchDatasetIdByProjectId, fetchDatasetById } from '@/libb/features/data/dataActions';

export function useDataset(projectId: string) {
  const dispatch = useAppDispatch();
  const { datasets, status } = useAppSelector((state) => state.data);
  const dataset = datasets.length > 0 ? datasets[0] : null;

  useEffect(() => {
    if (projectId) {
      // First fetch the dataset ID for this project
      dispatch(fetchDatasetIdByProjectId(projectId))
        .unwrap()
        .then((datasetId) => {
          // Then fetch the full dataset using the ID
          console.log("datasetId",datasetId)
          if (datasetId) {
            dispatch(fetchDatasetById(datasetId));
          }
        });
    }
  }, [projectId, dispatch]);

  return {
    dataset,
    isLoading: status === 'loading',
    error: status === 'failed' ? 'Failed to load dataset' : null
  };
}