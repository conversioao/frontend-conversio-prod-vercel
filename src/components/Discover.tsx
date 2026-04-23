import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, MessageSquare, Eye, Search, Sparkles, Zap, Loader2, Send,
  Plus, Globe, X, CheckCircle2, AlertCircle, ImageIcon, User, ArrowLeft,
  Share2, TrendingUp
} from 'lucide-react';
import { apiFetch } from '../lib/api';

const POST_LIMIT = 10;

interface Post {
  id: string;
  image_url: string;
  prompt: string;
  description?: string;
  creator_name: string;
  creator_avatar?: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  is_liked?: boolean;
}

interface Comment {
  id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export function Discover() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState('trending');
  const [user, setUser] = useState<any>(null);
  const [monthlyPosts, setMonthlyPosts] = useState(0);

  // Post detail modal
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Publish modal — step 1: gallery, step 2: description
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [publishDescription, setPublishDescription] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('conversio_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchMonthlyStats();
    }
  }, [activeSort, user]);

  const fetchMonthlyStats = async () => {
    if (!user) return;
    try {
      const res = await apiFetch(`/user/stats?userId=${user.id}`);
      const data = await res.json();
      if (data.success) setMonthlyPosts(data.monthlyPosts || 0);
    } catch {}
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = activeSort === 'my'
        ? `/social/posts?sort=my&userId=${user.id}`
        : `/social/posts?sort=${activeSort}&userId=${user?.id || ''}`;
      const res = await apiFetch(url);
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const openPost = async (post: Post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    setComments([]);
    // Only count view if it's NOT the post owner viewing their own post
    if (!user || user.id !== (post as any).user_id) {
      apiFetch(`/social/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, viewerId: user?.id || null })
      });
      // Optimistically update local view count
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views_count: p.views_count + 1 } : p));
    }
    // Fetch comments
    try {
      const res = await apiFetch(`/social/post/${post.id}/comments`);
      const data = await res.json();
      if (data.success) setComments(data.comments);
    } catch {}
    setLoadingComments(false);
  };

  const handleLike = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;
    try {
      const res = await apiFetch(`/social/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, postId })
      });
      const data = await res.json();
      if (data.success) {
        const update = (p: Post) => p.id === postId
          ? { ...p, likes_count: data.liked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1), is_liked: data.liked }
          : p;
        setPosts(prev => prev.map(update));
        if (selectedPost?.id === postId) setSelectedPost(prev => prev ? update(prev) : prev);
      }
    } catch {}
  };

  const handleComment = async () => {
    if (!user || !commentText.trim() || !selectedPost) return;
    try {
      const res = await apiFetch(`/social/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, postId: selectedPost.id, content: commentText })
      });
      const data = await res.json();
      if (data.success) {
        const newComment: Comment = {
          id: data.commentId,
          user_name: user.name || 'Eu',
          user_avatar: user.avatar_url,
          content: commentText,
          created_at: new Date().toISOString()
        };
        setComments(prev => [...prev, newComment]);
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comments_count: p.comments_count + 1 } : p));
        setSelectedPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev);
        setCommentText('');
      }
    } catch {}
  };

  const fetchGallery = async () => {
    if (!user) return;
    setLoadingGallery(true);
    setShowPublishModal(true);
    setSelectedItem(null);
    setPublishDescription('');
    setPublishStatus(null);
    try {
      const res = await apiFetch(`/generations?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setGalleryItems(data.generations.filter((g: any) => g.status === 'completed' && !g.social_post_id));
      }
    } catch {}
    setLoadingGallery(false);
  };

  const handlePublish = async () => {
    if (!user || !selectedItem || publishing) return;
    setPublishing(true);
    try {
      const res = await apiFetch(`/social/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          generationId: selectedItem.id,
          type: selectedItem.type,
          imageUrl: selectedItem.result_url,
          prompt: selectedItem.prompt,
          description: publishDescription
        })
      });
      const data = await res.json();
      if (data.success) {
        setPublishStatus({ success: true, message: 'Arte publicada na comunidade!' });
        setMonthlyPosts(p => p + 1);
        setTimeout(() => {
          setShowPublishModal(false);
          setSelectedItem(null);
          fetchPosts();
        }, 1800);
      } else {
        setPublishStatus({ success: false, message: data.message || 'Erro ao publicar' });
      }
    } catch {
      setPublishStatus({ success: false, message: 'Erro de rede' });
    } finally {
      setPublishing(false);
    }
  };

  const remaining = POST_LIMIT - monthlyPosts;
  const limitPct = (monthlyPosts / POST_LIMIT) * 100;

  const sortTabs = [
    { key: 'trending', label: 'Destaque', icon: TrendingUp },
    { key: 'latest', label: 'Recentes', icon: null },
    { key: 'popular', label: 'Curtidos', icon: null },
    ...(user ? [{ key: 'my', label: 'Minhas Artes', icon: null }] : [])
  ];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto animate-in fade-in duration-700 pb-20 px-4 sm:px-0">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-[#FFB800]/20 text-[#FFB800] text-[10px] font-black uppercase tracking-widest border border-[#FFB800]/20 flex items-center gap-2">
              <Sparkles size={12} fill="currentColor" /> Comunidade
            </span>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-4">Descobrir Criativos</h1>
          <div className="flex items-center gap-6 flex-wrap">
            {sortTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSort(tab.key)}
                className={`flex items-center gap-1.5 text-sm font-bold transition-colors pb-1 border-b-2 ${
                  activeSort === tab.key
                    ? 'text-[#FFB800] border-[#FFB800]'
                    : 'text-text-tertiary border-transparent hover:text-text-primary'
                }`}
              >
                {tab.icon && <tab.icon size={14} />} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            onClick={fetchGallery}
            disabled={remaining <= 0}
            className="flex items-center gap-2 px-6 py-3 bg-[#FFB800] text-black rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-[0_10px_20px_rgba(255,184,0,0.2)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Plus size={18} /> Partilhar Arte
          </button>
          {/* Monthly limit bar */}
          <div className="text-right w-full max-w-[200px]">
            <div className="flex justify-between text-[10px] font-bold text-text-tertiary mb-1 uppercase tracking-widest">
              <span>Publicações</span>
              <span className={remaining === 0 ? 'text-red-400' : 'text-[#FFB800]'}>{monthlyPosts}/{POST_LIMIT}</span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${limitPct >= 80 ? 'bg-red-400' : 'bg-gradient-to-r from-[#FFB800] to-orange-500'}`}
                style={{ width: `${limitPct}%` }}
              />
            </div>
            <p className="text-[9px] text-text-tertiary mt-1">{remaining > 0 ? `${remaining} restantes este mês` : 'Limite atingido'}</p>
          </div>
        </div>
      </div>

      {/* Post Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#FFB800] mb-4" size={48} />
          <p className="text-text-tertiary font-bold tracking-widest uppercase text-xs">Carregando...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface/50 rounded-[3rem] border border-dashed border-border-subtle">
          <Zap size={48} className="text-text-tertiary mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-text-primary mb-2">Nenhuma publicação ainda</h3>
          <p className="text-text-secondary max-w-sm">Seja o primeiro a partilhar uma criação na comunidade!</p>
          <button onClick={fetchGallery} className="mt-6 text-[#FFB800] font-bold hover:underline">Partilhar Arte</button>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {posts.map(post => (
            <div
              key={post.id}
              onClick={() => openPost(post)}
              className="break-inside-avoid group relative bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-[2rem] overflow-hidden hover:border-[#FFB800]/50 transition-all duration-500 shadow-lg cursor-pointer"
            >
              <div className="relative overflow-hidden">
                <img src={post.image_url} alt="AI Gen" className="w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                  <p className="text-xs text-white/90 line-clamp-2">{post.prompt}</p>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border border-border-subtle overflow-hidden bg-bg-base flex items-center justify-center shrink-0">
                      {post.creator_avatar ? <img src={post.creator_avatar} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-text-tertiary" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary">{post.creator_name}</p>
                      <p className="text-[9px] text-text-tertiary">{new Date(post.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  </div>
                </div>

                {post.description && (
                  <p className="text-xs text-text-secondary mb-3 line-clamp-2">{post.description}</p>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => handleLike(post.id, e)}
                    className={`flex items-center gap-1.5 transition-all group/btn ${post.is_liked ? 'text-red-500 scale-110' : 'text-text-tertiary hover:text-red-400'}`}
                  >
                    <Heart size={16} fill={post.is_liked ? 'currentColor' : 'none'} />
                    <span className="text-[11px] font-black">{post.likes_count}</span>
                  </button>
                  <span className="flex items-center gap-1.5 text-text-tertiary">
                    <MessageSquare size={16} />
                    <span className="text-[11px] font-black">{post.comments_count}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-text-tertiary ml-auto">
                    <Eye size={14} />
                    <span className="text-[11px] font-bold">{post.views_count}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === Post Detail Modal (Facebook-style) === */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedPost(null)}>
          <div
            className="bg-surface border border-border-subtle rounded-[2rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Image Side */}
            <div className="md:w-[55%] bg-black flex items-center justify-center relative shrink-0">
              <img src={selectedPost.image_url} alt="Post" className="w-full h-full object-contain max-h-[90vh]" />
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              ><X size={20} /></button>
            </div>

            {/* Info Side */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-border-subtle flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-border-subtle bg-bg-base flex items-center justify-center shrink-0">
                  {selectedPost.creator_avatar ? <img src={selectedPost.creator_avatar} alt="" className="w-full h-full object-cover" /> : <User size={20} className="text-text-tertiary" />}
                </div>
                <div>
                  <p className="font-bold text-text-primary text-sm">{selectedPost.creator_name}</p>
                  <p className="text-[10px] text-text-tertiary">{new Date(selectedPost.created_at).toLocaleString('pt-PT')}</p>
                </div>
              </div>

              {/* Description & Prompt */}
              <div className="p-5 border-b border-border-subtle space-y-3">
                {selectedPost.description && (
                  <p className="text-sm text-text-primary leading-relaxed">{selectedPost.description}</p>
                )}
                <div className="bg-bg-base/60 rounded-xl p-3 border border-border-subtle/50">
                  <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-1">Prompt</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{selectedPost.prompt}</p>
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center gap-5 pt-1">
                  <button
                    onClick={() => handleLike(selectedPost.id)}
                    className={`flex items-center gap-2 font-bold text-sm transition-all ${selectedPost.is_liked ? 'text-red-500' : 'text-text-tertiary hover:text-red-400'}`}
                  >
                    <Heart size={20} fill={selectedPost.is_liked ? 'currentColor' : 'none'} />
                    {selectedPost.likes_count} Gostos
                  </button>
                  <span className="flex items-center gap-2 text-text-tertiary text-sm">
                    <MessageSquare size={18} /> {selectedPost.comments_count}
                  </span>
                  <span className="flex items-center gap-2 text-text-tertiary text-sm ml-auto">
                    <Eye size={16} /> {selectedPost.views_count} visualizações
                  </span>
                </div>
              </div>

              {/* Comments */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {loadingComments ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#FFB800]" size={24} /></div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-text-tertiary text-sm">Sem comentários. Seja o primeiro!</p>
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-border-subtle bg-bg-base flex items-center justify-center shrink-0">
                        {c.user_avatar ? <img src={c.user_avatar} alt="" className="w-full h-full object-cover" /> : <User size={14} className="text-text-tertiary" />}
                      </div>
                      <div className="flex-1 bg-bg-base/60 rounded-2xl px-4 py-2.5 border border-border-subtle/30">
                        <p className="text-[11px] font-bold text-text-primary mb-1">{c.user_name}</p>
                        <p className="text-xs text-text-secondary leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              {user && (
                <div className="p-4 border-t border-border-subtle flex items-center gap-3 bg-surface/50">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-border-subtle bg-bg-base flex items-center justify-center shrink-0">
                    {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={14} className="text-text-tertiary" />}
                  </div>
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleComment()}
                    placeholder="Escreve um comentário..."
                    className="flex-1 bg-bg-base border border-border-subtle rounded-2xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-[#FFB800] transition-colors"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="p-2.5 bg-[#FFB800] text-black rounded-2xl hover:scale-110 transition-transform disabled:opacity-40 disabled:hover:scale-100"
                  ><Send size={16} /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === Publish Modal (2-Step) === */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface border border-border-subtle rounded-[2.5rem] w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">

            <div className="p-7 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedItem && (
                  <button onClick={() => setSelectedItem(null)} className="p-2 rounded-full hover:bg-surface-hover text-text-tertiary">
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-black text-text-primary">
                    {selectedItem ? 'Adicionar Descrição' : 'Escolher Arte'}
                  </h2>
                  <p className="text-text-secondary text-xs mt-0.5">
                    {selectedItem ? 'Escreve uma descrição para a tua publicação.' : 'Seleciona uma criação da tua galeria.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPublishModal(false)} className="p-2 rounded-full hover:bg-surface-hover text-text-tertiary hover:text-white">
                <X size={22} />
              </button>
            </div>

            {publishStatus && (
              <div className={`mx-7 mt-5 px-5 py-3 rounded-2xl flex items-center gap-3 ${publishStatus.success ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                {publishStatus.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span className="text-sm font-bold">{publishStatus.message}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-bg-base/50" style={{ scrollbarWidth: 'thin' }}>
              {!selectedItem ? (
                // Step 1: Gallery
                <div className="p-7">
                  {loadingGallery ? (
                    <div className="flex flex-col items-center py-16"><Loader2 className="animate-spin text-[#FFB800] mb-3" size={36} /><p className="text-text-tertiary text-xs uppercase tracking-widest font-bold">Carregando galeria...</p></div>
                  ) : galleryItems.length === 0 ? (
                    <div className="text-center py-16">
                      <ImageIcon size={48} className="text-text-tertiary mb-4 opacity-20 mx-auto" />
                      <p className="text-text-secondary font-medium">Todas as suas artes já foram partilhadas ou ainda não tens criações.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {galleryItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-[#FFB800] transition-all duration-300 shadow-md"
                        >
                          <img src={item.result_url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Globe size={22} className="text-[#FFB800]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Step 2: Add description
                <div className="p-7 flex flex-col md:flex-row gap-7">
                  <div className="md:w-64 shrink-0">
                    <img src={selectedItem.result_url} alt="Selected" className="w-full rounded-2xl shadow-xl border border-border-subtle" />
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-black text-text-tertiary uppercase tracking-widest mb-2 block">Prompt</label>
                      <p className="text-xs text-text-secondary bg-bg-base/60 rounded-xl p-3 border border-border-subtle/50 leading-relaxed">{selectedItem.prompt}</p>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-black text-text-tertiary uppercase tracking-widest mb-2 block">Descrição <span className="text-text-tertiary font-normal normal-case">(Opcional)</span></label>
                      <textarea
                        value={publishDescription}
                        onChange={e => setPublishDescription(e.target.value)}
                        placeholder="Conta a história desta arte, os bastidores da criação, ou dá dicas ao community..."
                        rows={5}
                        className="w-full bg-bg-base border border-border-subtle rounded-2xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[#FFB800] transition-colors resize-none"
                      />
                    </div>
                    <button
                      onClick={handlePublish}
                      disabled={publishing}
                      className="w-full py-4 bg-[#FFB800] text-black rounded-2xl font-black text-sm hover:scale-[1.02] transition-all shadow-[0_8px_20px_rgba(255,184,0,0.25)] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {publishing ? <><Loader2 size={18} className="animate-spin" /> Publicando...</> : <><Globe size={18} /> Publicar na Comunidade</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
