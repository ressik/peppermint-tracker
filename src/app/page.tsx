'use client';

import { useState } from 'react';
import Link from 'next/link';
import PhotoGallery from '@/components/PhotoGallery';
import UploadModal from '@/components/UploadModal';
import { Photo } from '@/lib/types';

// Mock data for development - will be replaced with Supabase
const mockPhotos: Photo[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=400&h=400&fit=crop',
    uploaderName: 'Santa',
    thiefName: 'The Johnsons',
    caption: 'Found Peppermint enjoying the snow!',
    createdAt: '2024-12-15T10:00:00Z',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1551986782-d0169b3f8fa7?w=400&h=400&fit=crop',
    uploaderName: 'Rudolph',
    thiefName: 'The Smiths',
    caption: 'Peppermint was caught waddling around!',
    createdAt: '2024-12-16T14:30:00Z',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1462888210965-cdf193fb74de?w=400&h=400&fit=crop',
    uploaderName: 'Frosty',
    thiefName: 'The Garcias',
    createdAt: '2024-12-17T09:15:00Z',
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1517783999520-f068d7431571?w=400&h=400&fit=crop',
    uploaderName: 'Snowflake',
    thiefName: 'The Wilsons',
    caption: 'Peppermint looking festive!',
    createdAt: '2024-12-18T08:00:00Z',
  },
];

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>(mockPhotos);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleUpload = async (data: {
    file: File;
    uploaderName: string;
    thiefName: string;
    caption: string;
  }) => {
    // For now, create a local URL for the uploaded image
    // This will be replaced with Supabase storage upload
    const url = URL.createObjectURL(data.file);

    const newPhoto: Photo = {
      id: Date.now().toString(),
      url,
      uploaderName: data.uploaderName,
      thiefName: data.thiefName,
      caption: data.caption || undefined,
      createdAt: new Date().toISOString(),
    };

    setPhotos([newPhoto, ...photos]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-4">
          ✦ A Neighborhood Christmas Tradition ✦
        </p>
        <h1 className="text-5xl sm:text-7xl font-light mb-6">
          <span className="text-white">Peppermint</span>{" "}
          <span className="text-[#c41e3a]">the Penguin</span>
        </h1>
        <p className="text-base text-white/50 max-w-md mx-auto mb-8">
          Track the adventures of our wandering inflatable friend
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white/90 border border-white/20 rounded-full hover:bg-white/10 hover:border-white/30 transition-all"
          >
            <span className="text-base">+</span> Add your Photo
          </button>
          <Link
            href="/leaderboard"
            className="px-5 py-2 text-sm font-medium text-white/50 hover:text-white/80 transition-all"
          >
            Leaderboard
          </Link>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="mb-8">
        <PhotoGallery photos={photos} />
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
