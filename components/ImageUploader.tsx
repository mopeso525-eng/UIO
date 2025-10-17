import React, { useState, useRef } from 'react';

interface ImageUploaderProps {
  id: string;
  label: string;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  isLoading: boolean;
}

const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10 text-gray-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, previewUrl, onFileSelect, onClear, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    event.target.value = ''; // Reset file input
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, action: 'enter' | 'leave' | 'over' | 'drop') => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) {
      if (isDragging) setIsDragging(false);
      return;
    }

    switch(action) {
      case 'enter':
        setIsDragging(true);
        break;
      case 'leave':
        setIsDragging(false);
        break;
      case 'over':
        // Required to allow drop
        break;
      case 'drop':
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
          onFileSelect(file);
        }
        break;
    }
  };
  
  const handleContainerClick = () => {
    if (!isLoading && !previewUrl) {
      fileInputRef.current?.click();
    }
  };
  
  const handleClearClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClear();
  };

  const borderStyle = isDragging ? 'border-purple-500' : 'border-gray-600';
  const cursorStyle = !isLoading && !previewUrl ? 'cursor-pointer' : 'cursor-default';


  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      <div 
        className={`relative group aspect-square bg-gray-800 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors hover:border-purple-500 ${borderStyle} ${cursorStyle}`}
        onDragEnter={(e) => handleDragEvents(e, 'enter')}
        onDragLeave={(e) => handleDragEvents(e, 'leave')}
        onDragOver={(e) => handleDragEvents(e, 'over')}
        onDrop={(e) => handleDragEvents(e, 'drop')}
        onClick={handleContainerClick}
      >
        {!previewUrl ? (
          <div className="text-center p-2 pointer-events-none">
            <UploadIcon />
            <p className="mt-2 text-sm text-gray-500">{isDragging ? 'أفلت الصورة هنا' : 'انقر للرفع أو أفلت الصورة'}</p>
          </div>
        ) : (
          <>
            <img src={previewUrl} alt="Preview" className="object-cover w-full h-full rounded-lg" />
            <button
              onClick={handleClearClick}
              disabled={isLoading}
              className="absolute top-2 right-2 p-1 bg-gray-800/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-50"
              aria-label="مسح الصورة"
            >
              <XCircleIcon />
            </button>
          </>
        )}
        <input
          id={id}
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default ImageUploader;