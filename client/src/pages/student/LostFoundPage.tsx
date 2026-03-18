import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { useAuth } from '@hooks/useAuth';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import PageHeader from '@components/ui/PageHeader';
import ErrorBanner from '@components/ui/ErrorBanner';
import StatusBadge from '@components/ui/StatusBadge';
import type { StatusVariant } from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { motion, AnimatePresence } from 'motion/react';

/* ---------- Types ---------- */

type ItemType = 'LOST' | 'FOUND';
type Category = 'ELECTRONICS' | 'CLOTHING' | 'BOOKS' | 'ID_CARDS' | 'KEYS' | 'ACCESSORIES' | 'OTHER';
type Status = 'ACTIVE' | 'CLAIMED' | 'RETURNED' | 'EXPIRED';

interface PostedBy {
  _id: string;
  name: string;
  block?: string;
  roomNumber?: string;
}

interface LostFoundPost {
  _id: string;
  postedBy: PostedBy;
  type: ItemType;
  itemName: string;
  description: string;
  category: Category;
  locationFound?: string;
  dateOccurred?: string;
  status: Status;
  claimedBy?: string;
  claimedAt?: string;
  contactInfo?: string;
  createdAt: string;
}

const CATEGORIES: Category[] = [
  'ELECTRONICS',
  'CLOTHING',
  'BOOKS',
  'ID_CARDS',
  'KEYS',
  'ACCESSORIES',
  'OTHER',
];

const CATEGORY_LABELS: Record<Category, string> = {
  ELECTRONICS: 'Electronics',
  CLOTHING: 'Clothing',
  BOOKS: 'Books',
  ID_CARDS: 'ID Cards',
  KEYS: 'Keys',
  ACCESSORIES: 'Accessories',
  OTHER: 'Other',
};

const STATUS_VARIANT: Record<Status, StatusVariant> = {
  ACTIVE: 'info',
  CLAIMED: 'warning',
  RETURNED: 'success',
  EXPIRED: 'neutral',
};

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]';

/* ---------- Component ---------- */

