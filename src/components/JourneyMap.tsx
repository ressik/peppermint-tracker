'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Photo } from '@/lib/types';

// Red marker for non-current locations
const redIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'red-marker',
});

// Green pin for current location
const greenIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'green-marker',
});

interface JourneyMapProps {
  photos: Photo[];
}

export default function JourneyMap({ photos }: JourneyMapProps) {
  const [mounted, setMounted] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to replay the animation
  const replayAnimation = () => {
    setAnimationProgress(0);
    setAnimationKey((prev) => prev + 1);
  };

  // Filter photos that have coordinates
  const locatedPhotos = photos.filter(
    (photo) => photo.latitude && photo.longitude
  );

  // Sort by creation date to show chronological journey
  const sortedPhotos = [...locatedPhotos].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Smooth animation effect
  useEffect(() => {
    if (!mounted || sortedPhotos.length === 0) return;

    const totalLocations = sortedPhotos.length;
    const animationDuration = 250; // Total animation time in ms per location
    const fps = 60;
    const frameInterval = 1000 / fps;
    const totalFrames = (animationDuration / frameInterval) * totalLocations;
    let frame = 0;

    const animationInterval = setInterval(() => {
      frame++;
      const progress = (frame / totalFrames) * totalLocations;

      if (progress >= totalLocations) {
        setAnimationProgress(totalLocations);
        clearInterval(animationInterval);
      } else {
        setAnimationProgress(progress);
      }
    }, frameInterval);

    return () => clearInterval(animationInterval);
  }, [mounted, sortedPhotos.length, animationKey]);

  // Group photos by location (same lat/lng)
  const locationGroups = new Map<string, { photos: Photo[]; stopNumbers: number[] }>();

  sortedPhotos.forEach((photo, index) => {
    const key = `${photo.latitude},${photo.longitude}`;
    const existing = locationGroups.get(key);

    if (existing) {
      existing.photos.push(photo);
      existing.stopNumbers.push(index + 1);
    } else {
      locationGroups.set(key, {
        photos: [photo],
        stopNumbers: [index + 1],
      });
    }
  });

  // Create unique locations for markers
  const uniqueLocations = Array.from(locationGroups.values());

  // Find current location (most recent steal with coordinates)
  const steals = photos.filter((p) => p.isSteal && p.latitude && p.longitude);
  const currentLocation = steals.length > 0
    ? steals.reduce((latest, photo) =>
        new Date(photo.createdAt) > new Date(latest.createdAt) ? photo : latest
      )
    : null;

  // Calculate visible markers based on animation progress
  const visibleMarkersCount = Math.floor(animationProgress);

  // Create animated path with smooth interpolation
  const animatedPathCoordinates: [number, number][] = [];

  if (sortedPhotos.length > 0) {
    const currentSegment = Math.floor(animationProgress);
    const segmentProgress = animationProgress - currentSegment;

    // Add all completed segments
    for (let i = 0; i <= Math.min(currentSegment, sortedPhotos.length - 1); i++) {
      animatedPathCoordinates.push([sortedPhotos[i].latitude!, sortedPhotos[i].longitude!]);
    }

    // Add interpolated point for current segment
    if (currentSegment < sortedPhotos.length - 1 && segmentProgress > 0) {
      const start = sortedPhotos[currentSegment];
      const end = sortedPhotos[currentSegment + 1];
      const interpolatedLat = start.latitude! + (end.latitude! - start.latitude!) * segmentProgress;
      const interpolatedLng = start.longitude! + (end.longitude! - start.longitude!) * segmentProgress;
      animatedPathCoordinates.push([interpolatedLat, interpolatedLng]);
    }
  }

  // Calculate center of map based on all coordinates
  const centerLat =
    sortedPhotos.reduce((sum, photo) => sum + photo.latitude!, 0) /
    sortedPhotos.length;
  const centerLng =
    sortedPhotos.reduce((sum, photo) => sum + photo.longitude!, 0) /
    sortedPhotos.length;

  if (!mounted) {
    return (
      <div className="w-full h-[600px] bg-white/5 rounded-lg flex items-center justify-center">
        <p className="text-white/60">Loading map...</p>
      </div>
    );
  }

  if (sortedPhotos.length === 0) {
    return (
      <div className="w-full h-[600px] bg-white/5 rounded-lg flex items-center justify-center">
        <p className="text-white/60">No locations to display yet</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden relative">
      {/* Replay Button */}
      <button
        onClick={replayAnimation}
        className="absolute top-4 right-4 z-[1000] px-4 py-2 bg-[#c41e3a] text-white text-sm font-medium rounded-lg shadow-lg hover:bg-[#a01830] transition-all flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
        </svg>
        Replay Animation
      </button>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Draw completed paths at reduced opacity */}
        {sortedPhotos.length > 1 &&
          sortedPhotos.slice(0, -1).map((photo, index) => {
            const nextPhoto = sortedPhotos[index + 1];
            const segmentIndex = index;

            // Only draw fully completed segments (not the one currently being animated)
            if (segmentIndex >= Math.floor(animationProgress)) return null;

            // Check if this is the final path to current location
            const isToCurrentLocation = currentLocation &&
              nextPhoto.latitude === currentLocation.latitude &&
              nextPhoto.longitude === currentLocation.longitude &&
              index === sortedPhotos.length - 2;

            const opacity = isToCurrentLocation ? 1.0 : 0.3;

            return (
              <Polyline
                key={`path-${index}`}
                positions={[
                  [photo.latitude!, photo.longitude!],
                  [nextPhoto.latitude!, nextPhoto.longitude!],
                ]}
                pathOptions={{
                  color: '#c41e3a',
                  weight: 3,
                  opacity: opacity,
                }}
              />
            );
          })
        }

        {/* Draw the currently animating segment with interpolation */}
        {animatedPathCoordinates.length > 1 && (
          <>
            <Polyline
              positions={[
                animatedPathCoordinates[animatedPathCoordinates.length - 2],
                animatedPathCoordinates[animatedPathCoordinates.length - 1],
              ]}
              pathOptions={{
                color: '#c41e3a',
                weight: 3,
                opacity: 1.0,
              }}
            />
            {/* Animated marker at current position (only show while animating) */}
            {animationProgress < sortedPhotos.length && (
              <Marker
                position={animatedPathCoordinates[animatedPathCoordinates.length - 1]}
                icon={L.divIcon({
                  className: 'animated-position-marker',
                  html: '<div style="width: 12px; height: 12px; background-color: #c41e3a; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(196, 30, 58, 0.8);"></div>',
                  iconSize: [12, 12],
                  iconAnchor: [6, 6],
                })}
              />
            )}
          </>
        )}

        {/* Add markers for each unique location (appearing progressively) */}
        {uniqueLocations.map((location, locationIndex) => {
          const firstPhoto = location.photos[0];
          // Show marker only if animation has reached this stop number
          const shouldShow = location.stopNumbers[0] <= visibleMarkersCount + 1;

          if (!shouldShow) return null;

          // Check if this location is the current location
          const isCurrentLocation = currentLocation &&
            firstPhoto.latitude === currentLocation.latitude &&
            firstPhoto.longitude === currentLocation.longitude;

          return (
            <Marker
              key={`${firstPhoto.latitude}-${firstPhoto.longitude}`}
              position={[firstPhoto.latitude!, firstPhoto.longitude!]}
              icon={isCurrentLocation ? redIcon : greenIcon}
            >
              <Popup>
                <div className="text-sm">
                  {location.photos.length > 1 ? (
                    <>
                      <p className="font-semibold mb-2">
                        {location.photos.length} Stops at this location
                      </p>
                      {firstPhoto.address && (
                        <p className="text-xs text-gray-600 mb-3">{firstPhoto.address}</p>
                      )}
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {location.photos.map((photo, idx) => (
                          <div key={photo.id} className="border-b border-gray-200 pb-2 last:border-b-0">
                            <p className="text-xs font-medium text-gray-700">
                              Stop #{location.stopNumbers[idx]}: {photo.uploaderName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(photo.createdAt).toLocaleDateString()}
                            </p>
                            {photo.caption && (
                              <p className="text-xs mt-1 italic text-gray-600">{photo.caption}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold mb-1">
                        Stop #{location.stopNumbers[0]}: {firstPhoto.uploaderName}
                      </p>
                      {firstPhoto.address && (
                        <p className="text-xs text-gray-600 mb-2">{firstPhoto.address}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(firstPhoto.createdAt).toLocaleDateString()}
                      </p>
                      {firstPhoto.caption && (
                        <p className="text-xs mt-1 italic">{firstPhoto.caption}</p>
                      )}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
