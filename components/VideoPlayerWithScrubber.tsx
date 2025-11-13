/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useRef, useState, useEffect, useCallback} from 'react';
import {VideoFile} from '../types';

interface VideoPlayerWithScrubberProps {
  videoFile: VideoFile;
  disabled?: boolean;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(minutes)}:${pad(remainingSeconds)}`;
};

const VideoPlayerWithScrubber: React.FC<VideoPlayerWithScrubberProps> = ({
  videoFile,
  disabled = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setVideoData = () => {
      setDuration(video.duration);
      setCurrentTime(video.currentTime);
    };

    const updateTime = () => setCurrentTime(video.currentTime);

    video.addEventListener('loadedmetadata', setVideoData);
    video.addEventListener('timeupdate', updateTime);

    return () => {
      video.removeEventListener('loadedmetadata', setVideoData);
      video.removeEventListener('timeupdate', updateTime);
    };
  }, [videoFile]);

  const handleScrubberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      const newTime = Number(e.target.value);
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  return (
    <div className={`flex flex-col items-center p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-3">
        <video
          ref={videoRef}
          src={URL.createObjectURL(videoFile.file)}
          controls
          muted // Muted by default to avoid autoplay issues
          className="w-full h-full object-contain"
          aria-label="Input video player"
          disablePictureInPicture
          controlsList="nodownload nofullscreen noplaybackrate"
        />
      </div>
      <div className="w-full flex items-center gap-3">
        <span className="text-xs text-gray-400 font-mono w-10 text-right">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          step="0.01"
          onChange={handleScrubberChange}
          className="flex-grow h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full"
          disabled={disabled}
          aria-label="Video timeline scrubber"
        />
        <span className="text-xs text-gray-400 font-mono w-10 text-left">
          {formatTime(duration)}
        </span>
      </div>
      <span className="text-sm mt-3 text-gray-300 font-medium">Input Video for Extension</span>
      <p className="text-xs text-gray-500 mt-1 text-center">
        (Extension will be added to the end of this video)
      </p>
    </div>
  );
};

export default VideoPlayerWithScrubber;
