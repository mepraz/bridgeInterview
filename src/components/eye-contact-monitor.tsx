'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface EyeContactMonitorProps {
  videoElement: HTMLVideoElement;
}

const DEVIATION_THRESHOLD = 25; // Lower is more sensitive
const CHECK_INTERVAL = 1500; // Milliseconds

const EyeContactMonitor: React.FC<EyeContactMonitorProps> = ({ videoElement }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baselineImageData = useRef<ImageData | null>(null);
  const lastWarningTime = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!videoElement) return;

    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) return;
    
    let frameId: number;
    let baselineCaptured = false;

    const captureBaseline = () => {
      if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA
        canvas.width = videoElement.videoWidth / 10;
        canvas.height = videoElement.videoHeight / 10;
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        baselineImageData.current = context.getImageData(0, 0, canvas.width, canvas.height);
        baselineCaptured = true;
      }
    };

    const compareFrames = () => {
      if (!baselineImageData.current || videoElement.paused || videoElement.ended) {
        return;
      }

      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const currentImageData = context.getImageData(0, 0, canvas.width, canvas.height);

      let diff = 0;
      for (let i = 0; i < currentImageData.data.length; i += 4) {
        diff += Math.abs(currentImageData.data[i] - baselineImageData.current.data[i]);
      }
      
      const avgDiff = diff / (currentImageData.data.length / 4);

      if (avgDiff > DEVIATION_THRESHOLD) {
        const now = Date.now();
        if (now - lastWarningTime.current > 5000) { // Only warn every 5 seconds
          lastWarningTime.current = now;
          toast({
            variant: 'destructive',
            title: 'Please Maintain Eye Contact',
            description: 'Try to focus on the screen while answering.',
            duration: 3000,
          });
        }
      }
    };

    const monitorLoop = () => {
        if (!baselineCaptured) {
            captureBaseline();
        } else {
            compareFrames();
        }
        frameId = window.setTimeout(monitorLoop, CHECK_INTERVAL);
    };

    // Delay starting the monitor to give user time to settle
    const startTimeout = setTimeout(() => {
        monitorLoop();
    }, 2000);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(frameId);
    };
  }, [videoElement, toast]);

  return null; // This component does not render anything
};

export default EyeContactMonitor;
