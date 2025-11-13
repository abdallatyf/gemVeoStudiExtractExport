/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useRef, useState, useEffect} from 'react';
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

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(minutes)}:${pad(remainingSeconds)}`;
};

const VideoResult: React.FC<VideoResultProps> = ({
  videoUrl,
  onRetry,
  onNewVideo,
  onExtend,
  canExtend,
  videoAspectRatio,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState<{width: number; height: number} | null>(null); // New state for video dimensions

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setCurrentTime(video.currentTime);
      setVideoDimensions({width: video.videoWidth, height: video.videoHeight}); // Capture dimensions
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoUrl]); // Re-run effect if videoUrl changes

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
    'transition-all', // Add transition for smooth animation
    'hover:scale-[1.02]', // Slightly scale up on hover
    'hover:shadow-2xl', // Add a larger shadow on hover
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
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          loop
          className="w-full h-full object-contain"
          aria-label="Generated video"
        />
        <div className="flex justify-between items-center px-4 py-2 bg-gray-900 text-gray-400 text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      {videoDimensions && (
        <p className="text-sm text-gray-400 -mt-6">
          Resolution: {videoDimensions.width}x{videoDimensions.height}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          aria-label="Retry generation">
          <ArrowPathIcon className="w-5 h-5" />
          Retry Generation
        </button>
        {canExtend && (
          <button
            onClick={onExtend}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            aria-label="Extend video">
            <SparklesIcon className="w-5 h-5" />
            Extend
          </button>
        )}
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          aria-label="Download video">
          <DownloadIcon className="w-5 h-5" />
          Download
        </button>
        <button
          onClick={onNewVideo}
          className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          aria-label="Create new video">
          <PlusIcon className="w-5 h-5" />
          New Video
        </button>
      </div>
    </div>
  );
};

export default VideoResult;