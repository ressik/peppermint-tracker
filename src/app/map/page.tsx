'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Photo } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// Dynamically import the map component to avoid SSR issues
const JourneyMap = dynamic(() => import('@/components/JourneyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-white/5 rounded-lg flex items-center justify-center">
      <p className="text-white/60">Loading map...</p>
    </div>
  ),
});

export default function MapPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          caption: photo.caption,
          videoUrl: photo.video_url,
          createdAt: photo.created_at,
          address: photo.address,
          latitude: photo.latitude,
          longitude: photo.longitude,
          isSteal: photo.is_steal,
        }))
      );
    }
    setIsLoading(false);
  };

  const locatedPhotos = photos.filter((p) => p.latitude && p.longitude);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-white/70 text-sm uppercase tracking-widest mb-3">
          Follow the Journey
        </p>
        <h1 className="text-4xl font-light text-white mb-8">
          Peppermint&apos;s Journey
        </h1>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
          >
            Gallery
          </Link>
          <Link
            href="/leaderboard"
            className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
          >
            Leaderboard
          </Link>
          <Link
            href="/rules"
            className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
          >
            Rules
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 text-center">
        <p className="text-white/60 text-sm">
          Tracking {locatedPhotos.length} location{locatedPhotos.length !== 1 ? 's' : ''} across Bloomfield Heights
        </p>
      </div>

      {/* Map */}
      <div className="card-christmas p-6">
        {isLoading ? (
          <div className="w-full h-[600px] flex items-center justify-center">
            <p className="text-white/60">Loading...</p>
          </div>
        ) : (
          <JourneyMap photos={photos} />
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 text-center text-white/60 text-sm">
        <p className="mb-2">🗺️ Click markers to see details about each stop</p>
        <p>The red dashed line shows Peppermint&apos;s journey in chronological order</p>
      </div>

      {/* Journey Timeline */}
      {locatedPhotos.length > 0 && (
        <div className="mt-8 card-christmas p-6">
          <h2 className="text-xl font-light text-white mb-4 text-center">Journey Timeline</h2>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {photos
                .filter((p) => p.latitude && p.longitude)
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((photo, index) => (
                  <div
                    key={photo.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c41e3a] flex items-center justify-center text-white text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm font-medium">{photo.uploaderName}</p>
                      {photo.address && (
                        <p className="text-white/60 text-xs mt-1">{photo.address}</p>
                      )}
                      {photo.caption && (
                        <p className="text-white/70 text-xs mt-1 italic">{photo.caption}</p>
                      )}
                      <p className="text-white/40 text-xs mt-1">
                        {new Date(photo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
