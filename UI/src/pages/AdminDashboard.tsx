import { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  DEFAULT_SERVICES,
  uploadContent, deleteContent, fetchAllContent,
  fetchCategories, addCategory, deleteCategory,
  fetchAchievements, addAchievement, updateAchievement, deleteAchievement,
  fetchAdminStats, fetchInquiries, acceptInquiry, updateInquiryStatus, saveInquiryNotes,
  registerAdmin, updateAdminPassword, updateAdminProfile, verifyToken,
  fetchAllReviewsAdmin, toggleReviewApproval, deleteReview,
  AdminStats, Inquiry as InquiryModel, InquiryStatus, ReviewModel,
  Category, Achievement,
} from '@/lib/api';
import { toast } from 'sonner';
import * as LucideIcons from 'lucide-react';

// Helper to find Lucide Icon by name
function getLucideIcon(iconName: string) {
  const isEmoji = (str: string) => /\p{Emoji}/u.test(str);
  if (isEmoji(iconName)) return null;

  const lucideKey = Object.keys(LucideIcons).find(
    key => key.toLowerCase() === iconName.toLowerCase() || 
           key.toLowerCase() === `${iconName}2`.toLowerCase() ||
           key.toLowerCase() === iconName.replace(/-/g, '').toLowerCase()
  );
  return lucideKey ? (LucideIcons as any)[lucideKey] : null;
}

interface ContentItem {
  _id: string;
  service: string;
  type: 'image' | 'video';
  fileUrl: string;
  description: string;
  createdAt: string;
}

type StatusMessage = { kind: 'success' | 'error'; text: string } | null;

const ICON_OPTIONS = [
  { key: 'building', label: '🏗️ Building' },
  { key: 'trophy',   label: '🏆 Trophy' },
  { key: 'users',    label: '👥 Users' },
  { key: 'hardhat',  label: '⛑️ Hard Hat' },
  { key: 'star',     label: '⭐ Star' },
];

// ─── Tab navigation ───────────────────────────────────────────────
type Tab = 'analytics' | 'inquiries' | 'reviews' | 'media' | 'categories' | 'achievements' | 'security';

