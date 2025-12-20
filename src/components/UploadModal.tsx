'use client';

import { useState, useRef } from 'react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: {
    file: File | null;
    uploaderName: string;
    caption: string;
    isSteal: boolean;
    videoUrl: string;
  }) => Promise<void>;
}

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [uploaderName, setUploaderName] = useState('');
  const [caption, setCaption] = useState('');
  const [isSteal, setIsSteal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!file && !videoUrl) || !uploaderName) return;

    setIsUploading(true);
    try {
      await onUpload({
        file,
        uploaderName,
        caption,
        isSteal,
        videoUrl,
      });
      // Reset form
      setUploaderName('');
      setCaption('');
      setIsSteal(false);
      setVideoUrl('');
      setFile(null);
      setPreview(null);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetAndClose = () => {
    setUploaderName('');
    setCaption('');
    setIsSteal(false);
    setVideoUrl('');
    setFile(null);
    setPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={resetAndClose}
    >
      <div
        className="w-full max-w-md p-6 bg-[#1a2744]/95 backdrop-blur-sm border border-white/20 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-white">
            Add a Sighting
          </h2>
          <button
            onClick={resetAndClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div
            className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center cursor-pointer hover:border-white/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg"
              />
            ) : (
              <div>
                <div className="text-4xl mb-2">📸</div>
                <p className="text-white/40">Click to upload a photo</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Video URL (optional)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ffd700]"
              placeholder="YouTube, Ring.com, or Google Drive link"
            />
            <p className="text-xs text-white/40 mt-1">
              Upload a photo, add a video link, or both!
            </p>
          </div>

          {/* Your Name */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Family Last Name *
            </label>
            <input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ffd700]"
              placeholder="Family last name"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Caption (optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ffd700] resize-none"
              placeholder="Any fun details about the heist?"
            />
          </div>

          {/* Count as Steal Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isSteal}
              onChange={(e) => setIsSteal(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#c41e3a] focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-sm text-white/80">Count as a steal on the leaderboard</span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={(!file && !videoUrl) || !uploaderName || isUploading}
            className="w-full py-3 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
