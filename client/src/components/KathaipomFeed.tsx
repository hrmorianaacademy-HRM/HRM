import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, ThumbsDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

export function KathaipomFeed({ isHorizontal = false }: { isHorizontal?: boolean }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [commentTexts, setCommentTexts] = useState<{ [key: number]: string }>({});
    const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());

    // Fetch posts
    const { data: posts, isLoading } = useQuery({
        queryKey: ["/api/kathaipom/posts"],
        queryFn: async () => {
            const res = await fetch("/api/kathaipom/posts", { credentials: "include" });
            if (!res.ok) return [];
            return res.json();
        },
        refetchInterval: 10000,
    });

    // Like post mutation
    const likePostMutation = useMutation({
        mutationFn: async (postId: number) => {
            const res = await fetch(`/api/kathaipom/posts/${postId}/like`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to like post");
            return res.json();
        },
        onMutate: async (postId) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ["/api/kathaipom/posts"] });

            // Snapshot the previous value
            const previousPosts = queryClient.getQueryData(["/api/kathaipom/posts"]);

            // Optimistically update to the new value
            queryClient.setQueryData(["/api/kathaipom/posts"], (old: any) => {
                if (!old) return old;
                return old.map((post: any) => {
                    if (post.id === postId) {
                        const newHasLiked = !post.user_has_liked;
                        return {
                            ...post,
                            user_has_liked: newHasLiked,
                            like_count: newHasLiked
                                ? (post.like_count || 0) + 1
                                : Math.max(0, (post.like_count || 0) - 1)
                        };
                    }
                    return post;
                });
            });

            // Return a context object with the snapshotted value
            return { previousPosts };
        },
        onError: (err, postId, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousPosts) {
                queryClient.setQueryData(["/api/kathaipom/posts"], context.previousPosts);
            }
            toast({
                title: "Error",
                description: "Failed to update like. Please try again.",
                variant: "destructive"
            });
        },
        onSettled: () => {
            // Always refetch after error or success to keep server state in sync
            queryClient.invalidateQueries({ queryKey: ["/api/kathaipom/posts"] });
        },
    });

    // Dislike post mutation
    const dislikePostMutation = useMutation({
        mutationFn: async (postId: number) => {
            const res = await fetch(`/api/kathaipom/posts/${postId}/dislike`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to dislike post");
            return res.json();
        },
        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: ["/api/kathaipom/posts"] });
            const previousPosts = queryClient.getQueryData(["/api/kathaipom/posts"]);

            queryClient.setQueryData(["/api/kathaipom/posts"], (old: any) => {
                if (!old) return old;
                return old.map((post: any) => {
                    if (post.id === postId) {
                        const newHasDisliked = !post.user_has_disliked;
                        const wasLiked = post.user_has_liked;
                        return {
                            ...post,
                            user_has_disliked: newHasDisliked,
                            dislike_count: newHasDisliked
                                ? (post.dislike_count || 0) + 1
                                : Math.max(0, (post.dislike_count || 0) - 1),
                            // Mutually exclusive
                            user_has_liked: newHasDisliked ? false : post.user_has_liked,
                            like_count: newHasDisliked && wasLiked
                                ? Math.max(0, (post.like_count || 0) - 1)
                                : post.like_count
                        };
                    }
                    return post;
                });
            });
            return { previousPosts };
        },
        onError: (err, postId, context) => {
            if (context?.previousPosts) {
                queryClient.setQueryData(["/api/kathaipom/posts"], context.previousPosts);
            }
            toast({
                title: "Error",
                description: "Failed to update dislike. Please try again.",
                variant: "destructive"
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/kathaipom/posts"] });
        },
    });

    // Add comment mutation
    const addCommentMutation = useMutation({
        mutationFn: async ({ postId, comment_text }: { postId: number; comment_text: string }) => {
            const res = await fetch(`/api/kathaipom/posts/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment_text }),
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to add comment");
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["/api/kathaipom/posts"] });
            queryClient.invalidateQueries({ queryKey: [`/api/kathaipom/posts/${variables.postId}/comments`] });
            setCommentTexts((prev) => ({ ...prev, [variables.postId]: "" }));
        },
    });

    // Fetch comments for a post
    const usePostComments = (postId: number) => {
        return useQuery({
            queryKey: [`/api/kathaipom/posts/${postId}/comments`],
            queryFn: async () => {
                const res = await fetch(`/api/kathaipom/posts/${postId}/comments`, {
                    credentials: "include",
                });
                if (!res.ok) return [];
                return res.json();
            },
            enabled: expandedPosts.has(postId),
        });
    };

    const getUserInitials = (name: string) => {
        if (!name || name === "Manager") return "M";
        const parts = name.split(" ");
        return parts.length > 1
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : name[0].toUpperCase();
    };

    const toggleComments = (postId: number) => {
        setExpandedPosts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-3 bg-black/5">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading feed...</p>
            </div>
        );
    }

    if (!posts || posts.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-black/5 text-center px-6">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No posts yet</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">
                    Check back soon to see updates from your team.
                </p>
            </div>
        );
    }

    return (
        <div className={`h-full ${isHorizontal ? 'flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-1 pt-1 pb-1' : 'overflow-y-auto snap-y snap-mandatory custom-scrollbar-hide'} bg-zinc-950`}>
            {posts.slice(0, 50).map((post: any) => (
                <PostCard
                    key={post.id}
                    post={post}
                    getUserInitials={getUserInitials}
                    toggleComments={toggleComments}
                    expandedPosts={expandedPosts}
                    likePostMutation={likePostMutation}
                    dislikePostMutation={dislikePostMutation}
                    addCommentMutation={addCommentMutation}
                    commentTexts={commentTexts}
                    setCommentTexts={setCommentTexts}
                    usePostComments={usePostComments}
                    user={user}
                    isHorizontal={isHorizontal}
                />
            ))}
        </div>
    );
}

function PostCard({
    post,
    getUserInitials,
    toggleComments,
    expandedPosts,
    likePostMutation,
    dislikePostMutation,
    addCommentMutation,
    commentTexts,
    setCommentTexts,
    usePostComments,
    user,
    isHorizontal
}: any) {
    const { data: comments } = usePostComments(post.id);
    const showComments = expandedPosts.has(post.id);
    const lastTap = useRef<number>(0);
    const [showHeartAnim, setShowHeartAnim] = useState(false);
    const [showBreakAnim, setShowBreakAnim] = useState(false);

    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            if (!post.user_has_liked) {
                likePostMutation.mutate(post.id);
                // Trigger like animation
                setShowHeartAnim(true);
                setTimeout(() => setShowHeartAnim(false), 1500);
            }
        }
        lastTap.current = now;
    };

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isCurrentlyLiked = post.user_has_liked;
        console.log(`[Kathaipom FEED] Like clicked for post ${post.id}, currently liked: ${isCurrentlyLiked}`);
        likePostMutation.mutate(post.id);

        if (!isCurrentlyLiked) {
            // About to like
            setShowHeartAnim(true);
            setTimeout(() => setShowHeartAnim(false), 1500);
        } else {
            // About to unlike
            setShowBreakAnim(true);
            setTimeout(() => setShowBreakAnim(false), 1500);
        }
    };

    return (
        <div
            className={`${isHorizontal ? 'h-full w-[600px] snap-start flex-shrink-0' : 'h-full w-full snap-start snap-always'} relative flex flex-col bg-black border-r border-white/5 overflow-hidden group`}
        >
            <div className={`flex-1 w-full ${isHorizontal ? '' : 'max-w-[450px] mx-auto'} relative flex flex-col shadow-2xl overflow-hidden ${isHorizontal ? '' : 'aspect-[4/5] sm:aspect-auto'}`}>
                <div
                    className="flex-1 relative flex items-center justify-center bg-zinc-900/80 cursor-pointer select-none"
                    onClick={handleDoubleTap}
                >
                    {post.image_url ? (
                        <img
                            src={post.image_url}
                            alt="Post"
                            className="w-full h-full object-cover sm:object-contain transition-transform duration-700 hover:scale-105"
                        />
                    ) : (
                        <div className="p-10 text-center w-full">
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xl font-semibold text-white/95 leading-relaxed tracking-tight whitespace-pre-wrap drop-shadow-xl"
                            >
                                {post.content}
                            </motion.p>
                        </div>
                    )}

                    <AnimatePresence>
                        {showHeartAnim && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: [0, 1.3, 1.1], opacity: [0, 1, 1, 0] }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 1.2, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
                                className="absolute z-50 pointer-events-none"
                            >
                                <Heart className="w-24 h-24 text-red-500 fill-current drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                            </motion.div>
                        )}
                        {showBreakAnim && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: [0, 1.3, 1.1], opacity: [0, 1, 1, 0] }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 1.2, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
                                className="absolute z-50 pointer-events-none"
                            >
                                <div className="text-7xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">💔</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                    <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
                        <motion.div whileHover={{ scale: 1.1 }} className="relative">
                            <Avatar className="w-9 h-9 ring-2 ring-white/10 shadow-lg">
                                <AvatarFallback className="text-xs font-black bg-gradient-to-br from-zinc-700 to-zinc-950 text-white">
                                    {getUserInitials(post.author_name || "Manager")}
                                </AvatarFallback>
                            </Avatar>
                        </motion.div>
                        <div className="flex flex-col">
                            <p className="text-[13px] font-black text-white leading-none mb-1 drop-shadow-md">
                                {post.author_name || "Manager"}
                            </p>
                            <p className="text-[9px] uppercase tracking-[0.1em] text-white/50 font-bold">
                                {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-5 right-20 z-10 pointer-events-none">
                        {post.image_url && (
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-[15px] font-medium leading-[1.3] text-white/95 whitespace-pre-wrap line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pr-10"
                            >
                                {post.content}
                            </motion.p>
                        )}
                    </div>

                    <div className={`absolute right-4 ${isHorizontal ? 'bottom-4' : 'bottom-8'} flex flex-col items-center gap-4 z-20 pointer-events-auto`}>
                        <div className="flex flex-col items-center group/action">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleLikeClick}
                                className={`p-2.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/5 shadow-xl transition-colors ${post.user_has_liked ? "text-red-500 border-red-500/20" : "text-white hover:text-red-400"}`}
                                title={post.user_has_liked ? "Unlike" : "Like"}
                            >
                                <Heart className={`w-6 h-6 ${post.user_has_liked ? "fill-current" : ""}`} />
                            </motion.button>
                            <motion.span
                                key={post.like_count}
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-[11px] font-black text-white mt-1 drop-shadow-lg tabular-nums"
                            >
                                {post.like_count || 0}
                            </motion.span>
                        </div>

                        {/* Dislike Action */}
                        <div className="flex flex-col items-center group/action">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    dislikePostMutation.mutate(post.id);
                                }}
                                className={`p-2.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/5 shadow-xl transition-colors ${post.user_has_disliked ? "text-orange-500 border-orange-500/20" : "text-white hover:text-orange-400"}`}
                                title={post.user_has_disliked ? "Remove Dislike" : "Dislike"}
                            >
                                <ThumbsDown className={`w-6 h-6 ${post.user_has_disliked ? "fill-current" : ""}`} />
                            </motion.button>
                            <motion.span
                                key={post.dislike_count}
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-[11px] font-black text-white mt-1 drop-shadow-lg tabular-nums"
                            >
                                {post.dislike_count || 0}
                            </motion.span>
                        </div>

                        <div className="flex flex-col items-center group/action">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleComments(post.id);
                                }}
                                className={`p-2.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/5 shadow-xl text-white transition-colors ${showComments ? "text-primary border-primary/20" : "hover:text-primary/80"}`}
                                title="Comments"
                            >
                                <MessageCircle className="w-6 h-6" />
                            </motion.button>
                            <span className="text-[11px] font-black text-white mt-1 drop-shadow-lg tabular-nums">
                                {post.comment_count || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute inset-x-0 bottom-0 h-[75%] backdrop-blur-[100px] border-t border-white/10 z-30 rounded-t-[2.5rem] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.5)] pointer-events-auto"
                        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.75) 100%)' }}
                    >
                        <div
                            className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mt-4 mb-2 cursor-pointer hover:bg-white/50 transition-colors"
                            onClick={() => toggleComments(post.id)}
                        />

                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-transparent">
                            <h3 className="text-lg font-black text-white tracking-tight">
                                Comments <span className="ml-2 text-white/50 font-medium text-sm">{post.comment_count || 0}</span>
                            </h3>
                            <button
                                onClick={() => toggleComments(post.id)}
                                className="p-2 rounded-full hover:bg-white/10 text-white/60 transition-colors"
                            >
                                <span className="text-sm font-bold">Close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
                            {comments && comments.length > 0 ? (
                                comments.map((comment: any) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={comment.id}
                                        className="flex items-start gap-4"
                                    >
                                        <Avatar className="w-10 h-10 shrink-0 border border-white/10">
                                            <AvatarFallback className="text-[11px] font-black bg-white/10 text-white">
                                                {getUserInitials(comment.user_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' }}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-black text-xs text-white">{comment.user_name}</p>
                                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                                        {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                                <p className="text-[13px] text-white/80 leading-relaxed font-medium">
                                                    {comment.comment_text}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-10 opacity-50 text-white/40">
                                    <MessageCircle className="w-12 h-12 mb-4" />
                                    <p className="text-sm font-black tracking-wide uppercase">No comments yet</p>
                                    <p className="text-xs mt-2">Be the first to say something!</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-black/40 border-t border-white/10 sticky bottom-0">
                            <div className="relative flex items-center gap-3">
                                <Input
                                    placeholder="Write a comment..."
                                    value={commentTexts[post.id] || ""}
                                    onChange={(e) =>
                                        setCommentTexts((prev: any) => ({ ...prev, [post.id]: e.target.value }))
                                    }
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter" && commentTexts[post.id]?.trim()) {
                                            addCommentMutation.mutate({
                                                postId: post.id,
                                                comment_text: commentTexts[post.id],
                                            });
                                        }
                                    }}
                                    className="pr-14 rounded-2xl border-white/10 h-14 text-[14px] font-medium placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/30 transition-all border text-white"
                                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' }}
                                />
                                <motion.div
                                    className="absolute right-2"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Button
                                        size="icon"
                                        variant="default"
                                        onClick={() => {
                                            if (commentTexts[post.id]?.trim()) {
                                                addCommentMutation.mutate({
                                                    postId: post.id,
                                                    comment_text: commentTexts[post.id],
                                                });
                                            }
                                        }}
                                        disabled={!commentTexts[post.id]?.trim() || addCommentMutation.isPending}
                                        className="rounded-xl w-10 h-10"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
