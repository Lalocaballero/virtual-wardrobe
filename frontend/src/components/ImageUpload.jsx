import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ImageUpload = ({ onImageUploaded, currentImage = null, className = '' }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Original file size must be less than 10MB before compression.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setError(null);
    setUploading(true);
    const originalPreviewUrl = URL.createObjectURL(file);
    setPreview(originalPreviewUrl);

    try {
      const compressedFile = await compressImage(file, 0.7, 1280, 720);
      if (compressedFile.size > 5 * 1024 * 1024) {
        setError('Compressed file size is still too large (max 5MB).');
        setUploading(false);
        setPreview(currentImage);
        return;
      }

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
      setError(err.message || 'An unknown error occurred during upload.');
      setPreview(currentImage);
    } finally {
      setUploading(false);
      if (originalPreviewUrl && originalPreviewUrl !== preview) {
        URL.revokeObjectURL(originalPreviewUrl);
      }
    }
  }, [onImageUploaded, currentImage, API_BASE, compressImage, preview]);

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

  return (
    <div className={`space-y-2 ${className}`}>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span className="text-sm">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50 dark:border-indigo-400' 
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <div className="mt-2">
            {isDragActive ? (
              <p className="text-sm text-indigo-600 dark:text-indigo-400">Drop the image here...</p>
            ) : (
              <div>
                <p className="text-sm">
                  Drag & drop an image here, or click to select
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, GIF up to 5MB (will be compressed)
                </p>
              </div>
            )}
          </div>
          {uploading && (
            <div className="mt-2 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-sm">Uploading...</span>
            </div>
          )}
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