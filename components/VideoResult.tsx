/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {AspectRatio} from '../types';
import {ArrowPathIcon, DownloadIcon, PlusIcon, SparklesIcon} from './icons';

interface VideoResultProps {
  videoUrl: string;
  onRetry: () => void;
  onNewVideo: () => void;
  onExtend: () => void;
  canExtend: boolean;
  videoAspectRatio: AspectRatio; // New prop for video aspect ratio
}

const VideoResult: React.FC<VideoResultProps> = ({
  videoUrl,
  onRetry,
  onNewVideo,
  onExtend,
  canExtend,
  videoAspectRatio,
}) => {
  const handleDownload = () => {
    // Create an anchor element dynamically to trigger the download
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = 'generated-video.mp4'; // Suggest a default filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const videoContainerClasses = [
    'w-full',
    'rounded-lg',
    'overflow-hidden',
    'bg-black',
    'shadow-lg',
  ];

  if (videoAspectRatio === AspectRatio.PORTRAIT) {
    videoContainerClasses.push('max-w-sm', 'max-h-[80vh]', 'aspect-[9/16]');
  } else {
    videoContainerClasses.push('max-w-2xl', 'aspect-[16/9]');
  }

  return (
    <div className="w-full flex flex-col items-center gap-8 p-8 bg-gray-800/50 rounded-lg border border-gray-700 shadow-2xl">
      <h2 className="text-2xl font-bold text-gray-200">
        Your Creation is Ready!
      </h2>
      <div className={videoContainerClasses.join(' ')}>
        <video
          src={videoUrl}
          controls
          autoPlay
          loop
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors">
          <ArrowPathIcon className="w-5 h-5" />
          Retry
        </button>
        {canExtend && (
          <button
            onClick={onExtend}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
            <SparklesIcon className="w-5 h-5" />
            Extend
          </button>
        )}
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
          <DownloadIcon className="w-5 h-5" />
          Download
        </button>
        <button
          onClick={onNewVideo}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
          <PlusIcon className="w-5 h-5" />
          New Video
        </button>
      </div>
    </div>
  );
};

export default VideoResult;