export default function LostFoundPage() {
  const { user } = useAuth();
  const userId = user?.id;

  /* Data state */
  const [posts, setPosts] = useState<LostFoundPost[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filter state */
  const [filterType, setFilterType] = useState<'ALL' | ItemType>('ALL');
  const [filterCategory, setFilterCategory] = useState<'' | Category>('');
  const [filterStatus, setFilterStatus] = useState<'' | Status>('');
  const [showMyPosts, setShowMyPosts] = useState(false);

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ItemType>('LOST');

  /* Form state */
  const [formItemName, setFormItemName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('OTHER');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* Fetch posts */
  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'ALL') params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      if (filterCategory) params.set('category', filterCategory);
      const query = params.toString();

      if (showMyPosts) {
        const res = await apiFetch<LostFoundPost[]>('/lost-found/my');
        setPosts(res.data);
      } else {
        const res = await apiFetch<LostFoundPost[]>(`/lost-found${query ? `?${query}` : ''}`);
        setPosts(res.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, filterCategory, showMyPosts]);

  useEffect(() => {
    setLoading(true);
    void fetchPosts();
  }, [fetchPosts]);

  /* Handlers */
  const openModal = (type: ItemType) => {
    setModalType(type);
    setFormItemName('');
    setFormDescription('');
    setFormCategory('OTHER');
    setFormLocation('');
    setFormDate('');
    setFormContact('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formItemName.trim()) {
      setFormError('Item name is required');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Description is required');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/lost-found', {
        method: 'POST',
        body: JSON.stringify({
          type: modalType,
          itemName: formItemName.trim(),
          description: formDescription.trim(),
          category: formCategory,
          locationFound: formLocation.trim() || undefined,
          dateOccurred: formDate || undefined,
          contactInfo: formContact.trim() || undefined,
        }),
      });
      setModalOpen(false);
      void fetchPosts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = async (postId: string) => {
    try {
      await apiFetch(`/lost-found/${postId}/claim`, { method: 'PATCH' });
      void fetchPosts();
    } catch {
      // silently fail
    }
  };

  const handleReturn = async (postId: string) => {
    try {
      await apiFetch(`/lost-found/${postId}/return`, { method: 'PATCH' });
      void fetchPosts();
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await apiFetch(`/lost-found/${postId}`, { method: 'DELETE' });
      void fetchPosts();
    } catch {
      // silently fail
    }
  };

  /* Helpers */
  const isOwnPost = (post: LostFoundPost) => post.postedBy._id === userId;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  /* ---------- Render ---------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal>
        <PageHeader
          title="Lost & Found Board"
          description="Report lost items or post items you have found to help fellow residents."
        />
      </Reveal>

      {/* Action buttons */}
      <Reveal direction="none" delay={0.1}>
      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => openModal('LOST')}
          className="px-4 py-2 rounded-lg bg-[hsl(var(--destructive))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Report Lost Item
        </button>
        <button
          type="button"
          onClick={() => openModal('FOUND')}
          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Report Found Item
        </button>
      </div>
      </Reveal>

      {/* Filter bar */}
      <Reveal direction="none" delay={0.15}>
      <div className="flex flex-wrap gap-3 items-center">
        {/* Type tabs */}
        <div className="flex rounded-lg border border-[hsl(var(--border))] overflow-hidden">
          {(['ALL', 'LOST', 'FOUND'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                filterType === t
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  : 'bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
            >
              {t === 'ALL' ? 'All' : t === 'LOST' ? 'Lost' : 'Found'}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as '' | Category)}
          className={inputCls.replace('w-full ', '')}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as '' | Status)}
          className={inputCls.replace('w-full ', '')}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CLAIMED">Claimed</option>
          <option value="RETURNED">Returned</option>
        </select>

        {/* My posts toggle */}
        <button
          type="button"
          onClick={() => setShowMyPosts((p) => !p)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
            showMyPosts
              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
              : 'border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
          }`}
        >
          My Posts
        </button>
      </div>
      </Reveal>

      {/* Posts grid */}
      {loading ? (
        <PageSkeleton />
      ) : posts.length === 0 ? (
        <EmptyState variant="compact" title="No posts found" description="Try adjusting the filters or report a new item." />
      ) : (
        <StaggerContainer stagger={0.05} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <StaggerItem key={post._id}>
            <div
              className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3"
            >
              {/* Top row: type badge + status badge */}
              <div className="flex justify-between items-start">
                <StatusBadge variant={post.type === 'LOST' ? 'error' : 'success'}>
                  {post.type}
                </StatusBadge>
                <StatusBadge variant={STATUS_VARIANT[post.status]}>
                  {post.status}
                </StatusBadge>
              </div>

              {/* Item name + category */}
              <div>
                <h3 className="font-semibold text-[hsl(var(--foreground))]">{post.itemName}</h3>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-xs">
                  {CATEGORY_LABELS[post.category] ?? post.category}
                </span>
              </div>

              {/* Description (truncated) */}
              <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
                {post.description}
              </p>

              {/* Location + date */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                {post.locationFound && <span>Location: {post.locationFound}</span>}
                {post.dateOccurred && <span>Date: {formatDate(post.dateOccurred)}</span>}
              </div>

              {/* Contact info */}
              {post.contactInfo && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Contact: {post.contactInfo}
                </p>
              )}

              {/* Posted by */}
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Posted by: {post.postedBy.name}
                {post.postedBy.block && ` | Block ${post.postedBy.block}`}
                {post.postedBy.roomNumber && ` / Room ${post.postedBy.roomNumber}`}
                {' - '}
                {formatDate(post.createdAt)}
              </p>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap pt-1">
                {/* Claim button: on FOUND + ACTIVE items, not own */}
                {post.type === 'FOUND' &&
                  post.status === 'ACTIVE' &&
                  !isOwnPost(post) && (
                    <button
                      type="button"
                      onClick={() => void handleClaim(post._id)}
                      className="px-3 py-1 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      Claim
                    </button>
                  )}

                {/* Mark Returned: own CLAIMED items */}
                {post.status === 'CLAIMED' && isOwnPost(post) && (
                  <button
                    type="button"
                    onClick={() => void handleReturn(post._id)}
                    className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Mark Returned
                  </button>
                )}

                {/* Delete: own active posts */}
                {isOwnPost(post) && post.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(post._id)}
                    className="px-3 py-1 rounded-lg bg-[hsl(var(--destructive))] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Modal overlay */}
      <AnimatePresence>
      {modalOpen && (
        <motion.div key="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="w-full max-w-lg mx-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
                Report {modalType === 'LOST' ? 'Lost' : 'Found'} Item
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmitPost(e)} className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Blue Backpack, iPhone 15"
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  Description *
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Provide details to help identify the item..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as Category)}
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  maxLength={200}
                  placeholder="e.g. Common Room Block A, Mess Hall"
                  className={inputCls}
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  Date Occurred
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  Contact Info
                </label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  maxLength={200}
                  placeholder="Phone number, email, or room number"
                  className={inputCls}
                />
              </div>

              {/* Error */}
              {formError && <ErrorBanner message={formError} />}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50 hover:opacity-90 transition-opacity ${
                  modalType === 'LOST' ? 'bg-[hsl(var(--destructive))]' : 'bg-green-600'
                }`}
              >
                {submitting
                  ? 'Submitting...'
                  : `Report ${modalType === 'LOST' ? 'Lost' : 'Found'} Item`}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
