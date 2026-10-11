import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Pin,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  Trash2,
  Tag,
  Sparkles,
  Filter,
  Search,
  Check,
  Copy,
  AlertCircle,
  FileCode,
  Layers,
  Wrench,
  ThumbsUp,
  User,
  RotateCcw,
} from 'lucide-react';
import { CADDesign, DesignComment, CommentCategory, AuthorRole } from '../types/cad';

interface DesignCommentsModalProps {
  design: CADDesign;
  onUpdateComments: (updatedDesign: CADDesign) => void;
  onClose: () => void;
}

const ROLE_COLORS: Record<AuthorRole, { bg: string; text: string; border: string }> = {
  Maker: { bg: 'bg-blue-950/70', text: 'text-blue-300', border: 'border-blue-800/80' },
  Designer: { bg: 'bg-purple-950/70', text: 'text-purple-300', border: 'border-purple-800/80' },
  'Print Tech': { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-800/80' },
  'Shop Manager': { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-800/80' },
  Client: { bg: 'bg-rose-950/70', text: 'text-rose-300', border: 'border-rose-800/80' },
};

const CATEGORY_META: Record<
  CommentCategory,
  { label: string; icon: string; badgeClass: string }
> = {
  iteration: {
    label: 'Iteration Log',
    icon: '🔄',
    badgeClass: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80',
  },
  production: {
    label: 'Production & Slicing',
    icon: '⚙️',
    badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
  },
  qa_check: {
    label: 'QA & Print Test',
    icon: '✅',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80',
  },
  client_feedback: {
    label: 'Client Feedback',
    icon: '💬',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800/80',
  },
  team_note: {
    label: 'Team Note',
    icon: '📝',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
  },
};

const AVATAR_PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'];

export const DesignCommentsModal: React.FC<DesignCommentsModalProps> = ({
  design,
  onUpdateComments,
  onClose,
}) => {
  const comments = design.comments || [];

  // Local storage author persistence
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('forgecraft_author_name') || 'Maker Team';
  });
  const [authorRole, setAuthorRole] = useState<AuthorRole>(() => {
    return (localStorage.getItem('forgecraft_author_role') as AuthorRole) || 'Maker';
  });

  const [category, setCategory] = useState<CommentCategory>('iteration');
  const [newContent, setNewContent] = useState('');
  const [pinOnPost, setPinOnPost] = useState(false);
  const [tagCurrentVersion, setTagCurrentVersion] = useState(true);

  // Filters & Search
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'pinned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('forgecraft_author_name', authorName);
  }, [authorName]);

  useEffect(() => {
    localStorage.setItem('forgecraft_author_role', authorRole);
  }, [authorRole]);

  const currentVersionLabel = `v${(design.versions?.length || 0) + 1}`;

  // Filtering
  const filteredComments = comments.filter((c) => {
    const matchesCategory =
      selectedCategoryFilter === 'all' || c.category === selectedCategoryFilter;
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pinned'
        ? !!c.pinned
        : !c.resolved;
    const matchesSearch =
      searchQuery.trim() === '' ||
      c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.taggedVersion && c.taggedVersion.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Sort: Pinned first, then newest first
  const sortedComments = [...filteredComments].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newContent.trim()) return;

    // Pick consistent color based on author name
    const charCodeSum = authorName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const avatarColor = AVATAR_PALETTE[charCodeSum % AVATAR_PALETTE.length];

    const newComment: DesignComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorName: authorName.trim() || 'Anonymous',
      authorRole,
      avatarColor,
      content: newContent.trim(),
      category,
      timestamp: new Date().toISOString(),
      pinned: pinOnPost,
      resolved: false,
      taggedVersion: tagCurrentVersion ? currentVersionLabel : undefined,
    };

    const updatedComments = [newComment, ...comments];
    const updatedDesign: CADDesign = {
      ...design,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    };

    onUpdateComments(updatedDesign);
    setNewContent('');
    setPinOnPost(false);
  };

  const handleTogglePin = (commentId: string) => {
    const updatedComments = comments.map((c) =>
      c.id === commentId ? { ...c, pinned: !c.pinned } : c
    );
    onUpdateComments({
      ...design,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleResolve = (commentId: string) => {
    const updatedComments = comments.map((c) =>
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    );
    onUpdateComments({
      ...design,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteComment = (commentId: string) => {
    const updatedComments = comments.filter((c) => c.id !== commentId);
    onUpdateComments({
      ...design,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const applyTemplate = (template: string) => {
    setNewContent((prev) => (prev ? `${prev}\n${template}` : template));
  };

  // Quick stats
  const totalComments = comments.length;
  const openCount = comments.filter((c) => !c.resolved).length;
  const pinnedCount = comments.filter((c) => c.pinned).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-blue-500 text-white rounded-2xl shadow-md shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-100 truncate">
                  Team Collaboration & Iteration Notes
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-bold">
                  {currentVersionLabel}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {design.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Track design changes, print farm QA tests, and client feedback directly on this model.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Filter Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Quick counts */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">
              Total Notes: <strong className="text-slate-200">{totalComments}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-medium">
              Open Action Items: <strong>{openCount}</strong>
            </span>
            {pinnedCount > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-indigo-300 font-medium flex items-center gap-1">
                  <Pin className="w-3 h-3 text-indigo-400" />
                  <span>{pinnedCount} Pinned</span>
                </span>
              </>
            )}
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({totalComments})
            </button>
            <button
              onClick={() => setStatusFilter('unresolved')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                statusFilter === 'unresolved'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Open ({openCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('pinned')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                statusFilter === 'pinned'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Pin className="w-3 h-3" />
              <span>Pinned ({pinnedCount})</span>
            </button>
          </div>
        </div>

        {/* Secondary Category Filters & Search */}
        <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-950/30 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition font-medium border ${
                selectedCategoryFilter === 'all'
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Types
            </button>
            {(Object.keys(CATEGORY_META) as CommentCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const isSelected = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition font-medium flex items-center gap-1 border ${
                    isSelected
                      ? `${meta.badgeClass} ring-1 ring-white/20 font-bold`
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Modal Main Content: List of Comments */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 min-h-[220px]">
          {sortedComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 gap-2 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-300">No notes found matching your filter</p>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Use the composer below to document iteration notes, print settings test results, or feedback for your team.
              </p>
            </div>
          ) : (
            sortedComments.map((comment) => {
              const roleMeta = ROLE_COLORS[comment.authorRole] || ROLE_COLORS.Maker;
              const catMeta = CATEGORY_META[comment.category] || CATEGORY_META.team_note;
              const initials = comment.authorName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={comment.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 relative flex flex-col gap-2.5 ${
                    comment.pinned
                      ? 'bg-indigo-950/20 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20'
                      : comment.resolved
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-80'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar: Author, Role, Category, Version, Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Avatar */}
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: comment.avatarColor || '#3b82f6' }}
                      >
                        {initials || 'U'}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-100">
                          {comment.authorName}
                        </span>

                        {/* Role Badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded-md border ${roleMeta.bg} ${roleMeta.text} ${roleMeta.border}`}
                        >
                          {comment.authorRole}
                        </span>

                        {/* Category Badge */}
                        <span
                          className={`text-[10px] font-medium px-2 py-0.2 rounded-md border flex items-center gap-1 ${catMeta.badgeClass}`}
                        >
                          <span>{catMeta.icon}</span>
                          <span>{catMeta.label}</span>
                        </span>

                        {/* Tagged Version */}
                        {comment.taggedVersion && (
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                            {comment.taggedVersion}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status & Pin indicator */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {comment.pinned && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-700 px-2 py-0.5 rounded-full">
                          <Pin className="w-2.5 h-2.5" />
                          <span>Pinned</span>
                        </span>
                      )}

                      {comment.resolved && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Resolved</span>
                        </span>
                      )}

                      <span className="text-[10px] text-slate-500 font-mono ml-1">
                        {new Date(comment.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(comment.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <div className="text-xs text-slate-200 leading-relaxed pl-9 whitespace-pre-wrap font-sans">
                    {comment.content}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 pl-9 text-[11px]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePin(comment.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition border ${
                          comment.pinned
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                        title={comment.pinned ? 'Unpin this note' : 'Pin note to top of list'}
                      >
                        <Pin className="w-3 h-3" />
                        <span>{comment.pinned ? 'Unpin' : 'Pin to Top'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleResolve(comment.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition border ${
                          comment.resolved
                            ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                        title={comment.resolved ? 'Reopen note' : 'Mark note as resolved'}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{comment.resolved ? 'Reopen' : 'Mark Resolved'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyText(comment.id, comment.content)}
                        className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-md transition"
                        title="Copy note text"
                      >
                        {copiedId === comment.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-md transition"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer Box: Add Note for Team / Iteration */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 space-y-3">
          {/* Quick starter templates */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Quick Templates:
            </span>
            <button
              onClick={() =>
                applyTemplate('🚀 Print Farm Test: Printed on Bambu X1C (0.2mm standard). Layer bonding is solid; finished in 2h 15m.')
              }
              className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition"
            >
              Print Test Results
            </button>
            <button
              onClick={() =>
                applyTemplate('📐 Iteration Log: Adjusted wall thickness from 2.0mm to 2.8mm to prevent flex under load.')
              }
              className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition"
            >
              Wall Adjustment
            </button>
            <button
              onClick={() =>
                applyTemplate('⚠️ Production Tolerance: Keep clearance at >= 0.4mm for snap-fit lids.')
              }
              className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition"
            >
              Tolerance Alert
            </button>
            <button
              onClick={() =>
                applyTemplate('⭐ Client Request: Buyer requested customized personalized text on top rim.')
              }
              className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 whitespace-nowrap transition"
            >
              Client Request
            </button>
          </div>

          <form onSubmit={handleAddComment} className="space-y-3">
            {/* Author, Role, and Category selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your Name / Studio ID"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  Team Role
                </label>
                <select
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value as AuthorRole)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Maker">Maker (Owner)</option>
                  <option value="Designer">CAD Designer</option>
                  <option value="Print Tech">Print Tech / QA</option>
                  <option value="Shop Manager">Shop Manager</option>
                  <option value="Client">Client / Buyer</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  Note Type
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CommentCategory)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="iteration">🔄 Iteration Log</option>
                  <option value="production">⚙️ Production & Slicing</option>
                  <option value="qa_check">✅ QA & Print Test</option>
                  <option value="client_feedback">💬 Client Feedback</option>
                  <option value="team_note">📝 General Team Note</option>
                </select>
              </div>
            </div>

            {/* Note text input */}
            <div className="relative">
              <textarea
                rows={2}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    handleAddComment();
                  }
                }}
                placeholder="Leave notes for team members, print farm settings, or iteration changes... (Ctrl+Enter to post)"
                className="w-full bg-slate-900 border border-slate-700/90 rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            {/* Composer Footer Actions */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tagCurrentVersion}
                    onChange={(e) => setTagCurrentVersion(e.target.checked)}
                    className="accent-blue-500 rounded"
                  />
                  <span>Tag active version ({currentVersionLabel})</span>
                </label>

                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinOnPost}
                    onChange={(e) => setPinOnPost(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                  <Pin className="w-3 h-3 text-indigo-400" />
                  <span>Pin to top</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!newContent.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Team Note</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
