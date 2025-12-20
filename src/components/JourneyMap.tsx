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
  const [visibleMarkersCount, setVisibleMarkersCount] = useState(0);
  const [animatedPathLength, setAnimatedPathLength] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to replay the animation
  const replayAnimation = () => {
    setVisibleMarkersCount(0);
    setAnimatedPathLength(0);
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

  // Group photos by location first (to know how many unique locations we have)
  const locationGroupsForAnimation = new Map<string, Photo[]>();
  sortedPhotos.forEach((photo) => {
    const key = `${photo.latitude},${photo.longitude}`;
    const existing = locationGroupsForAnimation.get(key);
    if (existing) {
      existing.push(photo);
    } else {
      locationGroupsForAnimation.set(key, [photo]);
    }
  });
  const uniqueLocationCount = locationGroupsForAnimation.size;

  // Animate markers appearing one by one
  useEffect(() => {
    if (!mounted || sortedPhotos.length === 0) return;

    const markerInterval = setInterval(() => {
      setVisibleMarkersCount((prev) => {
        if (prev >= sortedPhotos.length) {
          clearInterval(markerInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 400); // Add a new marker every 400ms

    return () => clearInterval(markerInterval);
  }, [mounted, sortedPhotos.length, animationKey]);

  // Animate path drawing progressively
  useEffect(() => {
    if (!mounted || sortedPhotos.length === 0) return;

    const totalSegments = sortedPhotos.length - 1;
    const animationDuration = 400; // ms per segment

    const pathInterval = setInterval(() => {
      setAnimatedPathLength((prev) => {
        if (prev >= totalSegments) {
          clearInterval(pathInterval);
          return prev;
        }
        return prev + 1;
      });
    }, animationDuration);

    return () => clearInterval(pathInterval);
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

  // Create path coordinates for the journey line (animated)
  const animatedPathCoordinates: [number, number][] = sortedPhotos
    .slice(0, Math.min(animatedPathLength + 1, sortedPhotos.length))
    .map((photo) => [photo.latitude!, photo.longitude!]);

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

        {/* Draw the animated journey path */}
        {animatedPathCoordinates.length > 1 &&
          animatedPathCoordinates.slice(0, -1).map((coord, index) => {
            const nextCoord = animatedPathCoordinates[index + 1];
            const totalSegments = animatedPathCoordinates.length - 1;
            // All paths at 30% opacity except the final path to current location at 100%
            const isFinalPath = index === totalSegments - 1;
            const opacity = isFinalPath ? 1.0 : 0.3;

            return (
              <Polyline
                key={`path-${index}`}
                positions={[coord, nextCoord]}
                pathOptions={{
                  color: '#c41e3a',
                  weight: 3,
                  opacity: opacity,
                }}
              />
            );
          })
        }

        {/* Add markers for each unique location (appearing progressively) */}
        {uniqueLocations.map((location, locationIndex) => {
          const firstPhoto = location.photos[0];
          const shouldShow = location.stopNumbers[0] <= visibleMarkersCount;

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
