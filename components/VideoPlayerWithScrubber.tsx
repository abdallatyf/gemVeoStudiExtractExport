/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useRef, useState, useEffect, useCallback} from 'react';
import {VideoFile} from '../types';

interface VideoPlayerWithScrubberProps {
  videoFile: VideoFile;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(minutes)}:${pad(remainingSeconds)}`;
};

const VideoPlayerWithScrubber: React.FC<VideoPlayerWithScrubberProps> = ({
  videoFile,
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
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-3">
        <video
          ref={videoRef}
          src={URL.createObjectURL(videoFile.file)}
          controls
          muted // Muted by default to avoid autoplay issues
          className="w-full h-full object-contain"
          aria-label="Video player"
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
          aria-label="Video timeline scrubber"
        />
        <span className="text-xs text-gray-400 font-mono w-10 text-left">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default VideoPlayerWithScrubber;