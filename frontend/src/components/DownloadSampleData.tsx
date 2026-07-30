import { useState } from 'react';
import { CascadeData } from '@/types/cascade';

interface DownloadSampleDataProps {
  data: CascadeData;
}

export default function DownloadSampleData({ data }: DownloadSampleDataProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Convert data to JSON string for download
  const generateJson = () => {
    return JSON.stringify(data, null, 2);
  };

  const handleDownload = () => {
    setIsGenerating(true);
    const jsonData = generateJson();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-cascade-data-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setIsGenerating(false);
  };

  const handleGenerateMock = () => {
    // In a real app, this might generate new mock data
    // For now, we'll just regenerate the same data
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // In a real implementation, we would fetch new data or regenerate
      alert('New mock data generated! (In a real app, this would fetch fresh data)');
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Download Data</h3>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Export the current cascade data for further analysis or sharing.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isGenerating ? 'Preparing...' : 'Download JSON'}
            {!isGenerating && (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M5 10l5 5m0-5L5 5" />
              </svg>
            )}
          </button>

          <button
            onClick={handleGenerateMock}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
          >
            Generate New Mock Data
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M5 10h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
            </svg>
          </button>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p><strong>Format:</strong> JSON</p>
            <p><strong>Includes:</strong> Nodes, edges, timeline data, influencer metrics, decay curves</p>
            <p><strong>Use Case:</strong> Import into analysis tools, share with team, or use for model training</p>
          </div>
        </div>
      </div>
    </div>
  );
}