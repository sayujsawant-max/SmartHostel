import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { FileText, Upload, Download, Eye, Trash2, File, Image, FileSpreadsheet, Clock } from 'lucide-react';
import { usePageTitle } from '@hooks/usePageTitle';

interface Document {
  _id: string;
  name: string;
  type: string;
  size: number;
  category: 'ID_PROOF' | 'FEE_RECEIPT' | 'MEDICAL' | 'OTHER';
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt: string;
  url: string;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  VERIFIED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
};

const CATEGORY_LABELS: Record<string, { label: string; icon: typeof FileText; color: string; bg: string }> = {
  ID_PROOF: { label: 'ID Proof', icon: File, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/40' },
  FEE_RECEIPT: { label: 'Fee Receipt', icon: FileSpreadsheet, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40' },
  MEDICAL: { label: 'Medical', icon: FileText, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/40' },
  OTHER: { label: 'Other', icon: File, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-950/40' },
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  usePageTitle('Documents');
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    apiFetch<Document[]>('/assistant/documents')
      .then(res => setDocs(res.data))
      .catch(err => showError(err, 'Failed to load documents'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'OTHER');
      await apiFetch('/assistant/documents', { method: 'POST', body: formData });
      showSuccess('Document uploaded!');
      const res = await apiFetch<Document[]>('/assistant/documents');
      setDocs(res.data);
    } catch (err) {
      showError(err, 'Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/assistant/documents/${id}`, { method: 'DELETE' });
      setDocs(docs.filter(d => d._id !== id));
      showSuccess('Document deleted');
    } catch (err) {
      showError(err, 'Failed to delete document');
    }
  };

  if (loading) return <PageSkeleton />;

  const filtered = filterCategory ? docs.filter(d => d.category === filterCategory) : docs;

  return (
    <div className="space-y-5">
      <Reveal>
        <div className="flex items-center justify-between">
          <PageHeader title="Documents" description="Manage your uploaded documents and certificates" />
          <label className="cursor-pointer">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={spring} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-xs font-semibold shadow-sm">
              {uploading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full" />
              ) : (
                <Upload size={14} />
              )}
              {uploading ? 'Uploading...' : 'Upload'}
            </motion.div>
            <input type="file" className="hidden" onChange={e => void handleUpload(e)} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          </label>
        </div>
      </Reveal>

      {/* Category Filter */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2">
        {['', 'ID_PROOF', 'FEE_RECEIPT', 'MEDICAL', 'OTHER'].map(cat => (
          <motion.button key={cat} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={spring} onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${filterCategory === cat ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-sm' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}
          >
            {cat ? CATEGORY_LABELS[cat]?.label ?? cat : 'All'}
          </motion.button>
        ))}
      </motion.div>

      {/* Document List */}
      {filtered.length === 0 ? (
        <EmptyState variant="compact" title="No documents" description="Upload your first document to get started." />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((doc, i) => {
            const catInfo = CATEGORY_LABELS[doc.category] ?? CATEGORY_LABELS.OTHER;
            const Icon = catInfo.icon;
            return (
              <motion.div key={doc._id} initial={{ opacity: 0, y: 10, scale: 0.98, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <motion.div whileHover={{ y: -2, scale: 1.005 }} transition={spring} className="card-glow accent-line p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/25 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${catInfo.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={16} className={catInfo.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[hsl(var(--foreground))] truncate">{doc.name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 flex items-center gap-1.5">
                            <Clock size={10} />
                            {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            <span className="mx-0.5">·</span>
                            {formatSize(doc.size)}
                          </p>
                        </div>
                        <StatusBadge variant={STATUS_VARIANT[doc.status] ?? 'neutral'}>{doc.status}</StatusBadge>
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        <motion.a href={doc.url} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--accent))]/8 text-[10px] font-semibold text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/14 transition-colors">
                          <Eye size={11} /> View
                        </motion.a>
                        <motion.a href={doc.url} download whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] text-[10px] font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/70 transition-colors">
                          <Download size={11} /> Download
                        </motion.a>
                        <motion.button onClick={() => void handleDelete(doc._id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/8 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/14 transition-colors">
                          <Trash2 size={11} /> Delete
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
