'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import PhotoGallery from '@/components/PhotoGallery';
import UploadModal from '@/components/UploadModal';
import { Photo } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { getFCMToken, onMessageListener } from '@/lib/firebase';

const PHOTOS_PER_PAGE = 9;

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(0);

  // Request FCM notification permission on mount
  useEffect(() => {
    const initFCM = async () => {
      try {
        const token = await getFCMToken();
        if (token) {
          console.log('FCM token obtained:', token);
          setNotificationsEnabled(true);

          // Store token in localStorage for reference
          localStorage.setItem('fcm-token', token);

          // Save token to Supabase database
          const userName = localStorage.getItem('peppermint-chat-name') || 'anonymous';
          const { error } = await supabase
            .from('fcm_tokens')
            .upsert({
              token: token,
              user_name: userName,
              device_info: navigator.userAgent,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'token',
            });

          if (error) {
            console.error('Error saving FCM token to database:', error);
          } else {
            console.log('FCM token saved to database');
          }
        }
      } catch (error) {
        console.error('Error initializing FCM:', error);
      }
    };

    initFCM();

    // Listen for foreground messages
    onMessageListener((payload) => {
      console.log('[Homepage] Foreground message received:', payload);
      console.log('[Homepage] Document visible:', document.visibilityState, 'focused:', document.hasFocus());

      // Only show notification if this tab is visible and focused
      // This prevents multiple tabs from showing duplicate notifications
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        if (Notification.permission === 'granted') {
          const title = payload.notification?.title || 'Peppermint Tracker';
          const options = {
            body: payload.notification?.body || 'New update!',
            icon: '/icon-192.png',
            badge: '/icon-96.png',
          };
          console.log('[Homepage] Showing foreground notification:', title);
          new Notification(title, options);
        }
      } else {
        console.log('[Homepage] Tab not visible/focused, skipping foreground notification (service worker will handle it)');
      }

      // Vibrate
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    });
  }, []);

  // Fetch photos from Supabase and subscribe to new uploads
  useEffect(() => {
    fetchPhotos();

    // Subscribe to new photo uploads
    const channel = supabase
      .channel('photos')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
        },
        (payload) => {
          const newPhoto: Photo = {
            id: payload.new.id,
            url: payload.new.url,
            uploaderName: payload.new.uploader_name,
            caption: payload.new.caption,
            videoUrl: payload.new.video_url,
            createdAt: payload.new.created_at,
            address: payload.new.address,
            latitude: payload.new.latitude,
            longitude: payload.new.longitude,
            isSteal: payload.new.is_steal,
          };

          console.log('New photo uploaded:', newPhoto);

          // Add to photos list
          setPhotos((prev) => [newPhoto, ...prev]);

          // Vibrate on mobile
          if ('vibrate' in navigator) {
            navigator.vibrate(200);
          }

          // Show notification
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(`New photo from ${newPhoto.uploaderName}!`, {
              body: newPhoto.caption || 'Check out the latest Peppermint sighting!',
              icon: '/icon-192.png',
              badge: '/icon-96.png',
              tag: 'peppermint-upload',
              requireInteraction: false,
              silent: false,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPhotos = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
      isLoadingRef.current = true;
    } else {
      setIsLoading(true);
      isLoadingRef.current = true;
    }

    const from = pageNum * PHOTOS_PER_PAGE;
    const to = from + PHOTOS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching photos:', error);
    } else {
      const newPhotos = data.map((photo) => ({
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
      }));

      if (append) {
        setPhotos((prev) => [...prev, ...newPhotos]);
      } else {
        setPhotos(newPhotos);
      }

      // Check if there are more photos to load
      const hasMorePhotos = data.length === PHOTOS_PER_PAGE;
      setHasMore(hasMorePhotos);
      hasMoreRef.current = hasMorePhotos;
    }

    if (append) {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    } else {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMoreRef.current) {
      return;
    }

    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    setPage(nextPage);
    fetchPhotos(nextPage, true);
  }, [fetchPhotos]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px' // Trigger loading 200px before reaching the element
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore]);

  const handleUpload = async (data: {
    file: File | null;
    uploaderName: string;
    caption: string;
    isSteal: boolean;
    videoUrl: string;
    address: string;
  }) => {
    let photoUrl = '';

    // Upload image to Supabase Storage if provided
    if (data.file) {
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

      photoUrl = urlData.publicUrl;
    }

    // Geocode address if this is a steal
    let latitude = null;
    let longitude = null;
    let fullAddress = '';
    if (data.isSteal && data.address) {
      // Append city, state, and ZIP to street address
      fullAddress = `${data.address}, West Jordan, UT 84081`;

      try {
        console.log('Geocoding address:', fullAddress);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            fullAddress
          )}&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'PeppermintTracker/1.0'
            }
          }
        );
        const results = await response.json();
        console.log('Geocoding results:', results);
        if (results && results.length > 0) {
          latitude = parseFloat(results[0].lat);
          longitude = parseFloat(results[0].lon);
          console.log('Coordinates:', { latitude, longitude });
        } else {
          console.warn('No geocoding results found for address:', fullAddress);
          alert('Could not find coordinates for this address. Please enter a valid street address in West Jordan.');
          throw new Error('Geocoding failed - no results');
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
        if (error instanceof Error && error.message === 'Geocoding failed - no results') {
          throw error;
        }
        alert('Error looking up address coordinates. Please check your internet connection and try again.');
        throw new Error('Geocoding API error');
      }
    }

    // Insert record into database
    const { error: insertError } = await supabase.from('photos').insert({
      url: photoUrl,
      uploader_name: data.uploaderName,
      caption: data.caption || null,
      is_steal: data.isSteal,
      video_url: data.videoUrl || null,
      address: data.isSteal ? fullAddress : null,
      latitude: latitude,
      longitude: longitude,
    });

    if (insertError) {
      console.error('Error inserting photo:', insertError);
      throw insertError;
    }

    // Refresh photos - reset to first page
    pageRef.current = 0;
    hasMoreRef.current = true;
    setPage(0);
    setHasMore(true);
    fetchPhotos(0, false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <p className="text-white/60 text-xs uppercase tracking-[0.3em] mb-4">
          ✦ A Bloomfield Heights Holiday Heist ✦
        </p>
        <h1 className="text-5xl sm:text-7xl font-light mb-6">
          <span className="text-white">Peppermint</span>{" "}
          <span className="text-[#c41e3a]">the Penguin</span>
        </h1>
        <p className="text-sm italic text-white/70 max-w-md mx-auto mb-8">
          Track the adventures of our wandering inflatable friend
        </p>
        <div className="flex flex-col items-center justify-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white/90 border border-white/20 rounded-full hover:bg-white/10 hover:border-white/30 transition-all"
          >
            <span className="text-base">+</span> Add your Photo
          </button>
          <div className="flex items-center gap-4">
            <Link
              href="/map"
              className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
            >
              Timeline
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
            <Link
              href="/chat"
              className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
            >
              Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="mb-8">
        {isLoading ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-sm">Loading...</p>
          </div>
        ) : (
          <>
            <PhotoGallery photos={photos} />

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="text-center py-8">
                <p className="text-white/40 text-sm">Loading more...</p>
              </div>
            )}

            {/* Sentinel element for infinite scroll */}
            {hasMore && !isLoadingMore && (
              <div ref={observerTarget} className="h-20 w-full" />
            )}

            {/* No more posts indicator */}
            {!hasMore && photos.length > 0 && (
              <div className="text-center py-8">
                <p className="text-white/30 text-sm">No more posts</p>
              </div>
            )}
          </>
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
