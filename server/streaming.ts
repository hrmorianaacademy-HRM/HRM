import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const HLS_DIR = '/tmp/hls-segments';
const PLAYLIST_NAME = 'stream.m3u8';
const SEGMENT_PREFIX = 'segment';

interface StreamingConfig {
  multicastUrl: string;
  segmentDuration: number;
  maxSegments: number;
}

class HLSStreamer {
  private ffmpegProcess: ChildProcess | null = null;
  private config: StreamingConfig;
  private isRunning = false;

  constructor(config: Partial<StreamingConfig> = {}) {
    this.config = {
      multicastUrl: config.multicastUrl || 'udp://239.255.42.42:36666',
      segmentDuration: config.segmentDuration || 2,
      maxSegments: config.maxSegments || 5,
    };

    // Ensure HLS directory exists
    if (!fs.existsSync(HLS_DIR)) {
      fs.mkdirSync(HLS_DIR, { recursive: true });
    }
  }

  start(streamUrl?: string): boolean {
    if (this.isRunning) {
      console.log('Streaming already running');
      return false;
    }

    if (streamUrl) {
      this.config.multicastUrl = streamUrl;
    }

    console.log(`Starting HLS stream from: ${this.config.multicastUrl}`);

    try {
      const outputPath = path.join(HLS_DIR, PLAYLIST_NAME);
      
      // Detect stream type and build appropriate FFmpeg command
      let ffmpegArgs: string[] = [];
      const streamUrl = this.config.multicastUrl.trim();

      if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
        // HTTP stream (MJPEG or other formats)
        console.log('Detected HTTP stream, attempting to convert...');
        ffmpegArgs = [
          '-protocol_whitelist', 'file,http,https,rtp',
          '-i', streamUrl,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-b:v', '500k',
          '-vf', 'scale=-1:720',
          '-f', 'hls',
          '-hls_time', String(this.config.segmentDuration),
          '-hls_list_size', String(this.config.maxSegments),
          '-hls_flags', 'independent_segments',
          '-start_number', '0',
          outputPath,
        ];
      } else if (streamUrl.startsWith('udp://') || streamUrl.startsWith('rtp://')) {
        // Multicast/RTP stream
        console.log('Detected UDP/RTP multicast stream...');
        ffmpegArgs = [
          '-protocol_whitelist', 'file,udp,rtp',
          '-i', streamUrl,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-b:v', '1000k',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-f', 'hls',
          '-hls_time', String(this.config.segmentDuration),
          '-hls_list_size', String(this.config.maxSegments),
          '-hls_flags', 'independent_segments',
          '-start_number', '0',
          outputPath,
        ];
      } else if (streamUrl.startsWith('rtsp://')) {
        // RTSP stream
        console.log('Detected RTSP stream...');
        ffmpegArgs = [
          '-protocol_whitelist', 'file,rtsp,rtp',
          '-rtsp_transport', 'tcp',
          '-i', streamUrl,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-b:v', '1000k',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-f', 'hls',
          '-hls_time', String(this.config.segmentDuration),
          '-hls_list_size', String(this.config.maxSegments),
          '-hls_flags', 'independent_segments',
          '-start_number', '0',
          outputPath,
        ];
      } else {
        console.error(`Unknown stream format: ${streamUrl}`);
        console.error('Supported formats: udp://IP:PORT, rtsp://IP:PORT/stream, http://IP:PORT/stream, https://IP:PORT/stream');
        return false;
      }

      this.ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let errorOutput = '';
      
      // Log stderr (FFmpeg info/errors)
      this.ffmpegProcess.stderr?.on('data', (data) => {
        const message = data.toString();
        errorOutput += message;
        
        if (message.includes('error') || message.includes('Error') || message.includes('Connection refused')) {
          console.error(`FFmpeg: ${message.trim()}`);
        } else if (message.includes('frame=')) {
          // Frame counter - stream is working
          console.log(`FFmpeg: Processing frames...`);
        }
      });

      this.ffmpegProcess.on('error', (error) => {
        console.error('FFmpeg process error:', error);
        this.isRunning = false;
      });

      this.ffmpegProcess.on('exit', (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
        if (code !== 0 && errorOutput) {
          console.error('FFmpeg output:', errorOutput.slice(0, 500));
        }
        this.isRunning = false;
      });

      this.isRunning = true;
      console.log('✓ HLS streaming started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start HLS streaming:', error);
      this.isRunning = false;
      return false;
    }
  }

  stop(): void {
    if (this.ffmpegProcess) {
      console.log('Stopping HLS stream...');
      this.ffmpegProcess.kill('SIGTERM');
      this.ffmpegProcess = null;
      this.isRunning = false;
    }
  }

  isStreamRunning(): boolean {
    return this.isRunning;
  }

  getPlaylistPath(): string {
    return path.join(HLS_DIR, PLAYLIST_NAME);
  }

  getPlaylistUrl(): string {
    return '/hls/stream.m3u8';
  }

  getHLSDirectory(): string {
    return HLS_DIR;
  }

  updateMulticastUrl(url: string): void {
    this.config.multicastUrl = url;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  getConfig(): StreamingConfig {
    return { ...this.config };
  }
}

export const hlsStreamer = new HLSStreamer();
