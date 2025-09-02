import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import CameraModal from './CameraModal';
import { API_BASE } from '../store/wardrobeStore';

const ImageUpload = ({ onImageUploaded, currentImage = null, className = '' }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [error, setError] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const compressImage = useCallback((imageFile, quality = 0.8, maxWidth = 1024, maxHeight = 1024) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], imageFile.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Canvas toBlob failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = (e) => reject(new Error('Image loading failed'));
      };
      reader.onerror = (e) => reject(new Error('FileReader failed'));
    });
  }, []);

  const handleUpload = useCallback(async (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Original file size must be less than 10MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    setError(null);
    setUploading(true);
    const originalPreviewUrl = URL.createObjectURL(file);
    setPreview(originalPreviewUrl);

    try {
      const compressedFile = await compressImage(file, 0.7, 1280, 720);
      
      const formData = new FormData();
      formData.append('file', compressedFile);

      const response = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setPreview(data.image_url);
      if (onImageUploaded) {
        onImageUploaded(data.image_url);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'An unknown error occurred.');
      setPreview(currentImage);
    } finally {
      setUploading(false);
      if (originalPreviewUrl && originalPreviewUrl !== preview) {
        URL.revokeObjectURL(originalPreviewUrl);
      }
    }
  }, [onImageUploaded, currentImage, compressImage, preview]);

  const onDrop = useCallback((acceptedFiles) => {
    handleUpload(acceptedFiles[0]);
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    multiple: false,
    disabled: uploading
  });

  const removeImage = () => {
    setPreview(null);
    setError(null);
    if (onImageUploaded) {
      onImageUploaded('');
    }
  };

  const handleCapture = useCallback((imageBlob) => {
    const capturedFile = new File([imageBlob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    handleUpload(capturedFile);
  }, [handleUpload]);

  return (
    <div className={`space-y-2 ${className}`}>
      <CameraModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
      />
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-fog dark:border-inkwell"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            aria-label="Remove image"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle px-4 py-2 rounded-lg flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span className="text-sm">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors flex-grow flex flex-col items-center justify-center
              ${isDragActive 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50 dark:border-indigo-400' 
                : 'border-fog hover:border-gray-400 dark:border-inkwell dark:hover:border-gray-500'
              }
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <PhotoIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-slate" />
            <p className="mt-2 text-sm">Drag & drop or click to upload</p>
            <p className="text-xs text-slate dark:text-dark-text-secondary mt-1">Max 10MB</p>
          </div>
          <div className="flex items-center">
            <div className="flex-grow border-t border-fog dark:border-inkwell"></div>
            <span className="flex-shrink mx-2 text-xs text-gray-400 dark:text-slate">OR</span>
            <div className="flex-grow border-t border-fog dark:border-inkwell"></div>
          </div>
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            disabled={uploading}
            className="w-full btn btn-secondary flex items-center justify-center"
          >
            <CameraIcon className="h-5 w-5 mr-2" />
            Use Camera
          </button>
        </div>
      )}
      
      {error && (
        <div className="text-red-700 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-500/50 rounded-lg p-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;