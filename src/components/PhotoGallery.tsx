'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Photo } from '@/lib/types';

interface PhotoGalleryProps {
  photos: Photo[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60 text-sm">
          No sightings yet
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="card-christmas overflow-hidden cursor-pointer gallery-image"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="relative aspect-square">
              {photo.url ? (
                <Image
                  src={photo.url}
                  alt={`Peppermint stolen by ${photo.thiefName}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <span className="text-6xl">🎬</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-white/90 text-sm">
                {photo.thiefName}
              </p>
              {photo.caption && (
                <p className="text-white/60 text-xs mt-1">{photo.caption}</p>
              )}
              {photo.videoUrl && (
                <a
                  href={photo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white mt-2"
                >
                  🎬 Watch Video
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="card-christmas max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video">
              {selectedPhoto.url ? (
                <Image
                  src={selectedPhoto.url}
                  alt={`Peppermint stolen by ${selectedPhoto.thiefName}`}
                  fill
                  className="object-contain bg-black"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <span className="text-8xl">🎬</span>
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-light text-white mb-2">
                {selectedPhoto.thiefName}
              </h3>
              {selectedPhoto.caption && (
                <p className="text-white/80 text-sm mb-2">{selectedPhoto.caption}</p>
              )}
              {selectedPhoto.videoUrl && (
                <a
                  href={selectedPhoto.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base text-white/70 hover:text-white mb-2"
                >
                  🎬 Watch Video
                </a>
              )}
              <p className="text-xs text-white/60 mt-4">
                {new Date(selectedPhoto.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="mt-4 px-4 py-2 text-sm text-white/80 border border-white/20 rounded-full hover:bg-white/10 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