// ─── InquiryNotes Sub-Component ──────────────────────────────────
function InquiryNotes({ inq, onSave }: { inq: InquiryModel; onSave: (notes: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(inq.adminNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(notes);
      toast.success('Notes saved!');
      setEditing(false);
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Admin Notes</span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] text-primary hover:underline font-semibold"
          >
            {notes ? 'Edit' : '+ Add Note'}
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2 items-end">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add internal notes about this lead..."
            rows={2}
            className="flex-1 text-xs font-body px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground/50 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {saving ? '...' : 'Save'}
            </button>
            <button
              onClick={() => { setNotes(inq.adminNotes || ''); setEditing(false); }}
              className="px-3 py-1.5 bg-muted text-muted-foreground text-[10px] font-bold rounded-lg hover:bg-muted/80 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : notes ? (
        <p className="text-xs font-body text-foreground/70 bg-muted/50 border border-border px-3 py-2 rounded-lg italic">
          📝 {notes}
        </p>
      ) : null}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('analytics');

  // ── Status ────────────────────────────────────────────────────────
  const [status, setStatus] = useState<StatusMessage>(null);
  const showStatus = (kind: 'success' | 'error', text: string) => {
    setStatus({ kind, text });
    setTimeout(() => setStatus(null), 4000);
  };

  // ── Confirm Modal ─────────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  // ── Stats state ───────────────────────────────────────────────────
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Inquiries state ───────────────────────────────────────────────
  const [inquiriesList, setInquiriesList] = useState<InquiryModel[]>([]);
  const [inqLoading, setInqLoading] = useState(true);

  // ── Reviews state ─────────────────────────────────────────────────
  const [reviewsList, setReviewsList] = useState<ReviewModel[]>([]);
  const [revLoading, setRevLoading] = useState(true);

  // ── Media state ───────────────────────────────────────────────────
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [filterService, setFilterService] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [externalLink, setExternalLink] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Category state ────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState('');

  // ── Achievement state ─────────────────────────────────────────────
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achForm, setAchForm] = useState({ label: '', value: '', suffix: '+', icon: 'trophy', order: '0' });
  const [editingAch, setEditingAch] = useState<Achievement | null>(null);
  const [achLoading, setAchLoading] = useState(false);
  const [deletingAchId, setDeletingAchId] = useState<string | null>(null);

  // ── Security / Accounts state ───────────────────────────────────
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', email: '' });
  const [adminCreating, setAdminCreating] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdUpdating, setPwdUpdating] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [emailUpdating, setEmailUpdating] = useState(false);

  // ── Guard route & Back Button Restriction ───────────────────────
  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/admin-login');
      return;
    }

    if (isAuthenticated) {
      // Prevent back button navigation by pushing a new state
      const preventBack = () => {
        window.history.pushState(null, '', window.location.pathname);
      };

      window.history.pushState(null, '', window.location.pathname);
      window.addEventListener('popstate', preventBack);

      return () => {
        window.removeEventListener('popstate', preventBack);
      };
    }
  }, [isAuthenticated, navigate]);

  // ── Initial data loads ────────────────────────────────────────────
  const loadStats = async () => {
    setStatsLoading(true);
    const data = await fetchAdminStats();
    setStats(data);
    setStatsLoading(false);
  }

  const loadInquiries = async () => {
    try {
      setInqLoading(true);
      const data = await fetchInquiries();
      setInquiriesList(data);
    } catch {
      showStatus('error', 'Failed to load inquiries');
    } finally {
      setInqLoading(false);
    }
  }

  const loadReviews = async () => {
    try {
      setRevLoading(true);
      const data = await fetchAllReviewsAdmin();
      setReviewsList(data);
    } catch {
      showStatus('error', 'Failed to load reviews');
    } finally {
      setRevLoading(false);
    }
  }

  const loadContent = async () => {
    try {
      setLoadingContent(true);
      const data = await fetchAllContent();
      setAllContent(data);
    } catch {
      showStatus('error', 'Failed to load media content');
    } finally {
      setLoadingContent(false);
    }
  };

  const loadCategories = async () => {
    const cats = await fetchCategories();
    setCategories(cats);
    if (cats.length > 0 && !selectedService) setSelectedService(cats[0].name);
  };

  const loadAchievements = async () => {
    const items = await fetchAchievements();
    setAchievements(items);
  };

  const loadProfile = async () => {
    try {
      const data = await verifyToken() as any;
      if (data && typeof data === 'object' && 'email' in data) {
        setAdminEmail(data.email || '');
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      loadInquiries();
      loadReviews();
      loadContent();
      loadCategories();
      loadAchievements();
      loadProfile();
    }
  }, [isAuthenticated]);

  // Keep the upload service selector in sync with category list
  useEffect(() => {
    if (categories.length > 0 && !selectedService) setSelectedService(categories[0].name);
  }, [categories]);

  // ── File preview ──────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  // ── Upload media ──────────────────────────────────────────────────
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) { showStatus('error', 'Please select a category.'); return; }
    
    setUploading(true);
    try {
      if (uploadMode === 'link') {
        if (!externalLink) throw new Error('Please enter a video link.');
        const fd = new FormData();
        fd.append('service', selectedService);
        fd.append('description', description);
        fd.append('link', externalLink);
        await uploadContent(fd);
        showStatus('success', 'Video link added successfully!');
      } else {
        if (!file) throw new Error('Please select a file.');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('service', selectedService);
        fd.append('description', description);
        await uploadContent(fd);
        showStatus('success', 'File uploaded successfully!');
      }

      setFile(null);
      setPreviewUrl(null);
      setExternalLink('');
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadContent();
    } catch (err: any) {
      showStatus('error', err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Delete media ──────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    requestConfirm('Delete Media', 'Delete this item? This action cannot be undone.', async () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      setDeletingId(id);
      try {
        await deleteContent(id);
        setAllContent(prev => prev.filter(c => c._id !== id));
        showStatus('success', 'Item deleted.');
      } catch (err: any) {
        showStatus('error', err.message);
      } finally {
        setDeletingId(null);
      }
    });
  };

  // ── Add category ──────────────────────────────────────────────────
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatLoading(true);
    try {
      const cat = await addCategory(newCatName.trim());
      setCategories(prev => [...prev, cat]);
      setNewCatName('');
      showStatus('success', `Category "${cat.name}" added. It will now appear in Our Services.`);
    } catch (err: any) {
      showStatus('error', err.message);
    } finally {
      setCatLoading(false);
    }
  };

  // ── Delete category ───────────────────────────────────────────────
  const handleDeleteCategory = (id: string, name: string) => {
    requestConfirm(`Delete category "${name}"?`, 'Existing media under this category will remain in the database.', async () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      setDeletingCatId(id);
      try {
        await deleteCategory(id);
        setCategories(prev => prev.filter(c => c._id !== id));
        showStatus('success', `Category "${name}" removed.`);
      } catch (err: any) {
        showStatus('error', err.message);
      } finally {
        setDeletingCatId(null);
      }
    });
  };

  // ── Save achievement (add or update) ─────────────────────────────
  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achForm.label.trim() || !achForm.value) { showStatus('error', 'Label and value are required.'); return; }
    setAchLoading(true);
    try {
      const payload = {
        label: achForm.label.trim(),
        value: Number(achForm.value),
        suffix: achForm.suffix || '+',
        icon: achForm.icon,
        order: Number(achForm.order) || 0,
      };
      if (editingAch) {
        const updated = await updateAchievement(editingAch._id, payload);
        setAchievements(prev => prev.map(a => a._id === updated._id ? updated : a));
        showStatus('success', 'Achievement updated.');
      } else {
        const created = await addAchievement(payload);
        setAchievements(prev => [...prev, created]);
        showStatus('success', 'Achievement added.');
      }
      setAchForm({ label: '', value: '', suffix: '+', icon: 'trophy', order: '0' });
      setEditingAch(null);
    } catch (err: any) {
      showStatus('error', err.message);
    } finally {
      setAchLoading(false);
    }
  };

  const startEditAch = (a: Achievement) => {
    setEditingAch(a);
    setAchForm({ label: a.label, value: String(a.value), suffix: a.suffix, icon: a.icon, order: String(a.order) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAchievement = (id: string) => {
    requestConfirm('Delete Achievement', 'Are you sure you want to delete this achievement stat?', async () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      setDeletingAchId(id);
      try {
        await deleteAchievement(id);
        setAchievements(prev => prev.filter(a => a._id !== id));
        showStatus('success', 'Achievement deleted.');
      } catch (err: any) {
        showStatus('error', err.message);
      } finally {
        setDeletingAchId(null);
      }
    });
  };

  const handleToggleReview = async (id: string) => {
    try {
      const updated = await toggleReviewApproval(id);
      setReviewsList(prev => prev.map(r => r._id === id ? updated : r));
      showStatus('success', updated.approved ? 'Review approved!' : 'Review hidden.');
    } catch {
      showStatus('error', 'Failed to toggle review status');
    }
  }

  const handleDeleteReview = (id: string) => {
    requestConfirm('Delete Review', 'Are you sure you want to delete this review?', async () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      try {
        await deleteReview(id);
        setReviewsList(prev => prev.filter(r => r._id !== id));
        showStatus('success', 'Review deleted.');
      } catch {
        showStatus('error', 'Failed to delete review');
      }
    });
  }

  const handleLogout = () => { logout(); navigate('/'); };

  // ── Security Handlers ─────────────────────────────────────────────
  const handleAddNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.username || !newAdmin.password) return;
    setAdminCreating(true);
    try {
      const res = await registerAdmin(newAdmin.username, newAdmin.password, newAdmin.email);
      showStatus('success', res.message);
      setNewAdmin({ username: '', password: '', email: '' });
    } catch (err: any) {
      showStatus('error', err.message);
    } finally {
      setAdminCreating(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailUpdating(true);
    try {
      const res = await updateAdminProfile({ email: adminEmail });
      showStatus('success', res.message);
      if (res.email !== undefined) {
        setAdminEmail(res.email);
      }
    } catch (err: any) {
      showStatus('error', err.message);
    } finally {
      setEmailUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      showStatus('error', 'New passwords do not match');
      return;
    }
    setPwdUpdating(true);
    try {
      const res = await updateAdminPassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      showStatus('success', res.message);
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showStatus('error', err.message);
    } finally {
      setPwdUpdating(false);
    }
  };

  const allServiceNames = categories.length > 0 ? categories.map(c => c.name) : DEFAULT_SERVICES;
  const displayed = filterService === 'All' ? allContent : allContent.filter(c => c.service === filterService);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-muted-foreground text-sm font-body">Verifying session…</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-sm font-bold text-foreground leading-none">Admin Dashboard</h1>
              <p className="text-[10px] text-muted-foreground font-body leading-none mt-0.5">Shree Constructions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden md:inline text-xs text-muted-foreground font-body bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
              {allContent.length} items
            </span>
            <a href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-body px-2 py-1.5 rounded-lg hover:bg-muted">View Site</a>
            <button onClick={handleLogout} className="text-xs font-semibold text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all font-body border border-red-500/20 hover:border-red-500/40">
              Logout
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-1 pb-0 overflow-x-auto no-scrollbar">
          {([['analytics', 'Analytics'], ['inquiries', 'Client Inquiries'], ['reviews', 'Reviews'], ['media', 'Media Upload'], ['categories', 'Categories'], ['achievements', 'Achievements'], ['security', 'Security']] as [Tab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 font-body whitespace-nowrap ${
                activeTab === tab
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="pt-28 pb-16 max-w-7xl mx-auto px-4 md:px-8">
        {/* ── Status Banner ── */}
        {status && (
          <div className={`mb-6 flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-body animate-fade-in ${
            status.kind === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {status.kind === 'success'
              ? <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              : <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            }
            {status.text}
            <button onClick={() => setStatus(null)} className="ml-auto text-current/60 hover:text-current">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: ANALYTICS
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            {statsLoading ? (
              <div className="flex justify-center py-20">
                <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {/* Row 1: Lead Management KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Total Inquiries */}
                    <div className="bg-card border border-border p-5 rounded-2xl shadow-sm text-center relative overflow-hidden group hover:border-primary/40 transition-all hover:scale-[1.02]">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 relative z-10">Total Leads</h3>
                      <p className="font-display text-4xl font-bold text-foreground relative z-10">{stats?.totalInquiries || 0}</p>
                      <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <svg className="w-16 h-16 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
                      </div>
                    </div>

                    {/* Accepted */}
                    <div className="bg-card border border-border p-5 rounded-2xl shadow-sm text-center relative overflow-hidden group hover:border-green-500/40 transition-all hover:scale-[1.02]">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 relative z-10 text-green-600">Accepted</h3>
                      <p className="font-display text-4xl font-bold text-green-500 relative z-10">{stats?.acceptedCount || 0}</p>
                      <div className="absolute -bottom-2 -right-2 opacity-10">
                        <svg className="w-16 h-16 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                      </div>
                    </div>

                    {/* Rejected */}
                    <div className="bg-card border border-border p-5 rounded-2xl shadow-sm text-center relative overflow-hidden group hover:border-red-500/40 transition-all hover:scale-[1.02]">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 relative z-10 text-red-600">Rejected</h3>
                      <p className="font-display text-4xl font-bold text-red-500 relative z-10">{stats?.rejectedCount || 0}</p>
                      <div className="absolute -bottom-2 -right-2 opacity-10">
                        <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
                      </div>
                    </div>

                    {/* Conversion Rate */}
                    <div className="bg-card border border-border p-5 rounded-2xl shadow-sm text-center relative overflow-hidden group hover:border-purple-500/40 transition-all hover:scale-[1.02] bg-gradient-to-br from-white to-purple-500/5">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 relative z-10 text-purple-600">Conversion Rate</h3>
                      <p className="font-display text-4xl font-bold text-purple-500 relative z-10">{stats?.conversionRate || 0}%</p>
                      <div className="absolute -bottom-2 -right-2 opacity-10">
                        <svg className="w-16 h-16 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Media & Service Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border px-6 py-4 rounded-2xl shadow-sm flex items-center justify-between group hover:border-primary/30 transition-colors">
                      <div>
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Media Content</h3>
                        <p className="text-2xl font-bold text-foreground">{stats?.totalUploads || 0}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      </div>
                    </div>
                    <div className="bg-card border border-border px-6 py-4 rounded-2xl shadow-sm flex items-center justify-between group hover:border-amber-500/30 transition-colors">
                      <div>
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Popular Service</h3>
                        <p className="text-lg font-bold text-amber-600 truncate max-w-[200px]">{stats?.popularService && stats.popularService !== 'N/A' ? stats.popularService : 'None'}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                  <h3 className="font-display text-sm font-bold text-foreground mb-4 border-b border-border pb-3 uppercase tracking-wider">Service Engagement Breakdown</h3>
                  {stats?.serviceStats?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.serviceStats.map(s => (
                        <div key={s.name} className="p-4 bg-muted/30 rounded-xl flex items-center justify-between border border-border hover:border-primary/30 hover:bg-muted/60 transition-all group">
                          <span className="font-semibold text-sm text-foreground flex-1 pr-2 truncate">{s.name}</span>
                          <div className="text-xs text-muted-foreground text-right space-y-1 min-w-[70px]">
                            <div className="flex justify-between gap-3">
                              <span>Media:</span> 
                              <span className="font-bold text-primary">{s.contentCount}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground/60 text-sm">
                      <p>No content or inquiries available yet.</p>
                      <button onClick={() => setActiveTab('media')} className="text-primary hover:underline mt-2 inline-block">Upload content to get started</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: INQUIRIES
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4 animate-fade-in max-w-5xl mx-auto">

            {/* ── Stats Bar ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {([ 
                { label: 'Total Leads', val: inquiriesList.length,                                      color: 'text-foreground',  bg: 'bg-card' },
                { label: 'Pending',     val: inquiriesList.filter(i => i.status === 'pending').length,  color: 'text-amber-500',   bg: 'bg-amber-500/5' },
                { label: 'Discussion',  val: inquiriesList.filter(i => i.status === 'in_discussion').length, color: 'text-purple-500', bg: 'bg-purple-500/5' },
                { label: 'Accepted',    val: inquiriesList.filter(i => i.status === 'accepted').length, color: 'text-green-500',   bg: 'bg-green-500/5' },
                { label: 'Rejected',    val: inquiriesList.filter(i => i.status === 'rejected').length, color: 'text-red-500',     bg: 'bg-red-500/5' },
              ] as const).map(s => (
                <div key={s.label} className={`${s.bg} border border-border rounded-xl p-3 text-center transition-all hover:scale-105`}>
                  <p className={`text-xl font-bold font-display ${s.color}`}>{s.val}</p>
                  <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── Inquiry List ───────────────────────────────────────── */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-primary/5 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">Client Inquiries</h2>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">Manage and track all leads below</p>
                </div>
              </div>

              {inqLoading ? (
                <div className="flex justify-center py-20">
                  <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : inquiriesList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground/50">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <p className="text-sm font-body">No client inquiries received yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {inquiriesList.map(inq => {
                    // --- CRM Logic Helpers ---
                    const updateStatus = async (newStatus: InquiryStatus) => {
                      if (inq.status === newStatus) return true;
                      try {
                        await updateInquiryStatus(inq._id, newStatus);
                        setInquiriesList(prev => prev.map(i => i._id === inq._id ? { ...i, status: newStatus } : i));
                        return true;
                      } catch (err: any) {
                        toast.error(err.message || 'Update failed');
                        return false;
                      }
                    };

                    const handleCallTrigger = async () => {
                      if (inq.status === 'pending') {
                        const success = await updateStatus('in_discussion');
                        if (success) toast.success('Status updated to In Discussion');
                      }
                      window.location.href = `tel:${inq.phone}`;
                    };

                    const handleWhatsAppTrigger = async (forceStatus?: InquiryStatus) => {
                      if (inq.status === 'pending' && !forceStatus) {
                        const success = await updateStatus('in_discussion');
                        if (success) toast.success('Status updated to In Discussion');
                      }
                      window.open(`https://wa.me/91${inq.phone.replace(/\D/g, '')}`, '_blank');
                    };

                    const onAccept = () => {
                      requestConfirm(
                        'Accept Lead & Notify?', 
                        `Are you sure you want to accept ${inq.name}'s lead? This will send an automated notification email to their registered address.`,
                        async () => {
                          setConfirmModal(prev => ({ ...prev, isOpen: false }));
                          const success = await updateStatus('accepted');
                          if (success) {
                            try {
                              await emailjs.send(
                                'service_82yeeui',
                                'template_rph7uyk',
                                {
                                  to_name:  inq.name,
                                  name:     inq.name,
                                  email:    inq.email,
                                  service:  'Inquiry ACCEPTED',
                                  phone:    inq.phone,
                                  message:  `Great news! Your inquiry for ${inq.service} has been ACCEPTED. Our team will contact you shortly to discuss the next steps.`,
                                  time:     new Date().toLocaleString()
                                },
                                'U2XfBhAfW67mv6Tvo'
                              );
                              toast.success('Lead Accepted & Client Notified via Email');
                            } catch (err) {
                              console.error("Email failed:", err);
                              toast.error('Lead Accepted, but email notification failed');
                            }
                          }
                        }
                      );
                    };

                    const onReject = () => {
                      requestConfirm(
                        'Reject Lead?', 
                        'Are you sure you want to reject this lead? No notification will be sent to the client.',
                        async () => {
                          setConfirmModal(prev => ({ ...prev, isOpen: false }));
                          const success = await updateStatus('rejected');
                          if (success) {
                            toast.success('Lead Rejected internally');
                          }
                        }
                      );
                    };

                    return (
                      <div key={inq._id} className="p-5 hover:bg-muted/20 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          
                          {/* Left: Client Info */}
                          <div className="flex-grow min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-foreground text-sm">{inq.name}</h3>
                              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                                {inq.service}
                              </span>
                              {(() => {
                                const config = {
                                  pending:       { label: 'Pending',       color: 'text-amber-600',  bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
                                  in_discussion: { label: 'Discussion',    color: 'text-purple-600', bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
                                  accepted:      { label: 'Accepted',      color: 'text-green-600',  bg: 'bg-green-500/10',   border: 'border-green-500/20' },
                                  rejected:      { label: 'Rejected',      color: 'text-red-600',    bg: 'bg-red-500/10',     border: 'border-red-500/20' },
                                }[inq.status] || { label: inq.status, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
                                
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.color} ${config.bg} ${config.border}`}>
                                      {config.label}
                                    </span>
                                    {(inq.status === 'accepted' || inq.status === 'rejected') && (
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border animate-pulse ${inq.status === 'accepted' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                                        Notified
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-body text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                <span>{inq.phone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <span>{inq.email}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-60">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {new Date(inq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>

                            {inq.message && (
                              <p className="text-xs font-body text-muted-foreground bg-background border border-border px-3 py-2 rounded-lg max-w-xl">
                                💬 {inq.message}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Manual Status:</label>
                              <select
                                value={inq.status}
                                onChange={(e) => updateStatus(e.target.value as InquiryStatus)}
                                className="text-[11px] font-bold bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:ring-2 focus:ring-primary/30 outline-none cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_discussion">Discussion</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>

                            <InquiryNotes inq={inq} onSave={async (notes) => {
                              await saveInquiryNotes(inq._id, notes);
                              setInquiriesList(prev => prev.map(i => i._id === inq._id ? { ...i, adminNotes: notes } : i));
                            }} />
                          </div>

                          {/* Right: Action Buttons */}
                          <div className="flex sm:flex-col gap-2 shrink-0">
                            {inq.status !== 'rejected' && (
                              <>
                                <button
                                  onClick={handleCallTrigger}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-blue-600 transition-all hover:scale-105 shadow-md shadow-blue-500/20"
                                >
                                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                  Call Now
                                </button>

                                <button
                                  onClick={() => handleWhatsAppTrigger()}
                                  className="flex items-center gap-2 px-3 py-2 bg-[#25D366] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#1ebe5d] transition-all hover:scale-105 shadow-md shadow-green-500/20"
                                >
                                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                  WhatsApp
                                </button>

                                {inq.status !== 'accepted' && (
                                  <>
                                    <button
                                      onClick={onAccept}
                                      className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-green-600 transition-all hover:scale-105 shadow-md shadow-green-500/20"
                                    >
                                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                      Accept Lead
                                    </button>

                                    <button
                                      onClick={onReject}
                                      className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-red-600 transition-all hover:scale-105 shadow-md shadow-red-500/20"
                                    >
                                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                      Reject Lead
                                    </button>
                                  </>
                                )}
                              </>
                            )}

                            {inq.status === 'rejected' && (
                              <div className="flex flex-col items-center justify-center p-4 bg-red-50/50 border border-red-100 rounded-xl">
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none">Rejected</span>
                                <p className="text-[8px] text-red-400 mt-1 uppercase">Actions Restricted</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: REVIEWS
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-primary/5 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">Customer Reviews</h2>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">Manage and approve reviews before they appear on the site.</p>
                </div>
                <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                  {reviewsList.length} Total
                </div>
              </div>
              
              <div className="p-0">
                {revLoading ? (
                  <div className="flex justify-center py-20">
                    <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : reviewsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground/50">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    <p className="text-sm font-body">No reviews submitted yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {reviewsList.map(rev => (
                      <div key={rev._id} className="p-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-foreground text-sm">{rev.name}</h3>
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-muted-foreground/30 fill-transparent'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                              ))}
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${rev.approved ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                              {rev.approved ? 'Approved' : 'Pending'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs font-body text-muted-foreground">
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                              {rev.service}
                            </span>
                            <div className="flex items-center gap-1 opacity-70">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          
                          <p className="text-sm font-body text-foreground mt-3 leading-relaxed">
                            "{rev.comment}"
                          </p>
                        </div>
                        
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button onClick={() => handleToggleReview(rev._id)} className={`px-4 py-2 rounded-xl text-xs font-bold font-body transition-all border ${rev.approved ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20'}`}>
                            {rev.approved ? 'Hide Review' : 'Approve Review'}
                          </button>
                          <button onClick={() => handleDeleteReview(rev._id)} className="px-4 py-2 rounded-xl text-xs font-bold font-body text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-all">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: MEDIA UPLOAD
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'media' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 md:gap-8 animate-fade-in">
            {/* Upload Panel */}
            <div className="xl:col-span-2">
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden sticky top-28">
                <div className="px-6 py-5 border-b border-border bg-primary/5">
                  <h2 className="font-display text-base font-bold text-foreground">Upload Media</h2>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">Add images or videos to a service</p>
                </div>
                <form onSubmit={handleUpload} className="p-6 space-y-5">
                  {/* Mode Toggle */}
                  <div className="flex p-1 bg-muted rounded-xl border border-border">
                    <button type="button" onClick={() => setUploadMode('file')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${uploadMode === 'file' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                      File Upload
                    </button>
                    <button type="button" onClick={() => setUploadMode('link')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${uploadMode === 'link' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                      Video Link (YouTube)
                    </button>
                  </div>

                  {/* Input based on mode */}
                  {uploadMode === 'file' ? (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">File (image / video)</label>
                      <div onClick={() => fileInputRef.current?.click()} className="relative border-2 border-dashed border-border hover:border-primary/40 rounded-xl cursor-pointer transition-colors group">
                        {previewUrl ? (
                          <div className="relative w-full aspect-video">
                            {file?.type.startsWith('video/') ? (
                              <video src={previewUrl} className="w-full h-full object-cover rounded-xl" muted preload="metadata" />
                            ) : (
                              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                            )}
                            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-body">Click to change</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-xs font-body">Click to select file</span>
                            <span className="text-[10px] font-body opacity-70">JPG, PNG, MP4, WEBM, MOV</span>
                          </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                      </div>
                      {file && <p className="text-[10px] text-muted-foreground mt-1.5 font-body truncate">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">External Video URL</label>
                      <input 
                        type="url" 
                        value={externalLink} 
                        onChange={e => setExternalLink(e.target.value)} 
                        placeholder="e.g. https://www.youtube.com/embed/..." 
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1.5 font-body italic">
                        Note: For YouTube, use the <strong>Embed</strong> URL (e.g., https://www.youtube.com/embed/VIDEO_ID)
                      </p>
                    </div>
                  )}

                  {/* Service category dropdown (dynamic from DB) */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Service Category</label>
                    <select
                      value={selectedService}
                      onChange={e => setSelectedService(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      {allServiceNames.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-1 font-body">
                      Add more categories in the <button type="button" onClick={() => setActiveTab('categories')} className="text-primary underline">Categories tab</button>.
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Description <span className="normal-case tracking-normal font-normal opacity-60">(optional)</span>
                    </label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Short description of the project…"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/40 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
                  </div>

                  <button type="submit" disabled={uploading || !file}
                    className="w-full py-3.5 rounded-xl bg-primary text-white font-display font-bold text-sm tracking-wide hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {uploading ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Uploading…</>) : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>Upload</>)}
                  </button>
                </form>
              </div>
            </div>

            {/* Gallery */}
            <div className="xl:col-span-3">
              <div className="flex flex-wrap gap-2 mb-5">
                {['All', ...allServiceNames].map(s => (
                  <button key={s} onClick={() => setFilterService(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border font-body ${filterService === s ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'}`}>
                    {s === 'All' ? `All (${allContent.length})` : s}
                  </button>
                ))}
              </div>

              {loadingContent ? (
                <div className="flex justify-center py-20"><svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
              ) : displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground/50">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-sm font-body">No content yet. Upload something above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayed.map(item => (
                     <div key={item._id} className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-300">
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {item.type === 'video'
                           ? <video src={item.fileUrl} className="w-full h-full object-cover" muted preload="metadata" />
                           : <img src={item.fileUrl} alt={item.description || item.service} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        }
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white ${item.type === 'video' ? 'bg-purple-600' : 'bg-primary'}`}>{item.type}</div>
                        <button onClick={() => handleDelete(item._id)} disabled={deletingId === item._id}
                           className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 disabled:opacity-50" title="Delete">
                           {deletingId === item._id
                             ? <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                             : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                           }
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-primary font-body truncate">{item.service}</p>
                        {item.description && <p className="text-[11px] text-muted-foreground font-body mt-0.5 line-clamp-2">{item.description}</p>}
                        <p className="text-[10px] text-muted-foreground/50 font-body mt-1">{new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: CATEGORIES
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'categories' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Add category form */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-primary/5">
                <h2 className="font-display text-base font-bold text-foreground">Add New Service Category</h2>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  New categories appear in <strong>Our Services</strong> section on the website and as upload options in the Media tab.
                </p>
              </div>
              <form onSubmit={handleAddCategory} className="p-6 flex gap-3">
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Interior Design"
                  className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button type="submit" disabled={catLoading || !newCatName.trim()}
                  className="px-6 py-3 rounded-xl bg-primary text-white font-display font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {catLoading ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                  Add
                </button>
              </form>
            </div>

            {/* Category list */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-display text-sm font-bold text-foreground">Current Categories ({categories.length})</h3>
              </div>
              <ul className="divide-y divide-border">
                {categories.length === 0 ? (
                  <li className="px-6 py-8 text-center text-muted-foreground/50 text-sm font-body">No categories yet.</li>
                ) : categories.map(cat => (
                  <li key={cat._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-sm font-body text-foreground">{cat.name}</span>
                    </div>
                    <button onClick={() => handleDeleteCategory(cat._id, cat.name)} disabled={deletingCatId === cat._id}
                      className="text-xs text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all font-body disabled:opacity-40">
                      {deletingCatId === cat._id ? 'Deleting…' : 'Remove'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: ACHIEVEMENTS
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'achievements' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Add / Edit form */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-primary/5">
                <h2 className="font-display text-base font-bold text-foreground">
                  {editingAch ? 'Edit Achievement' : 'Add Achievement Stat'}
                </h2>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  These stats appear in the <strong>Our Achievements</strong> section on the website.
                </p>
              </div>
              <form onSubmit={handleSaveAchievement} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Label */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Label *</label>
                  <input type="text" value={achForm.label} onChange={e => setAchForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Projects Completed"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
                {/* Value */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Value *</label>
                  <input type="number" value={achForm.value} onChange={e => setAchForm(f => ({ ...f, value: e.target.value }))} placeholder="50"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
                {/* Suffix */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Suffix</label>
                  <input type="text" value={achForm.suffix} onChange={e => setAchForm(f => ({ ...f, suffix: e.target.value }))} placeholder="+"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
                {/* Icon */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Icon / Emoji</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={achForm.icon} 
                        onChange={e => setAchForm(f => ({ ...f, icon: e.target.value }))} 
                        placeholder="Paste an emoji (🏗️) or enter key (building, trophy, users, hardhat, star)"
                        className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" 
                      />
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-xl overflow-hidden">
                        {(() => {
                          const Icon = getLucideIcon(achForm.icon);
                          if (Icon) return <Icon className="w-6 h-6 text-primary" />;
                          if (/\p{Emoji}/u.test(achForm.icon)) return achForm.icon;
                          return <LucideIcons.Trophy className="w-6 h-6 text-primary/30" />;
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest self-center mr-2">Presets:</span>
                      {ICON_OPTIONS.map(o => (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => setAchForm(f => ({ ...f, icon: o.key }))}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            achForm.icon === o.key 
                              ? 'bg-primary border-primary text-white shadow-sm' 
                              : 'bg-muted border-border text-muted-foreground hover:border-primary/50'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setAchForm(f => ({ ...f, icon: '👷' }))}
                        className="px-3 py-1.5 rounded-lg border border-border bg-muted text-muted-foreground hover:border-primary/50 text-xs font-medium"
                      >
                        👷 Builder
                      </button>
                      <button
                        type="button"
                        onClick={() => setAchForm(f => ({ ...f, icon: '🏠' }))}
                        className="px-3 py-1.5 rounded-lg border border-border bg-muted text-muted-foreground hover:border-primary/50 text-xs font-medium"
                      >
                        🏠 House
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 italic font-body">Tip: You can use Windows Key + Period (.) to open the emoji picker.</p>
                  </div>
                </div>
                {/* Order */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Display Order</label>
                  <input type="number" value={achForm.order} onChange={e => setAchForm(f => ({ ...f, order: e.target.value }))} placeholder="0"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>

                <div className="sm:col-span-2 flex gap-3">
                  <button type="submit" disabled={achLoading}
                    className="flex-1 py-3.5 rounded-xl bg-primary text-white font-display font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {achLoading ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : null}
                    {editingAch ? 'Update Achievement' : 'Add Achievement'}
                  </button>
                  {editingAch && (
                    <button type="button" onClick={() => { setEditingAch(null); setAchForm({ label: '', value: '', suffix: '+', icon: 'trophy', order: '0' }); }}
                      className="px-5 py-3.5 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm font-body transition-all">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Achievement list */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-display text-sm font-bold text-foreground">Current Achievements ({achievements.length})</h3>
              </div>
              {achievements.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground/50 text-sm font-body">No achievements yet.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6">
                  {achievements.map(a => (
                    <div key={a._id} className="group relative bg-background border border-border rounded-xl p-4 flex flex-col items-center text-center hover:border-primary/30 hover:shadow-md transition-all">
                      <div className="w-10 h-10 flex items-center justify-center mb-1 text-primary">
                        {(() => {
                          const Icon = getLucideIcon(a.icon);
                          if (Icon) return <Icon className="w-6 h-6" />;
                          if (/\p{Emoji}/u.test(a.icon)) return <span className="text-2xl">{a.icon}</span>;
                          return <LucideIcons.Trophy className="w-6 h-6 text-primary/30" />;
                        })()}
                      </div>
                      <span className="font-display text-xl font-bold text-foreground">{a.value}{a.suffix}</span>
                      <span className="text-[10px] text-muted-foreground font-body mt-0.5 uppercase tracking-wide">{a.label}</span>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditAch(a)} className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all" title="Edit">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteAchievement(a._id)} disabled={deletingAchId === a._id} className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-40" title="Delete">
                          {deletingAchId === a._id
                            ? <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: SECURITY
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'security' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Change Password */}
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit">
                <div className="px-6 py-5 border-b border-border bg-primary/5">
                  <h2 className="font-display text-base font-bold text-foreground">Update Password</h2>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">Change your account security credentials.</p>
                </div>
                <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                  {/* Decoy inputs to defeat autofill */}
                  <input type="text" style={{ display: 'none' }} />
                  <input type="password" style={{ display: 'none' }} />
                  
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Current Password</label>
                    <input 
                      type="password" 
                      required
                      name={`curr_pass_${Math.random()}`}
                      value={pwdForm.currentPassword}
                      onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))}
                      autoComplete="new-password"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:ring-2 focus:ring-primary/30 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">New Password</label>
                    <input 
                      type="password" 
                      required
                      name={`new_pass_${Math.random()}`}
                      value={pwdForm.newPassword}
                      onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))}
                      autoComplete="new-password"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:ring-2 focus:ring-primary/30 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Confirm New Password</label>
                    <input 
                      type="password" 
                      required
                      name={`conf_pass_${Math.random()}`}
                      value={pwdForm.confirmPassword}
                      onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      autoComplete="new-password"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:ring-2 focus:ring-primary/30 outline-none" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={pwdUpdating}
                    className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {pwdUpdating ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Profile Email Settings */}
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit">
                <div className="px-6 py-5 border-b border-border bg-primary/5">
                  <h2 className="font-display text-base font-bold text-foreground">Recovery Email Settings</h2>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">Configure recovery email address used for password reset OTP verification.</p>
                </div>
                <form onSubmit={handleUpdateEmail} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recovery Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="admin@example.com"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:ring-2 focus:ring-primary/30 outline-none" 
                    />
                  </div>
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                    <p className="text-[10px] text-muted-foreground font-body leading-relaxed">
                      This email address will receive 6-digit OTP verification codes if you use the <strong>Forgot Password</strong> flow on the login page.
                    </p>
                  </div>
                  <button 
                    type="submit" 
                    disabled={emailUpdating}
                    className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {emailUpdating ? 'Saving...' : 'Update Recovery Email'}
                  </button>
                </form>
              </div>

              {/* Add Admin */}
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit md:col-span-2">
                <div className="px-6 py-5 border-b border-border bg-primary/5">
                  <h2 className="font-display text-base font-bold text-foreground">Add Admin Account</h2>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">Create a new authorized administrator.</p>
                </div>
                <form onSubmit={handleAddNewAdmin} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Decoy inputs to defeat autofill */}
                  <input type="text" style={{ display: 'none' }} />
                  <input type="password" style={{ display: 'none' }} />

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">New Username</label>
                    <input 
                      type="text" 
                      required
                      name={`new_user_${Math.random()}`}
                      value={newAdmin.username}
                      onChange={e => setNewAdmin(f => ({ ...f, username: e.target.value }))}
                      autoComplete="off"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      placeholder="e.g. secondary_admin"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:ring-2 focus:ring-primary/30 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Initial Password</label>
                    <input 
                      type="password" 
                      required
                      name={`init_pass_${Math.random()}`}
                      value={newAdmin.password}
                      onChange={e => setNewAdmin(f => ({ ...f, password: e.target.value }))}
                      autoComplete="new-password"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:ring-2 focus:ring-primary/30 outline-none" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address (Optional)</label>
                    <input 
                      type="email" 
                      name={`init_email_${Math.random()}`}
                      value={newAdmin.email}
                      onChange={e => setNewAdmin(f => ({ ...f, email: e.target.value }))}
                      autoComplete="off"
                      placeholder="e.g. admin2@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-body focus:ring-2 focus:ring-primary/30 outline-none" 
                    />
                  </div>
                  <div className="md:col-span-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <p className="text-[10px] text-amber-600 font-body leading-relaxed">
                      <strong>Caution:</strong> New admins have full access to manage all aspects of the dashboard, including media, categories, and inquiries.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <button 
                      type="submit" 
                      disabled={adminCreating}
                      className="w-full py-3 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {adminCreating ? 'Creating...' : 'Create Admin Account'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* ── Confirm Modal UI ── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-card p-6 rounded-2xl shadow-xl w-[320px] md:w-[400px] border border-border transform transition-all">
            <h2 className="font-display text-lg md:text-xl font-bold text-foreground mb-2">
              {confirmModal.title}
            </h2>
            <p className="font-body text-sm text-muted-foreground mb-6">
              {confirmModal.message}
            </p>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold shadow-sm text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
