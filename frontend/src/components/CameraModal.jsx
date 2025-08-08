import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraIcon, XMarkIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = useCallback(async () => {
    // Reset state
    setCapturedImage(null);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access the camera. Please check permissions and try again.");
      // Fallback to any camera if environment fails
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null); // Clear previous error if fallback succeeds
      } catch (fallbackErr) {
        console.error("Fallback camera error:", fallbackErr);
        setError("Could not access any camera. Please check permissions.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup on unmount
    return () => stopCamera();
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
      stopCamera(); // Stop camera after snapping
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Use Camera</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 flex-grow flex items-center justify-center bg-black">
          {error ? (
            <div className="text-center text-white">
              <CameraIcon className="h-12 w-12 mx-auto text-red-400" />
              <p className="mt-2">{error}</p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-contain ${capturedImage ? 'hidden' : 'block'}`}
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
            <button onClick={handleSnap} disabled={!stream} className="btn btn-primary p-4 rounded-full flex items-center justify-center">
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
