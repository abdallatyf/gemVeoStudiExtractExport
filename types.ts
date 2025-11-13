/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';

export enum AppState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum VeoModel {
  VEO_FAST = 'veo-3.1-fast-generate-preview',
  VEO = 'veo-3.1-generate-preview',
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum Resolution {
  P720 = '720p',
  P1080 = '1080p',
}

export enum GenerationMode {
  TEXT_TO_VIDEO = 'Text to Video',
  FRAMES_TO_VIDEO = 'Frames to Video',
  REFERENCES_TO_VIDEO = 'References to Video',
  EXTEND_VIDEO = 'Extend Video',
}

export enum VideoQuality {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum EncodingProfile {
  STANDARD = 'Standard',
  HIGH_QUALITY = 'High Quality',
}

export enum VideoOutputFormat {
  MP4 = 'MP4',
  // AVI, MOV, etc. could be added here if supported in the future or desired for UI representation
}

export const MIN_VIDEO_DURATION_SECONDS = 1;
export const MAX_VIDEO_DURATION_SECONDS = 15;
export const DEFAULT_VIDEO_DURATION_SECONDS = 5;

export const MIN_FRAME_RATE = 15;
export const MAX_FRAME_RATE = 60;
export const DEFAULT_FRAME_RATE = 30;

export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 72;
export const DEFAULT_FONT_SIZE = 36;
export const DEFAULT_TEXT_COLOR = '#FFFFFF'; // White

export interface ImageFile {
  file: File;
  base64: string;
}

export interface VideoFile {
  file: File;
  base64: string;
}

export interface AudioFile {
  file: File;
  base64: string;
}

export interface TextOverlay {
  text: string;
  fontSize: number;
  color: string;
  position: 'topLeft' | 'topCenter' | 'topRight' | 'midLeft' | 'midCenter' | 'midRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';
}

export interface GenerateVideoParams {
  prompt: string;
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mode: GenerationMode;
  startFrame?: ImageFile | null;
  endFrame?: ImageFile | null;
  referenceImages?: ImageFile[];
  styleImage?: ImageFile | null;
  inputVideo?: VideoFile | null;
  inputVideoObject?: Video | null;
  isLooping?: boolean;
  enableFrameInterpolation?: boolean; // New field for frame interpolation
  videoQuality?: VideoQuality; // New field for user selection
  durationSeconds?: number; // New field for desired video duration
  frameRate?: number; // New field for desired frame rate
  encodingProfile?: EncodingProfile; // New field for desired encoding profile
  backgroundMusic?: AudioFile | null; // New field for background music
  textOverlay?: TextOverlay | null; // New field for text overlay
  outputFormat?: VideoOutputFormat; // New field for desired output video format
}
