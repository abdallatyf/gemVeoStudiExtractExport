/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  AspectRatio,
  AudioFile, // Import AudioFile
  DEFAULT_FRAME_RATE,
  DEFAULT_TEXT_COLOR,
  DEFAULT_VIDEO_DURATION_SECONDS,
  DEFAULT_FONT_SIZE,
  EncodingProfile,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  MAX_FRAME_RATE,
  MAX_FONT_SIZE,
  MAX_VIDEO_DURATION_SECONDS,
  MIN_FRAME_RATE,
  MIN_FONT_SIZE,
  MIN_VIDEO_DURATION_SECONDS,
  Resolution,
  TextOverlay, // Import TextOverlay
  VeoModel,
  VideoFile,
  VideoQuality,
} from '../types';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  FilmIcon,
  FramesModeIcon,
  PlusIcon,
  RectangleStackIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TextModeIcon,
  TvIcon,
  XMarkIcon,
  TextIcon, // New icon for text overlay
  // Fix: Import ReferencesModeIcon
  ReferencesModeIcon,
} from './icons';
import VideoPlayerWithScrubber from './VideoPlayerWithScrubber'; // Import the new component

const aspectRatioDisplayNames: Record<AspectRatio, string> = {
  [AspectRatio.LANDSCAPE]: 'Landscape (16:9)',
  [AspectRatio.PORTRAIT]: 'Portrait (9:16)',
};

const modeIcons: Record<GenerationMode, React.ReactNode> = {
  [GenerationMode.TEXT_TO_VIDEO]: <TextModeIcon className="w-5 h-5" />,
  [GenerationMode.FRAMES_TO_VIDEO]: <FramesModeIcon className="w-5 h-5" />,
  [GenerationMode.REFERENCES_TO_VIDEO]: (
    <ReferencesModeIcon className="w-5 h-5" />
  ),
  [GenerationMode.EXTEND_VIDEO]: <FilmIcon className="w-5 h-5" />,
};

const textOverlayPositionNames: Record<TextOverlay['position'], string> = {
  topLeft: 'Top Left',
  topCenter: 'Top Center',
  topRight: 'Top Right',
  midLeft: 'Middle Left',
  midCenter: 'Middle Center',
  midRight: 'Middle Right',
  bottomLeft: 'Bottom Left',
  bottomCenter: 'Bottom Center',
  bottomRight: 'Bottom Right',
};


