import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraIcon, XMarkIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera(); // Ensure any existing stream is stopped first
    setCapturedImage(null);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsStreaming(true);
    } catch (err) {
      console.error("Camera error:", err);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setIsStreaming(true);
      } catch (fallbackErr) {
        console.error("Fallback camera error:", fallbackErr);
        setError("Could not access the camera. Please check your browser permissions.");
        setIsStreaming(false);
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleSnap = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const handleRetake = () => {
    startCamera();
  };

  const handleUsePhoto = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob(blob => {
        onCapture(blob);
        onClose();
      }, 'image/jpeg', 0.9);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Use Camera</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 flex-grow flex items-center justify-center bg-black relative">
          {error ? (
            <div className="text-center text-white p-4">
              <CameraIcon className="h-12 w-12 mx-auto text-red-400" />
              <p className="mt-2">{error}</p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-contain ${capturedImage ? 'hidden' : ''}`}
              />
              {capturedImage && (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>

        <div className="flex justify-center items-center p-4 border-t border-gray-200 dark:border-gray-700">
          {!capturedImage ? (
            <button onClick={handleSnap} disabled={!isStreaming} className="btn btn-primary p-4 rounded-full flex items-center justify-center disabled:opacity-50">
              <CameraIcon className="h-8 w-8" />
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              <button onClick={handleRetake} className="btn btn-secondary flex items-center">
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Retake
              </button>
              <button onClick={handleUsePhoto} className="btn btn-primary flex items-center">
                <CheckIcon className="h-5 w-5 mr-2" />
                Use Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
