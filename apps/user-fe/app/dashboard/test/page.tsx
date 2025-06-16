// components/DataViewer.tsx
"use client"
import { fetchEDA } from '@/lib/hooks/fetchEDA';

export default function DataViewer() {
    const projectId = "a635f408-d92e-48d2-b5d1-74347bb68e31" 
  const { dataset, isLoading, error } = fetchEDA(projectId);

  if (isLoading) return <div>Loading dataset...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!dataset) return <div>No dataset found</div>;

  return (
    <div>
      <h2>{dataset.name}</h2>
      <p>Format: {dataset.format}</p>
      <p>Size: {dataset.size} bytes</p>
      {/* Render other dataset details */}
    </div>
  );
}