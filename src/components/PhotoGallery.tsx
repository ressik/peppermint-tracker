'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Photo, Comment } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface PhotoGalleryProps {
  photos: Photo[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch comment counts for all photos on mount
  useEffect(() => {
    fetchCommentCounts();
  }, [photos]);

  // Fetch comments when a photo is selected
  useEffect(() => {
    if (selectedPhoto) {
      fetchComments(selectedPhoto.id);
    } else {
      setComments([]);
    }
  }, [selectedPhoto]);

  const fetchCommentCounts = async () => {
    if (photos.length === 0) return;

    const { data, error } = await supabase
      .from('comments')
      .select('photo_id');

    if (error) {
      console.error('Error fetching comment counts:', error);
      return;
    }

    const counts: Record<string, number> = {};
    data.forEach((row) => {
      counts[row.photo_id] = (counts[row.photo_id] || 0) + 1;
    });
    setCommentCounts(counts);
  };

  const fetchComments = async (photoId: string) => {
    setCommentsLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(
        data.map((c) => ({
          id: c.id,
          photoId: c.photo_id,
          name: c.name,
          comment: c.comment,
          createdAt: c.created_at,
        }))
      );
    }
    setCommentsLoading(false);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhoto || !commentName.trim() || !commentText.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      photo_id: selectedPhoto.id,
      name: commentName.trim(),
      comment: commentText.trim(),
    });

    if (error) {
      console.error('Error submitting comment:', error);
    } else {
      setCommentName('');
      setCommentText('');
      fetchComments(selectedPhoto.id);
      fetchCommentCounts();
    }
    setSubmitting(false);
  };

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
              <Image
                src={photo.url || '/penguin-placeholder.jpg'}
                alt={`Peppermint stolen by ${photo.uploaderName}`}
                fill
                className="object-cover"
                unoptimized
              />
              {!photo.url && photo.videoUrl && (
                <a
                  href={photo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                >
                  <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center group-hover:bg-red-700 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-10 h-10 ml-1"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </a>
              )}
            </div>
            <div className="p-4">
              <p className="text-white/90 text-sm">
                {photo.uploaderName}
              </p>
              {photo.caption && (
                <p className="text-white/60 text-xs mt-1">{photo.caption}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {photo.videoUrl && (
                  <a
                    href={photo.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xl text-white/70 hover:text-white"
                  >
                    🎬 Watch Video
                  </a>
                )}
                <span className="inline-flex items-center gap-1 text-white/50 text-xs">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {commentCounts[photo.id] || 0}
                </span>
              </div>
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
              <Image
                src={selectedPhoto.url || '/penguin-placeholder.jpg'}
                alt={`Peppermint stolen by ${selectedPhoto.uploaderName}`}
                fill
                className="object-contain bg-black"
                unoptimized
              />
              {!selectedPhoto.url && selectedPhoto.videoUrl && (
                <a
                  href={selectedPhoto.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                >
                  <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center group-hover:bg-red-700 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-12 h-12 ml-1"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </a>
              )}
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <h3 className="text-xl font-light text-white mb-2">
                {selectedPhoto.uploaderName}
              </h3>
              {selectedPhoto.caption && (
                <p className="text-white/80 text-sm mb-2">{selectedPhoto.caption}</p>
              )}
              {selectedPhoto.videoUrl && (
                <a
                  href={selectedPhoto.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-lg text-white/70 hover:text-white mb-2"
                >
                  🎬 Watch Video
                </a>
              )}
              <p className="text-xs text-white/60 mt-4">
                {new Date(selectedPhoto.createdAt).toLocaleDateString()}
              </p>

              {/* Comments Section */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-white/90 mb-3">Comments</h4>

                {commentsLoading ? (
                  <p className="text-white/40 text-xs">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-white/40 text-xs">No comments yet. Be the first!</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {comments.map((c) => (
                      <div key={c.id} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white/90 text-sm font-medium">{c.name}</span>
                          <span className="text-white/40 text-xs">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Form */}
                <form onSubmit={handleSubmitComment} className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#ffd700]"
                    required
                  />
                  <textarea
                    placeholder="Leave a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#ffd700] resize-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitting || !commentName.trim() || !commentText.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#c41e3a] rounded-full hover:bg-[#a31830] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              </div>

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
