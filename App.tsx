/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useState} from 'react';
import {CurvedArrowDownIcon, FilmIcon} from './components/icons';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import {generateVideo} from './services/geminiService';
import {
  AppState,
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  Resolution,
  VideoFile,
  VideoQuality,
  DEFAULT_FRAME_RATE,
  EncodingProfile,
} from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(
    null,
  );
  const [lastVideoObject, setLastVideoObject] = useState<Video | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [loadingPhaseMessage, setLoadingPhaseMessage] = useState<string | null>(
    null,
  ); // New state for granular loading messages
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false); // New state for API key selection

  // A single state to hold the initial values for the prompt form
  const [initialFormValues, setInitialFormValues] =
    useState<GenerateVideoParams | null>(null);

  // Effect to check API key status on component mount
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKeySelected(true);
      } else {
        setApiKeySelected(false);
      }
    };
    checkApiKey();
  }, []);

  const showStatusError = (message: string) => {
    setErrorMessage(message);
    setAppState(AppState.ERROR);
    setLoadingPhaseMessage(null); // Clear loading message on error
  };

  const handleSelectApiKey = useCallback(async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success for race condition mitigation as per guidelines
      setApiKeySelected(true);
    }
  }, []);

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    // Check if API key is selected before proceeding with generation
    if (!apiKeySelected && window.aistudio) {
      // This case should ideally be prevented by UI, but as a safeguard
      setLoadingPhaseMessage('Awaiting API key selection...');
      await window.aistudio.openSelectKey();
      setApiKeySelected(true); // Assume success
      // Re-evaluate if we should proceed immediately or let the user try again
      // For now, let's proceed assuming key is selected.
    }

    setAppState(AppState.LOADING);
    setErrorMessage(null);
    setLastConfig(params);
    setLoadingPhaseMessage('Initiating video generation...');
    // Reset initial form values for the next fresh start
    setInitialFormValues(null);

    try {
      const {objectUrl, blob, video} = await generateVideo(params, (message) =>
        setLoadingPhaseMessage(message),
      );
      setVideoUrl(objectUrl);
      setLastVideoBlob(blob);
      setLastVideoObject(video);
      setAppState(AppState.SUCCESS);
      setLoadingPhaseMessage(null); // Clear loading message on success
    } catch (error) {
      console.error('Video generation failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';

      let userFriendlyMessage = `Video generation failed: ${errorMessage}`;
      
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('Requested entity was not found.')) {
          userFriendlyMessage =
            'Model not found. This can be caused by an invalid API key or permission issues. Please check your API key.';
          // CRITICAL: Reset key selection state and prompt user to re-select
          setApiKeySelected(false);
          if (window.aistudio) await window.aistudio.openSelectKey();
        } else if (
          errorMessage.includes('API_KEY_INVALID') ||
          errorMessage.includes('API key not valid') ||
          errorMessage.toLowerCase().includes('permission denied')
        ) {
          userFriendlyMessage =
            'Your API key is invalid or lacks permissions. Please ensure your API key is correctly configured and has billing enabled. ' +
            'See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline">pricing details</a>.';
          // Reset key selection state and prompt user to re-select
          setApiKeySelected(false);
          if (window.aistudio) await window.aistudio.openSelectKey();
        }
      }

      setErrorMessage(userFriendlyMessage);
      setAppState(AppState.ERROR);
      setLoadingPhaseMessage(null); // Clear loading message on error
    }
  }, [apiKeySelected]); // apiKeySelected as a dependency for the callback

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      handleGenerate(lastConfig);
    }
  }, [lastConfig, handleGenerate]);

  const handleNewVideo = useCallback(() => {
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null); // Clear the form state
    setLoadingPhaseMessage(null); // Clear loading message
  }, []);

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      // Preserve last config when trying again from error
      setInitialFormValues(lastConfig);
      setAppState(AppState.IDLE);
      setErrorMessage(null);
      setLoadingPhaseMessage(null); // Clear loading message
    } else {
      // Fallback to a fresh start if there's no last config
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo]);

  const handleExtend = useCallback(async () => {
    if (lastConfig && lastVideoBlob && lastVideoObject) {
      try {
        const file = new File([lastVideoBlob], 'last_video.mp4', {
          type: lastVideoBlob.type,
        });
        const videoFile: VideoFile = {file, base64: ''};

        setInitialFormValues({
          ...lastConfig, // Carry over model, aspect ratio
          mode: GenerationMode.EXTEND_VIDEO,
          prompt: '', // Start with a blank prompt
          inputVideo: videoFile, // for preview in the form
          inputVideoObject: lastVideoObject, // for the API call
          resolution: Resolution.P720, // Extend requires 720p
          videoQuality: VideoQuality.MEDIUM, // Set to Medium as it's 720p
          frameRate: DEFAULT_FRAME_RATE, // Reset frame rate for extend mode
          encodingProfile: EncodingProfile.STANDARD, // Reset encoding profile for extend mode
          backgroundMusic: null, // Reset background music for extend mode
          textOverlay: null, // Reset text overlay for extend mode
          // Reset other media types
          startFrame: null,
          endFrame: null,
          referenceImages: [],
          styleImage: null,
          isLooping: false,
        });

        setAppState(AppState.IDLE);
        setVideoUrl(null);
        setErrorMessage(null);
        setLoadingPhaseMessage(null); // Clear loading message
      } catch (error) {
        console.error('Failed to process video for extension:', error);
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        showStatusError(`Failed to prepare video for extension: ${message}`);
      }
    }
  }, [lastConfig, lastVideoBlob, lastVideoObject]);

  const renderError = (message: string) => (
    <div className="text-center bg-red-900/20 border border-red-500 p-8 rounded-lg">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
      <p className="text-red-300" dangerouslySetInnerHTML={{ __html: message }}></p>
      <button
        onClick={handleTryAgainFromError}
        className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
        Try Again
      </button>
    </div>
  );

  return (
    <div className="h-screen bg-black text-gray-200 flex flex-col font-sans overflow-hidden">
      <header className="py-6 flex justify-center items-center px-8 relative z-10">
        <div className="flex items-center gap-3">
          <FilmIcon className="w-10 h-10 text-indigo-400" />
          <h1 className="text-5xl font-semibold tracking-wide bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Veo Studio
          </h1>
        </div>
      </header>
      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col p-4">
        {appState === AppState.IDLE ? (
          !apiKeySelected && window.aistudio ? ( // Only show if API key is not selected and aistudio is available
            <div className="flex-grow flex items-center justify-center p-8 text-center bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="max-w-md">
                <h2 className="text-3xl font-bold text-indigo-400 mb-4">
                  Select Your Gemini API Key
                </h2>
                <p className="text-gray-300 mb-6">
                  Before you can generate videos, you need to select a Gemini API key.
                  This enables access to the Veo model, which is a paid service.
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Please note: You will be charged for usage on your Google Cloud project.
                  See{' '}
                  <a
                    href="https://ai.google.dev/gemini-api/docs/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline"
                  >
                    pricing details
                  </a>
                  .
                </p>
                <button
                  onClick={handleSelectApiKey}
                  className="px-8 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold"
                >
                  Select API Key
                </button>
              </div>
            </div>
          ) : (
            // Render PromptForm if API key is selected or aistudio is not available (e.g., local dev)
            <>
              <div className="flex-grow flex items-center justify-center">
                <div className="relative text-center">
                  <h2 className="text-3xl text-gray-600">
                    Type in the prompt box to start
                  </h2>
                  <CurvedArrowDownIcon className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-24 h-24 text-gray-700 opacity-60" />
                </div>
              </div>
              <div className="pb-4">
                <PromptForm
                  onGenerate={handleGenerate}
                  initialValues={initialFormValues}
                />
              </div>
            </>
          )
        ) : (
          <div className="flex-grow flex items-center justify-center">
            {appState === AppState.LOADING && (
              <LoadingIndicator phaseMessage={loadingPhaseMessage} />
            )}
            {appState === AppState.SUCCESS && videoUrl && (
              <VideoResult
                videoUrl={videoUrl}
                onRetry={handleRetry}
                onNewVideo={handleNewVideo}
                onExtend={handleExtend}
                canExtend={lastConfig?.resolution === Resolution.P720}
                videoAspectRatio={lastConfig?.aspectRatio ?? AspectRatio.LANDSCAPE}
              />
            )}
            {appState === AppState.SUCCESS &&
              !videoUrl &&
              renderError(
                'Video generated, but URL is missing. Please try again.',
              )}
            {appState === AppState.ERROR &&
              errorMessage &&
              renderError(errorMessage)}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;