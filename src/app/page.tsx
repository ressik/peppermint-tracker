'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PhotoGallery from '@/components/PhotoGallery';
import UploadModal from '@/components/UploadModal';
import { Photo } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch photos from Supabase
  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
    } else {
      setPhotos(
        data.map((photo) => ({
          id: photo.id,
          url: photo.url,
          uploaderName: photo.uploader_name,
          thiefName: photo.thief_name,
          caption: photo.caption,
          createdAt: photo.created_at,
        }))
      );
    }
    setIsLoading(false);
  };

  const handleUpload = async (data: {
    file: File;
    uploaderName: string;
    thiefName: string;
    caption: string;
  }) => {
    // Upload image to Supabase Storage
    const fileExt = data.file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, data.file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    // Insert record into database
    const { error: insertError } = await supabase.from('photos').insert({
      url: urlData.publicUrl,
      uploader_name: data.uploaderName,
      thief_name: data.thiefName,
      caption: data.caption || null,
    });

    if (insertError) {
      console.error('Error inserting photo:', insertError);
      throw insertError;
    }

    // Refresh photos
    fetchPhotos();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <p className="text-white/60 text-xs uppercase tracking-[0.3em] mb-4">
          ✦ A Neighborhood Christmas Tradition ✦
        </p>
        <h1 className="text-5xl sm:text-7xl font-light mb-6">
          <span className="text-white">Peppermint</span>{" "}
          <span className="text-[#c41e3a]">the Penguin</span>
        </h1>
        <p className="text-base text-white/70 max-w-md mx-auto mb-8">
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
            className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
          >
            Leaderboard
          </Link>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="mb-8">
        {isLoading ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-sm">Loading...</p>
          </div>
        ) : (
          <PhotoGallery photos={photos} />
        )}
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
