// components/DataViewer.tsx
"use client"
import { fetchEDA } from '@/libb/hooks/fetchEDA';
import { useFeatureEngineering } from '@/libb/hooks/useFeatureEngineering';
import { useEffect } from 'react';

export default function DataViewer() {
    const projectId = "ca379c92-70d7-466a-b07d-240e5b18e892"
    const dataId = "c62eced7-ae43-4904-b6ef-4c634f60d81c"
    // const { dataset, } = fetchEDA(projectId);
    const { 
  results, 
  isLoading, 
  error, 
  startFeatureEng, 
  isPolling 
} = useFeatureEngineering(dataId);
console.log("results what feature engineering is giving", results)
useEffect(()=> {
    if (!isLoading) {
      
    } 
  }, [isLoading])

  useEffect(()=> {
    if (!isPolling) {
      
    } 
  }, [isPolling])
  

  // if (isLoading) return <div>Loading dataset...</div>;
  // if (error) return <div>Error: {error}</div>;
  // if (!results) return <div>No dataset found <button onClick={startFeatureEng}>Start Feature Engineering</button></div>;

  return (
    <>
    <button onClick={startFeatureEng}>Start Feature Engineering</button>
    {isLoading && <p>Working...</p>}
    {error && <p style={{ color: 'red' }}>{error}</p>}
    {results && <pre>{JSON.stringify(results, null, 2)}</pre>}
    <iframe 
                    src={results?.url} 
                    width="100%" 
                    height="500px"
                    title="EDA Visualization"
                  />
  </>
  );
}