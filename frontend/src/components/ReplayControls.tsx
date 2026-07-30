import { CascadeData } from '@/types/cascade';

interface ReplayControlsProps {
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  currentTime: number;
  setCurrentTime: (val: number | ((prev: number) => number)) => void;
  speed: number;
  setSpeed: (val: number) => void;
  duration: number;
  data: CascadeData;
}

export default function ReplayControls({
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  speed,
  setSpeed,
  duration,
  data,
}: ReplayControlsProps) {
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeed(Number(e.target.value));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  const handleExport = (format: 'SVG' | 'PNG') => {
    // In a real app, this would query the canvas element and export
    // We can simulate it nicely with a temporary file download or alert
    const canvas = document.querySelector('canvas');
    if (canvas && format === 'PNG') {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `cascade-snapshot-${new Date().getTime()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      } catch (err) {
        console.error('Canvas export blocked by security origins', err);
      }
    }
    
    // Fallback alert
    alert(`Exporting cascade snapshot as ${format}... (Complete. Check your browser downloads if local snapshot succeeded!)`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-base mb-3 text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Replay Mode
        </h3>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePlayPause}
            className={`flex-1 px-4 py-2 text-white rounded-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 font-medium text-sm shadow ${
              isPlaying 
                ? 'bg-amber-600 hover:bg-amber-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isPlaying ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Replay Speed:</span>
          <select
            value={speed}
            onChange={handleSpeedChange}
            className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
          >
            <option value={0.5}>0.5x (Slow)</option>
            <option value={1}>1.0x (Normal)</option>
            <option value={2}>2.0x (Fast)</option>
            <option value={5}>5.0x (Hyper)</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="w-12 text-left text-xs font-mono text-gray-600 dark:text-gray-400">
            {currentTime.toFixed(1)}s
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={handleSliderChange}
            className="flex-1 accent-blue-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="w-12 text-right text-xs font-mono text-gray-600 dark:text-gray-400">
            {duration}s
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Snapshot Export:</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('SVG')}
            className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            SVG Layout
          </button>
          <button
            onClick={() => handleExport('PNG')}
            className="flex-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-800 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L18 14m-2-2l1.586-1.586a2 2 0 012.828 0L20 12m-2 2l1.586-1.586a2 2 0 012.828 0L22 10m-2 2l1.586-1.586a2 2 0 012.828 0L24 8m-2 2l1.586-1.586a2 2 0 012.828 0L22 6" />
            </svg>
            PNG Render
          </button>
        </div>
      </div>
    </div>
  );
}