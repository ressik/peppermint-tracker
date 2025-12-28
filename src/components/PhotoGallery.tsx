'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Photo, Comment, PhotoReaction, CommentReaction } from '@/lib/types';
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
  const [reactions, setReactions] = useState<PhotoReaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [showReactionDetailsModal, setShowReactionDetailsModal] = useState<{ emoji: string; users: string[] } | null>(null);
  const [userName, setUserName] = useState('');
  const [commentReactions, setCommentReactions] = useState<CommentReaction[]>([]);
  const [showCommentReactionPicker, setShowCommentReactionPicker] = useState<string | null>(null);
  const [showCommentReactionDetailsModal, setShowCommentReactionDetailsModal] = useState<{ emoji: string; users: string[] } | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(null);

  const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😭'];

  // Helper function to convert URLs in text to clickable links
  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const url = part.startsWith('http') ? part : `https://${part}`;
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

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

  // Load saved commenter name from localStorage when a photo is selected
  useEffect(() => {
    if (selectedPhoto && typeof window !== 'undefined') {
      const savedName = localStorage.getItem('peppermint-commenter-name');
      if (savedName) {
        setCommentName(savedName);
      }
    }
  }, [selectedPhoto]);

  // Load userName from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUserName = localStorage.getItem('peppermint-chat-name');
      if (savedUserName) {
        setUserName(savedUserName);
      }
    }
  }, []);

  // Fetch reactions for all photos
  useEffect(() => {
    if (photos.length > 0) {
      fetchReactions();
      const cleanup = subscribeToReactions();
      return cleanup;
    }
  }, [photos]);

  // Fetch comment reactions
  useEffect(() => {
    if (comments.length > 0) {
      fetchCommentReactions();
      const cleanup = subscribeToCommentReactions();
      return cleanup;
    }
  }, [comments]);

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
      // Create a map of comments for easy lookup
      const commentsMap = new Map(data.map((c) => [c.id, c]));

      setComments(
        data.map((c) => ({
          id: c.id,
          photoId: c.photo_id,
          name: c.name,
          comment: c.comment,
          createdAt: c.created_at,
          replyTo: c.reply_to,
          replyToComment: c.reply_to && commentsMap.get(c.reply_to)
            ? {
                name: commentsMap.get(c.reply_to).name,
                comment: commentsMap.get(c.reply_to).comment,
              }
            : null,
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
      reply_to: replyingToComment?.id || null,
    });

    if (error) {
      console.error('Error submitting comment:', error);
    } else {
      // Save commenter name to localStorage for next time
      if (typeof window !== 'undefined') {
        localStorage.setItem('peppermint-commenter-name', commentName.trim());
      }

      setCommentName('');
      setCommentText('');
      setReplyingToComment(null);
      fetchComments(selectedPhoto.id);
      fetchCommentCounts();
    }
    setSubmitting(false);
  };

  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from('photo_reactions')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching reactions:', error);
    } else {
      setReactions(
        data.map((r) => ({
          id: r.id,
          photoId: r.photo_id,
          userName: r.user_name,
          emoji: r.emoji,
          createdAt: r.created_at,
        }))
      );
    }
  };

  const subscribeToReactions = () => {
    const channel = supabase
      .channel('photo_reactions_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photo_reactions',
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddReaction = async (photoId: string, emoji: string) => {
    let currentUserName = userName;

    if (!currentUserName) {
      const name = prompt('Please enter your name to react:');
      if (!name || !name.trim()) return;
      currentUserName = name.trim();
      setUserName(currentUserName);
      if (typeof window !== 'undefined') {
        localStorage.setItem('peppermint-chat-name', currentUserName);
      }
    }

    const existingReaction = reactions.find(
      (r) => r.photoId === photoId && r.userName === currentUserName && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('photo_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) {
        console.error('Error removing reaction:', error);
      }
    } else {
      // Add reaction
      const { error } = await supabase.from('photo_reactions').insert({
        photo_id: photoId,
        user_name: currentUserName,
        emoji,
      });

      if (error) {
        console.error('Error adding reaction:', error);
      }
    }

    setShowReactionPicker(null);
  };

  const getReactionSummary = (photoId: string) => {
    const photoReactions = reactions.filter((r) => r.photoId === photoId);
    const summary: Record<string, { count: number; users: string[] }> = {};

    photoReactions.forEach((r) => {
      if (!summary[r.emoji]) {
        summary[r.emoji] = { count: 0, users: [] };
      }
      summary[r.emoji].count++;
      summary[r.emoji].users.push(r.userName);
    });

    return summary;
  };

  const fetchCommentReactions = async () => {
    const { data, error } = await supabase
      .from('comment_reactions')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comment reactions:', error);
    } else {
      setCommentReactions(
        data.map((r) => ({
          id: r.id,
          commentId: r.comment_id,
          userName: r.user_name,
          emoji: r.emoji,
          createdAt: r.created_at,
        }))
      );
    }
  };

  const subscribeToCommentReactions = () => {
    const channel = supabase
      .channel('comment_reactions_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_reactions',
        },
        () => {
          fetchCommentReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddCommentReaction = async (commentId: string, emoji: string) => {
    let currentUserName = userName;

    if (!currentUserName) {
      const name = prompt('Please enter your name to react:');
      if (!name || !name.trim()) return;
      currentUserName = name.trim();
      setUserName(currentUserName);
      if (typeof window !== 'undefined') {
        localStorage.setItem('peppermint-chat-name', currentUserName);
      }
    }

    const existingReaction = commentReactions.find(
      (r) => r.commentId === commentId && r.userName === currentUserName && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) {
        console.error('Error removing comment reaction:', error);
      }
    } else {
      // Add reaction
      const { error } = await supabase.from('comment_reactions').insert({
        comment_id: commentId,
        user_name: currentUserName,
        emoji,
      });

      if (error) {
        console.error('Error adding comment reaction:', error);
      }
    }

    setShowCommentReactionPicker(null);
  };

  const getCommentReactionSummary = (commentId: string) => {
    const commentReacts = commentReactions.filter((r) => r.commentId === commentId);
    const summary: Record<string, { count: number; users: string[] }> = {};

    commentReacts.forEach((r) => {
      if (!summary[r.emoji]) {
        summary[r.emoji] = { count: 0, users: [] };
      }
      summary[r.emoji].count++;
      summary[r.emoji].users.push(r.userName);
    });

    return summary;
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

  // Find the current location (most recent steal)
  const steals = photos.filter((p) => p.isSteal);
  const currentLocation = steals.length > 0
    ? steals.reduce((latest, photo) =>
        new Date(photo.createdAt) > new Date(latest.createdAt) ? photo : latest
      )
    : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => {
          const isCurrent = currentLocation?.id === photo.id;
          return (
          <div
            key={photo.id}
            className={`overflow-hidden cursor-pointer gallery-image ${
              isCurrent
                ? 'card-christmas-current'
                : 'card-christmas'
            }`}
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="relative aspect-square overflow-hidden gallery-image-inner transition-transform duration-300 ease-in-out">
              <Image
                src={photo.url || '/penguin-placeholder.jpg'}
                alt={`Peppermint stolen by ${photo.uploaderName}`}
                fill
                className="object-cover"
                unoptimized
              />
              {photo.isSteal && (
                <div className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#ffd700"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              {photo.videoUrl && (
                <a
                  href={photo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                >
                  <div className="w-20 h-20 rounded-full bg-[#0f7c3a] flex items-center justify-center group-hover:bg-[#0d6930] transition-colors">
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
              <div className="flex items-start justify-between gap-2 mt-1">
                {photo.caption && (
                  <p className="text-white/60 text-xs">{photo.caption}</p>
                )}
                <p className="text-white/40 text-xs whitespace-nowrap ml-auto">
                  {new Date(photo.createdAt).toLocaleDateString()} at {new Date(photo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 mt-2">
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
                <div className="flex items-center gap-1">
                  {Object.entries(getReactionSummary(photo.id)).map(([emoji, { count, users }]) => {
                    const userReacted = users.includes(userName);
                    return (
                      <div
                        key={emoji}
                        className={`inline-flex items-center gap-0.5 rounded-full text-sm transition-all ${
                          userReacted
                            ? 'bg-[#c41e3a]/80 text-white'
                            : 'bg-white/10 text-white/80'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddReaction(photo.id, emoji);
                          }}
                          className="px-2 py-1 hover:scale-110 transition-all"
                        >
                          <span className="text-base">{emoji}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReactionDetailsModal({ emoji, users });
                          }}
                          className="px-1.5 py-1 hover:bg-white/10 rounded-r-full transition-all"
                          title="See who reacted"
                        >
                          <span className="text-xs">{count}</span>
                        </button>
                      </div>
                    );
                  })}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowReactionPicker(showReactionPicker === photo.id ? null : photo.id);
                      }}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white/90 transition-all text-sm"
                    >
                      +
                    </button>
                    {showReactionPicker === photo.id && (
                      <div className="absolute bottom-full right-0 mb-2 flex gap-1 bg-white/20 backdrop-blur-sm rounded-full p-1.5 shadow-lg z-10">
                        {AVAILABLE_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddReaction(photo.id, emoji);
                            }}
                            className="w-10 h-10 hover:bg-white/20 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })}
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
              {selectedPhoto.videoUrl && (
                <a
                  href={selectedPhoto.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                >
                  <div className="w-24 h-24 rounded-full bg-[#0f7c3a] flex items-center justify-center group-hover:bg-[#0d6930] transition-colors">
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
              <p className="text-xs text-white/60 mt-4">
                {new Date(selectedPhoto.createdAt).toLocaleDateString()} at {new Date(selectedPhoto.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>

              {/* Reactions Section */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(getReactionSummary(selectedPhoto.id)).map(([emoji, { count, users }]) => {
                    const userReacted = users.includes(userName);
                    return (
                      <div
                        key={emoji}
                        className={`inline-flex items-center gap-0.5 rounded-full text-base transition-all ${
                          userReacted
                            ? 'bg-[#c41e3a]/80 text-white'
                            : 'bg-white/10 text-white/80'
                        }`}
                      >
                        <button
                          onClick={() => handleAddReaction(selectedPhoto.id, emoji)}
                          className="px-3 py-2 hover:scale-110 transition-all"
                        >
                          <span className="text-xl">{emoji}</span>
                        </button>
                        <button
                          onClick={() => setShowReactionDetailsModal({ emoji, users })}
                          className="px-2 py-2 hover:bg-white/10 rounded-r-full transition-all"
                          title="See who reacted"
                        >
                          <span className="text-sm">{count}</span>
                        </button>
                      </div>
                    );
                  })}
                  <div className="relative">
                    <button
                      onClick={() => setShowReactionPicker(showReactionPicker === selectedPhoto.id ? null : selectedPhoto.id)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white/90 transition-all"
                    >
                      <span className="text-xl">+</span>
                    </button>
                    {showReactionPicker === selectedPhoto.id && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 bg-white/20 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                        {AVAILABLE_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleAddReaction(selectedPhoto.id, emoji)}
                            className="w-12 h-12 hover:bg-white/20 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-white/90 mb-3">Comments</h4>

                {commentsLoading ? (
                  <p className="text-white/40 text-xs">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-white/40 text-xs">No comments yet. Be the first!</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {comments.map((c) => {
                      const commentReactionSummary = getCommentReactionSummary(c.id);
                      const hasCommentReactions = Object.keys(commentReactionSummary).length > 0;

                      return (
                        <div key={c.id} className="bg-white/5 rounded-lg p-3 pr-16 relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/90 text-sm font-medium">{c.name}</span>
                            <span className="text-white/40 text-xs">
                              {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Show replied-to comment if exists */}
                          {c.replyToComment && (
                            <div className="bg-black/20 rounded px-2 py-1.5 mb-2 border-l-2 border-white/30">
                              <p className="text-xs opacity-70 font-medium">{c.replyToComment.name}</p>
                              <p className="text-xs opacity-60 line-clamp-1">{linkifyText(c.replyToComment.comment)}</p>
                            </div>
                          )}

                          <p className="text-white/70 text-sm">{linkifyText(c.comment)}</p>

                          {/* Action Buttons */}
                          <div className="absolute bottom-2 right-2 flex items-center gap-1">
                            {/* Reply Button */}
                            <button
                              onClick={() => setReplyingToComment(c)}
                              className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xs transition-all"
                              title="Reply"
                            >
                              ↩
                            </button>
                            {/* Add Reaction Button */}
                            <button
                              onClick={() => setShowCommentReactionPicker(showCommentReactionPicker === c.id ? null : c.id)}
                              className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-sm transition-all"
                              title="Add reaction"
                            >
                              +
                            </button>
                            {/* Reaction Picker */}
                            {showCommentReactionPicker === c.id && (
                              <div className="absolute top-full right-0 mt-2 flex gap-1 bg-white/20 backdrop-blur-sm rounded-full p-1.5 shadow-lg z-50">
                                {AVAILABLE_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddCommentReaction(c.id, emoji);
                                    }}
                                    className="w-10 h-10 hover:bg-white/20 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Display Reactions */}
                          {hasCommentReactions && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(commentReactionSummary).map(([emoji, { count, users }]) => {
                                const userReacted = users.includes(userName);
                                return (
                                  <div
                                    key={emoji}
                                    className={`inline-flex items-center gap-0.5 rounded-full text-sm transition-all ${
                                      userReacted
                                        ? 'bg-[#c41e3a]/80 text-white'
                                        : 'bg-white/10 text-white/80'
                                    }`}
                                  >
                                    <button
                                      onClick={() => handleAddCommentReaction(c.id, emoji)}
                                      className="px-2.5 py-1.5 hover:scale-110 transition-all"
                                    >
                                      <span className="text-base">{emoji}</span>
                                    </button>
                                    <button
                                      onClick={() => setShowCommentReactionDetailsModal({ emoji, users })}
                                      className="px-2 py-1.5 hover:bg-white/10 rounded-r-full transition-all"
                                      title="See who reacted"
                                    >
                                      <span className="text-sm">{count}</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Comment Form */}
                <form onSubmit={handleSubmitComment} className="mt-4 space-y-3">
                  {/* Reply Preview */}
                  {replyingToComment && (
                    <div className="bg-white/10 rounded-lg p-3 border-l-2 border-[#c41e3a] flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-white/70 mb-1">Replying to {replyingToComment.name}</p>
                        <p className="text-sm text-white/60 line-clamp-1">{linkifyText(replyingToComment.comment)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingToComment(null)}
                        className="text-white/60 hover:text-white ml-2"
                        title="Cancel reply"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Your name"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#ffd700]"
                    required
                  />
                  <textarea
                    placeholder={replyingToComment ? `Reply to ${replyingToComment.name}...` : "Leave a comment..."}
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

      {/* Reaction Details Modal */}
      {(showReactionDetailsModal || showCommentReactionDetailsModal) && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowReactionDetailsModal(null);
            setShowCommentReactionDetailsModal(null);
          }}
        >
          <div
            className="bg-[#0f7c3a] rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <span className="text-2xl">
                  {showReactionDetailsModal?.emoji || showCommentReactionDetailsModal?.emoji}
                </span>
                <span>Reactions</span>
              </h3>
              <button
                onClick={() => {
                  setShowReactionDetailsModal(null);
                  setShowCommentReactionDetailsModal(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(showReactionDetailsModal?.users || showCommentReactionDetailsModal?.users || []).map((user, index) => (
                <div
                  key={index}
                  className="bg-white/10 rounded-lg px-4 py-2 text-white/90"
                >
                  {user}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