const fileToBase64 = <T extends {file: File; base64: string}>(
  file: File,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (base64) {
        resolve({file, base64} as T);
      } else {
        reject(new Error('Failed to read file as base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
const fileToImageFile = (file: File): Promise<ImageFile> =>
  fileToBase64<ImageFile>(file);
const fileToVideoFile = (file: File): Promise<VideoFile> =>
  fileToBase64<VideoFile>(file);
const fileToAudioFile = (file: File): Promise<AudioFile> =>
  fileToBase64<AudioFile>(file); // New helper for audio files

const CustomSelect: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({label, value, onChange, icon, children, disabled = false}) => (
  <div>
    <label
      className={`text-xs block mb-1.5 font-medium ${
        disabled ? 'text-gray-500' : 'text-gray-400'
      }`}>
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        {icon}
      </div>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg pl-10 pr-8 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed">
        {children}
      </select>
      <ChevronDownIcon
        className={`w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
          disabled ? 'text-gray-600' : 'text-gray-400'
        }`}
      />
    </div>
  </div>
);

const ImageUpload: React.FC<{
  onSelect: (image: ImageFile) => void;
  onRemove?: () => void;
  image?: ImageFile | null;
  label: React.ReactNode;
}> = ({onSelect, onRemove, image, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToImageFile(file);
        onSelect(imageFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
    // Reset input value to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (image) {
    return (
      <div className="relative w-28 h-20 group">
        <img
          src={URL.createObjectURL(image.file)}
          alt="preview"
          className="w-full h-full object-cover rounded-lg"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove image">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-28 h-20 bg-gray-700/50 hover:bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors">
      <PlusIcon className="w-6 h-6" />
      <span className="text-xs mt-1">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </button>
  );
};

const VideoUpload: React.FC<{
  onSelect: (video: VideoFile) => void;
  onRemove?: () => void;
  video?: VideoFile | null;
  label: React.ReactNode;
}> = ({onSelect, onRemove, video, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const videoFile = await fileToVideoFile(file);
        onSelect(videoFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
  };

  if (video) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-28 group">
          <video
            src={URL.createObjectURL(video.file)}
            controls // Added controls for video playback
            className="w-full h-full object-cover rounded-lg"
            aria-label="Video preview"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove video">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <span className="text-xs mt-2 text-gray-400">Input Video</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-48 h-28 bg-gray-700/50 hover:bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors text-center">
      <PlusIcon className="w-6 h-6" />
      <span className="text-xs mt-1 px-2">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
    </button>
  );
};

// New AudioUpload Component
const AudioUpload: React.FC<{
  onSelect: (audio: AudioFile) => void;
  onRemove?: () => void;
  audio?: AudioFile | null;
  label: React.ReactNode;
  disabled?: boolean;
}> = ({onSelect, onRemove, audio, label, disabled = false}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const audioFile = await fileToAudioFile(file);
        onSelect(audioFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
    if (inputRef.current) {
      inputRef.current.value = ''; // Reset input value
    }
  };

  if (audio) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-16 group">
          <div className="w-full h-full bg-[#1f1f1f] border border-gray-600 rounded-lg flex items-center justify-center text-gray-300 overflow-hidden text-sm px-2">
            <span className="truncate">{audio.file.name}</span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove audio">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <span className="text-xs mt-2 text-gray-400">Background Track</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && inputRef.current?.click()}
      disabled={disabled}
      className={`w-48 h-16 bg-gray-700/50 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 text-center transition-colors ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-gray-700 hover:text-white'
      }`}>
      <PlusIcon className="w-6 h-6" />
      <span className="text-xs mt-1 px-2">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="audio/*"
        className="hidden"
        disabled={disabled}
      />
    </button>
  );
};

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  initialValues?: GenerateVideoParams | null;
}

const PromptForm: React.FC<PromptFormProps> = ({
  onGenerate,
  initialValues,
}) => {
  const [prompt, setPrompt] = useState(initialValues?.prompt ?? '');
  const [model, setModel] = useState<VeoModel>(
    initialValues?.model ?? VeoModel.VEO_FAST,
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    initialValues?.aspectRatio ?? AspectRatio.LANDSCAPE,
  );
  // `resolution` is now largely derived, but kept as state to reflect UI changes for `videoQuality`
  const [resolution, setResolution] = useState<Resolution>(
    initialValues?.resolution ?? Resolution.P720,
  );
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    initialValues?.mode ?? GenerationMode.TEXT_TO_VIDEO,
  );
  const [startFrame, setStartFrame] = useState<ImageFile | null>(
    initialValues?.startFrame ?? null,
  );
  const [endFrame, setEndFrame] = useState<ImageFile | null>(
    initialValues?.endFrame ?? null,
  );
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>(
    initialValues?.referenceImages ?? [],
  );
  const [styleImage, setStyleImage] = useState<ImageFile | null>(
    initialValues?.styleImage ?? null,
  );
  const [inputVideo, setInputVideo] = useState<VideoFile | null>(
    initialValues?.inputVideo ?? null,
  );
  const [inputVideoObject, setInputVideoObject] = useState<Video | null>(
    initialValues?.inputVideoObject ?? null,
  );
  const [isLooping, setIsLooping] = useState(initialValues?.isLooping ?? false);
  const [videoQuality, setVideoQuality] = useState<VideoQuality>(
    initialValues?.videoQuality ?? VideoQuality.MEDIUM,
  );
  const [durationSeconds, setDurationSeconds] = useState<number>(
    initialValues?.durationSeconds ?? DEFAULT_VIDEO_DURATION_SECONDS,
  );
  const [frameRate, setFrameRate] = useState<number>(
    initialValues?.frameRate ?? DEFAULT_FRAME_RATE,
  );
  const [encodingProfile, setEncodingProfile] = useState<EncodingProfile>(
    initialValues?.encodingProfile ?? EncodingProfile.STANDARD,
  );
  const [backgroundMusic, setBackgroundMusic] = useState<AudioFile | null>(
    initialValues?.backgroundMusic ?? null,
  ); // New state for background music

  // New states for Text Overlay
  const [textOverlayEnabled, setTextOverlayEnabled] = useState(
    !!initialValues?.textOverlay,
  );
  const [textOverlay, setTextOverlay] = useState<TextOverlay | null>(
    initialValues?.textOverlay ?? null,
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);

  // Sync state with initialValues prop when it changes (e.g., for "Extend" or "Try Again")
  useEffect(() => {
    if (initialValues) {
      setPrompt(initialValues.prompt ?? '');
      setModel(initialValues.model ?? VeoModel.VEO_FAST);
      setAspectRatio(initialValues.aspectRatio ?? AspectRatio.LANDSCAPE);
      setResolution(initialValues.resolution ?? Resolution.P720); // Keep for display purposes mainly
      setGenerationMode(initialValues.mode ?? GenerationMode.TEXT_TO_VIDEO);
      setStartFrame(initialValues.startFrame ?? null);
      setEndFrame(initialValues.endFrame ?? null);
      setReferenceImages(initialValues.referenceImages ?? []);
      setStyleImage(initialValues.styleImage ?? null);
      setInputVideo(initialValues.inputVideo ?? null);
      setInputVideoObject(initialValues.inputVideoObject ?? null);
      setIsLooping(initialValues.isLooping ?? false);
      setVideoQuality(initialValues.videoQuality ?? VideoQuality.MEDIUM);
      setDurationSeconds(
        initialValues.durationSeconds ?? DEFAULT_VIDEO_DURATION_SECONDS,
      );
      setFrameRate(initialValues.frameRate ?? DEFAULT_FRAME_RATE);
      setEncodingProfile(initialValues.encodingProfile ?? EncodingProfile.STANDARD);
      setBackgroundMusic(initialValues.backgroundMusic ?? null); // Sync background music
      
      setTextOverlay(initialValues.textOverlay ?? null);
      setTextOverlayEnabled(!!initialValues.textOverlay);
    }
  }, [initialValues]);

  // Handle changes in generation mode affecting resolution and model
  useEffect(() => {
    const isRefMode = generationMode === GenerationMode.REFERENCES_TO_VIDEO;
    const isExtendMode = generationMode === GenerationMode.EXTEND_VIDEO;

    if (isRefMode) {
      setModel(VeoModel.VEO); // Fixed model for REF mode
      setAspectRatio(AspectRatio.LANDSCAPE); // Fixed aspect ratio for REF mode
    }

    if (isRefMode || isExtendMode) {
      setResolution(Resolution.P720); // Force 720p for these modes
      // Don't set videoQuality here, it will be derived for display if disabled
    } else {
      // For other modes, set resolution based on current videoQuality
      const currentResolution =
        videoQuality === VideoQuality.HIGH ? Resolution.P1080 : Resolution.P720;
      setResolution(currentResolution);
    }
  }, [generationMode, videoQuality]); // `videoQuality` is a dependency to ensure resolution updates when switching out of fixed modes

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modeSelectorRef.current &&
        !modeSelectorRef.current.contains(event.target as Node)
      ) {
        setIsModeSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVideoQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuality = e.target.value as VideoQuality;
    setVideoQuality(newQuality);
    if (newQuality === VideoQuality.HIGH) {
      setResolution(Resolution.P1080);
    } else {
      setResolution(Resolution.P720);
    }
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const finalResolution =
        generationMode === GenerationMode.REFERENCES_TO_VIDEO ||
        generationMode === GenerationMode.EXTEND_VIDEO
          ? Resolution.P720 // Fixed resolution for these modes
          : videoQuality === VideoQuality.HIGH
            ? Resolution.P1080
            : Resolution.P720; // Derived from videoQuality for flexible modes

      onGenerate({
        prompt,
        model,
        aspectRatio,
        resolution: finalResolution, // Use the derived final resolution
        mode: generationMode,
        startFrame,
        endFrame,
        referenceImages,
        styleImage,
        inputVideo,
        inputVideoObject,
        isLooping,
        videoQuality, // Pass the selected video quality for initialValues tracking
        durationSeconds, // Pass the selected duration
        frameRate, // Pass the selected frame rate
        encodingProfile, // Pass the selected encoding profile
        backgroundMusic, // Pass the selected background music
        textOverlay: textOverlayEnabled && textOverlay?.text ? textOverlay : null, // Pass text overlay if enabled and has text
      });
    },
    [
      prompt,
      model,
      aspectRatio,
      generationMode,
      startFrame,
      endFrame,
      referenceImages,
      styleImage,
      inputVideo,
      inputVideoObject,
      onGenerate,
      isLooping,
      videoQuality,
      durationSeconds,
      frameRate,
      encodingProfile,
      backgroundMusic, // Added backgroundMusic to dependencies
      textOverlayEnabled,
      textOverlay,
    ],
  );

  const handleSelectMode = (mode: GenerationMode) => {
    setGenerationMode(mode);
    setIsModeSelectorOpen(false);
    // Reset media when mode changes to avoid confusion
    setStartFrame(null);
    setEndFrame(null);
    setReferenceImages([]);
    setStyleImage(null);
    setInputVideo(null);
    setInputVideoObject(null);
    setIsLooping(false);
    setDurationSeconds(DEFAULT_VIDEO_DURATION_SECONDS); // Reset duration on mode change
    setFrameRate(DEFAULT_FRAME_RATE); // Reset frame rate on mode change
    setEncodingProfile(EncodingProfile.STANDARD); // Reset encoding profile on mode change
    setBackgroundMusic(null); // Reset background music on mode change
    setTextOverlay(null); // Reset text overlay on mode change
    setTextOverlayEnabled(false); // Disable text overlay on mode change
  };

  const promptPlaceholder = {
    [GenerationMode.TEXT_TO_VIDEO]: 'Describe the video you want to create...',
    [GenerationMode.FRAMES_TO_VIDEO]:
      'Describe motion between start and end frames (optional)...',
    [GenerationMode.REFERENCES_TO_VIDEO]:
      'Describe a video using reference and style images...',
    [GenerationMode.EXTEND_VIDEO]: 'Describe what happens next (optional)...',
  }[generationMode];

  const selectableModes = [
    GenerationMode.TEXT_TO_VIDEO,
    GenerationMode.FRAMES_TO_VIDEO,
    GenerationMode.REFERENCES_TO_VIDEO,
  ];

  const renderMediaUploads = () => {
    if (generationMode === GenerationMode.FRAMES_TO_VIDEO) {
      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center gap-4">
            <ImageUpload
              label="Start Frame"
              image={startFrame}
              onSelect={setStartFrame}
              onRemove={() => {
                setStartFrame(null);
                setIsLooping(false);
              }}
            />
            {!isLooping && (
              <ImageUpload
                label="End Frame"
                image={endFrame}
                onSelect={setEndFrame}
                onRemove={() => setEndFrame(null)}
              />
            )}
          </div>
          {startFrame && !endFrame && (
            <div className="mt-3 flex items-center">
              <input
                id="loop-video-checkbox"
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-gray-800 cursor-pointer"
              />
              <label
                htmlFor="loop-video-checkbox"
                className="ml-2 text-sm font-medium text-gray-300 cursor-pointer">
                Create a looping video
              </label>
            </div>
          )}
        </div>
      );
    }
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-wrap items-center justify-center gap-2">
          {referenceImages.map((img, index) => (
            <ImageUpload
              key={index}
              image={img}
              label=""
              onSelect={() => {}}
              onRemove={() =>
                setReferenceImages((imgs) => imgs.filter((_, i) => i !== index))
              }
            />
          ))}
          {referenceImages.length < 3 && (
            <ImageUpload
              label="Add Reference"
              onSelect={(img) => setReferenceImages((imgs) => [...imgs, img])}
            />
          )}
          {/* <ImageUpload
            label="Style Image"
            image={styleImage}
            onSelect={setStyleImage}
            onRemove={() => setStyleImage(null)}
          /> */}
        </div>
      );
    }
    if (generationMode === GenerationMode.EXTEND_VIDEO) {
      return (
        <div className="mb-3">
          {inputVideo ? (
            <div className="relative p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col items-center">
              <VideoPlayerWithScrubber videoFile={inputVideo} />
              <button
                type="button"
                onClick={() => {
                  setInputVideo(null);
                  setInputVideoObject(null);
                }}
                className="absolute top-6 right-6 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-opacity z-10"
                aria-label="Remove video">
                <XMarkIcon className="w-5 h-5" />
              </button>
              <span className="text-sm mt-3 text-gray-300 font-medium">Input Video for Extension</span>
              <p className="text-xs text-gray-500 mt-1 text-center">
                (Extension will be added to the end of this video)
              </p>
            </div>
          ) : (
            <div className="p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex items-center justify-center gap-4">
              <VideoUpload
                label={
                  <>
                    Input Video
                    <br />
                    (must be 720p veo generated)
                  </>
                }
                video={inputVideo}
                onSelect={setInputVideo}
                onRemove={() => {
                  setInputVideo(null);
                  setInputVideoObject(null);
                }}
              />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const isRefMode = generationMode === GenerationMode.REFERENCES_TO_VIDEO;
  const isExtendMode = generationMode === GenerationMode.EXTEND_VIDEO;
  const isFixedResolutionMode = isRefMode || isExtendMode;

  // Determine the quality to display in the select for fixed-resolution modes
  const displayedVideoQuality = isFixedResolutionMode
    ? VideoQuality.MEDIUM // Fixed to 720p, so show Medium
    : videoQuality;

  // Determine the effective resolution for the 1080p warning
  const currentEffectiveResolution = isFixedResolutionMode
    ? Resolution.P720
    : videoQuality === VideoQuality.HIGH
      ? Resolution.P1080
      : Resolution.P720; // Default to 720p for LOW/MEDIUM

  // Disable additional settings for certain modes
  const disableAdvancedSettings = isFixedResolutionMode || isExtendMode;
  const disableTextOverlayControls = !textOverlayEnabled || disableAdvancedSettings;

  let isSubmitDisabled = false;
  let tooltipText = '';

  switch (generationMode) {
    case GenerationMode.TEXT_TO_VIDEO:
      isSubmitDisabled = !prompt.trim();
      if (isSubmitDisabled) {
        tooltipText = 'Please enter a prompt.';
      }
      break;
    case GenerationMode.FRAMES_TO_VIDEO:
      isSubmitDisabled = !startFrame;
      if (isSubmitDisabled) {
        tooltipText = 'A start frame is required.';
      }
      break;
    case GenerationMode.REFERENCES_TO_VIDEO:
      const hasNoRefs = referenceImages.length === 0;
      const hasNoPrompt = !prompt.trim();
      isSubmitDisabled = hasNoRefs || hasNoPrompt;
      if (hasNoRefs && hasNoPrompt) {
        tooltipText = 'Please add reference image(s) and enter a prompt.';
      } else if (hasNoRefs) {
        tooltipText = 'At least one reference image is required.';
      } else if (hasNoPrompt) {
        tooltipText = 'Please enter a prompt.';
      }
      break;
    case GenerationMode.EXTEND_VIDEO:
      isSubmitDisabled = !inputVideoObject;
      if (isSubmitDisabled) {
        tooltipText =
          'An input video from a previous generation is required to extend.';
      }
      break;
  }

  return (
    <div className="relative w-full">
      {isSettingsOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CustomSelect
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value as VeoModel)}
              icon={<SparklesIcon className="w-5 h-5 text-gray-400" />}
              disabled={isRefMode}>
              {Object.values(VeoModel).map((modelValue) => (
                <option key={modelValue} value={modelValue}>
                  {modelValue}
                </option>
              ))}
            </CustomSelect>
            <CustomSelect
              label="Aspect Ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              icon={<RectangleStackIcon className="w-5 h-5 text-gray-400" />}
              disabled={isRefMode || isExtendMode}>
              {Object.entries(aspectRatioDisplayNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </CustomSelect>
            <div>
              {/* Replaced Resolution select with Video Quality select */}
              <CustomSelect
                label="Video Quality"
                value={displayedVideoQuality}
                onChange={handleVideoQualityChange}
                icon={<TvIcon className="w-5 h-5 text-gray-400" />}
                disabled={isFixedResolutionMode}>
                <option value={VideoQuality.LOW}>Low (720p)</option>
                <option value={VideoQuality.MEDIUM}>Medium (720p)</option>
                <option value={VideoQuality.HIGH}>High (1080p)</option>
              </CustomSelect>
              {currentEffectiveResolution === Resolution.P1080 && (
                <p className="text-xs text-yellow-400/80 mt-2">
                  1080p videos can't be extended.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="video-duration" className={`text-xs block mb-1.5 font-medium ${disableAdvancedSettings ? 'text-gray-500' : 'text-gray-400'}`}>
                Video Duration (seconds)
              </label>
              <div className="relative flex items-center gap-3">
                <input
                  id="video-duration"
                  type="range"
                  min={MIN_VIDEO_DURATION_SECONDS}
                  max={MAX_VIDEO_DURATION_SECONDS}
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  disabled={disableAdvancedSettings}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg disabled:opacity-50"
                />
                <input
                  type="number"
                  min={MIN_VIDEO_DURATION_SECONDS}
                  max={MAX_VIDEO_DURATION_SECONDS}
                  value={durationSeconds}
                  onChange={(e) => {
                    const value = Math.max(
                      MIN_VIDEO_DURATION_SECONDS,
                      Math.min(MAX_VIDEO_DURATION_SECONDS, Number(e.target.value)),
                    );
                    setDurationSeconds(value);
                  }}
                  disabled={disableAdvancedSettings}
                  className="w-20 bg-[#1f1f1f] border border-gray-600 rounded-lg px-3 py-2.5 text-center appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                />
              </div>
              {isExtendMode && (
                <p className="text-xs text-yellow-400/80 mt-2">
                  Duration is fixed to ~7s for video extensions.
                </p>
              )}
              {!isExtendMode && (
                 <p className="text-xs text-gray-500 mt-2">
                   Note: Model output duration may vary and is not directly controllable via the API.
                 </p>
              )}
            </div>
            {/* New Frame Rate Control */}
            <div>
              <label htmlFor="frame-rate" className={`text-xs block mb-1.5 font-medium ${disableAdvancedSettings ? 'text-gray-500' : 'text-gray-400'}`}>
                Frame Rate (FPS)
              </label>
              <div className="relative flex items-center gap-3">
                <input
                  id="frame-rate"
                  type="range"
                  min={MIN_FRAME_RATE}
                  max={MAX_FRAME_RATE}
                  value={frameRate}
                  onChange={(e) => setFrameRate(Number(e.target.value))}
                  disabled={disableAdvancedSettings}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg disabled:opacity-50"
                />
                <input
                  type="number"
                  min={MIN_FRAME_RATE}
                  max={MAX_FRAME_RATE}
                  value={frameRate}
                  onChange={(e) => {
                    const value = Math.max(
                      MIN_FRAME_RATE,
                      Math.min(MAX_FRAME_RATE, Number(e.target.value)),
                    );
                    setFrameRate(value);
                  }}
                  disabled={disableAdvancedSettings}
                  className="w-20 bg-[#1f1f1f] border border-gray-600 rounded-lg px-3 py-2.5 text-center appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Note: Model output frame rate may vary and is not directly controllable via the API.
              </p>
            </div>
          </div>
          {/* New Encoding Profile Control */}
          <div className="mt-4">
            <CustomSelect
              label="Encoding Profile"
              value={encodingProfile}
              onChange={(e) => setEncodingProfile(e.target.value as EncodingProfile)}
              icon={<FilmIcon className="w-5 h-5 text-gray-400" />}
              disabled={disableAdvancedSettings}>
              {Object.values(EncodingProfile).map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </CustomSelect>
            <p className="text-xs text-gray-500 mt-2">
              Note: Model output encoding settings may vary and are not directly controllable via the API.
            </p>
          </div>
          {/* New Background Music Control */}
          <div className="mt-4">
            <label className={`text-xs block mb-1.5 font-medium ${disableAdvancedSettings ? 'text-gray-500' : 'text-gray-400'}`}>
              Background Music (Optional)
            </label>
            <AudioUpload
              label="Upload Audio"
              audio={backgroundMusic}
              onSelect={setBackgroundMusic}
              onRemove={() => setBackgroundMusic(null)}
              disabled={disableAdvancedSettings}
            />
            <p className="text-xs text-gray-500 mt-2">
              Note: The current Veo API does not directly support adding background music to generated videos. This audio will be ignored.
            </p>
          </div>
          {/* New Text Overlay Control */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center mb-4">
              <input
                id="text-overlay-toggle"
                type="checkbox"
                checked={textOverlayEnabled}
                onChange={(e) => {
                  setTextOverlayEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setTextOverlay(null); // Clear text overlay data when disabled
                  } else {
                    setTextOverlay({
                      text: textOverlay?.text ?? '',
                      fontSize: textOverlay?.fontSize ?? DEFAULT_FONT_SIZE,
                      color: textOverlay?.color ?? DEFAULT_TEXT_COLOR,
                      position: textOverlay?.position ?? 'bottomCenter',
                    });
                  }
                }}
                disabled={disableAdvancedSettings}
                className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-gray-800 cursor-pointer disabled:opacity-50"
              />
              <label htmlFor="text-overlay-toggle" className={`ml-2 text-sm font-medium ${disableAdvancedSettings ? 'text-gray-500' : 'text-gray-300'} cursor-pointer`}>
                Enable Text Overlay
              </label>
            </div>

            <div className={`space-y-4 ${disableTextOverlayControls ? 'opacity-50' : ''}`}>
              <div>
                <label htmlFor="overlay-text" className={`text-xs block mb-1.5 font-medium ${disableTextOverlayControls ? 'text-gray-500' : 'text-gray-400'}`}>
                  Text Content
                </label>
                <textarea
                  id="overlay-text"
                  value={textOverlay?.text ?? ''}
                  onChange={(e) => setTextOverlay(prev => ({ ...prev!, text: e.target.value }))}
                  disabled={disableTextOverlayControls}
                  placeholder="Enter text for overlay..."
                  rows={2}
                  className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg px-3 py-2.5 text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="font-size" className={`text-xs block mb-1.5 font-medium ${disableTextOverlayControls ? 'text-gray-500' : 'text-gray-400'}`}>
                    Font Size
                  </label>
                  <div className="relative flex items-center gap-3">
                    <input
                      id="font-size"
                      type="range"
                      min={MIN_FONT_SIZE}
                      max={MAX_FONT_SIZE}
                      value={textOverlay?.fontSize ?? DEFAULT_FONT_SIZE}
                      onChange={(e) => setTextOverlay(prev => ({ ...prev!, fontSize: Number(e.target.value) }))}
                      disabled={disableTextOverlayControls}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg disabled:opacity-50"
                    />
                    <input
                      type="number"
                      min={MIN_FONT_SIZE}
                      max={MAX_FONT_SIZE}
                      value={textOverlay?.fontSize ?? DEFAULT_FONT_SIZE}
                      onChange={(e) => {
                        const value = Math.max(
                          MIN_FONT_SIZE,
                          Math.min(MAX_FONT_SIZE, Number(e.target.value)),
                        );
                        setTextOverlay(prev => ({ ...prev!, fontSize: value }));
                      }}
                      disabled={disableTextOverlayControls}
                      className="w-20 bg-[#1f1f1f] border border-gray-600 rounded-lg px-3 py-2.5 text-center appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="text-color" className={`text-xs block mb-1.5 font-medium ${disableTextOverlayControls ? 'text-gray-500' : 'text-gray-400'}`}>
                    Text Color
                  </label>
                  <div className="relative">
                    <input
                      id="text-color"
                      type="color"
                      value={textOverlay?.color ?? DEFAULT_TEXT_COLOR}
                      onChange={(e) => setTextOverlay(prev => ({ ...prev!, color: e.target.value }))}
                      disabled={disableTextOverlayControls}
                      className="w-full h-11 bg-[#1f1f1f] border border-gray-600 rounded-lg px-2 py-1 appearance-none cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
              <CustomSelect
                label="Position"
                value={textOverlay?.position ?? 'bottomCenter'}
                onChange={(e) => setTextOverlay(prev => ({ ...prev!, position: e.target.value as TextOverlay['position'] }))}
                icon={<TextIcon className="w-5 h-5 text-gray-400" />}
                disabled={disableTextOverlayControls}>
                {Object.entries(textOverlayPositionNames).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </CustomSelect>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Note: The current Veo API does not directly support adding text overlays to generated videos. This setting will be ignored.
            </p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full">
        {renderMediaUploads()}
        <div className="flex items-end gap-2 bg-[#1f1f1f] border border-gray-600 rounded-2xl p-2 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500">
          <div className="relative" ref={modeSelectorRef}>
            <button
              type="button"
              onClick={() => setIsModeSelectorOpen((prev) => !prev)}
              className="flex shrink-0 items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              aria-label="Select generation mode">
              {modeIcons[generationMode]}
              <span className="font-medium text-sm whitespace-nowrap">
                {generationMode}
              </span>
            </button>
            {isModeSelectorOpen && (
              <div className="absolute bottom-full mb-2 w-60 bg-[#2c2c2e] border border-gray-600 rounded-lg shadow-xl overflow-hidden z-10">
                {selectableModes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSelectMode(mode)}
                    className={`w-full text-left flex items-center gap-3 p-3 hover:bg-indigo-600/50 ${generationMode === mode ? 'bg-indigo-600/30 text-white' : 'text-gray-300'}`}>
                    {modeIcons[mode]}
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={promptPlaceholder}
            className="flex-grow bg-transparent focus:outline-none resize-none text-base text-gray-200 placeholder-gray-500 max-h-48 py-2"
            rows={1}
          />
          <button
            type="button"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            className={`p-2.5 rounded-full hover:bg-gray-700 ${isSettingsOpen ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
            aria-label="Toggle settings">
            <SlidersHorizontalIcon className="w-5 h-5" />
          </button>
          <div className="relative group">
            <button
              type="submit"
              className="p-2.5 bg-indigo-600 rounded-full hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              aria-label="Generate video"
              disabled={isSubmitDisabled}>
              <ArrowRightIcon className="w-5 h-5 text-white" />
            </button>
            {isSubmitDisabled && tooltipText && (
              <div
                role="tooltip"
                className="absolute bottom-full right-0 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {tooltipText}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2 px-4">
          Veo is a paid-only model. You will be charged on your Cloud project. See{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/pricing#veo-3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            pricing details
          </a>
          .
        </p>
      </form>
    </div>
  );
};

export default PromptForm;