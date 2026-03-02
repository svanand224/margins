'use client';

import { useState, useEffect } from 'react';
import { useAuth, type UserProfile } from '@/lib/auth';
import { useBookStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  BookOpen,
  Clock,
  Trophy,
  Flame,
  Edit3,
  Check,
  LogOut,
  Shield,
  Calendar,
  Library,
  Star,
  ArrowLeft,
  Loader2,
  Trash2,
  Globe,
  Link2,
  Copy,
  Camera,
  Upload,
  Lock,
  Eye,
  // MessageCircle icon removed
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { MehndiDivider, LotusDivider, OrnateFrame, MandalaCorner } from '@/components/IndianPatterns';

const genres = [
  'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',
  'Fantasy', 'Horror', 'Historical Fiction', 'Literary Fiction', 'Biography',
  'Memoir', 'Self-Help', 'Science', 'History', 'Philosophy', 'Poetry',
  'Business', 'Psychology', 'Health', 'Travel', 'Cooking', 'Art',
  'Young Adult', 'Children', 'Comics', 'Religion', 'Technology',
];

export default function ProfilePage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const books = useBookStore((s) => s.books);
  const readerName = useBookStore((s) => s.readerName);
  const setReaderName = useBookStore((s) => s.setReaderName);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formGenre, setFormGenre] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'library'>('profile');

  // Public shelf
  const [shelfPublic, setShelfPublic] = useState(false);
  const [publicSlug, setPublicSlug] = useState('');
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);

  // Library customization
  const [shelfAccent, setShelfAccent] = useState('gold');
  const [shelfShowReading, setShelfShowReading] = useState(true);
  const [shelfShowStats, setShelfShowStats] = useState(true);
  const [shelfBioOverride, setShelfBioOverride] = useState('');
  const [librarySaving, setLibrarySaving] = useState(false);

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormName(profile.reader_name || '');
      setFormBio(profile.bio || '');
      setFormGenre(profile.favorite_genre || '');
      setShelfPublic(profile.shelf_public || false);
      setPublicSlug(profile.public_slug || '');
      setShelfAccent(profile.shelf_accent_color || 'gold');
      setShelfShowReading(profile.shelf_show_currently_reading !== false);
      setShelfShowStats(profile.shelf_show_stats !== false);
      setShelfBioOverride(profile.shelf_bio_override || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        reader_name: formName,
        bio: formBio,
        favorite_genre: formGenre,
      })
      .eq('id', user.id);

    if (!error) {
      setReaderName(formName);
      await refreshProfile();
      setEditing(false);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  const handleTogglePublicShelf = async () => {
    if (!user) return;
    const supabase = createClient();
    const newValue = !shelfPublic;

    // Auto-generate a slug if enabling and none exists
    let slug = publicSlug;
    if (newValue && !slug) {
      slug = (formName || readerName || 'reader')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
      // Add random suffix to avoid collisions
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ shelf_public: newValue, public_slug: slug || null })
      .eq('id', user.id);

    if (!error) {
      setShelfPublic(newValue);
      setPublicSlug(slug);
      await refreshProfile();
    }
  };

  const handleSaveSlug = async () => {
    if (!user || !publicSlug.trim()) return;
    setSlugSaving(true);
    const cleanSlug = publicSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 40);

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ public_slug: cleanSlug })
      .eq('id', user.id);

    if (error) {
      // Likely a unique constraint violation
      setPublicSlug(profile?.public_slug || '');
    } else {
      setPublicSlug(cleanSlug);
      await refreshProfile();
    }
    setSlugSaving(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/user/${publicSlug}`;
    navigator.clipboard.writeText(url);
    setSlugCopied(true);
    setTimeout(() => setSlugCopied(false), 2000);
  };

  const handleSaveLibrary = async () => {
    if (!user) return;
    setLibrarySaving(true);
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({
        shelf_accent_color: shelfAccent,
        shelf_show_currently_reading: shelfShowReading,
        shelf_show_stats: shelfShowStats,
        shelf_bio_override: shelfBioOverride || null,
      })
      .eq('id', user.id);
    await refreshProfile();
    setLibrarySaving(false);
  };

  const accentThemes: Record<string, { label: string; accent: string; accentLight: string }> = {
    gold: { label: 'Gold', accent: 'var(--th-gold)', accentLight: 'var(--th-gold-light)' },
    teal: { label: 'Teal', accent: '#0d9488', accentLight: '#99f6e4' },
    rose: { label: 'Rose', accent: '#e11d48', accentLight: '#fecdd3' },
    forest: { label: 'Forest', accent: '#059669', accentLight: '#a7f3d0' },
    purple: { label: 'Purple', accent: '#7c3aed', accentLight: '#ddd6fe' },
    copper: { label: 'Copper', accent: '#c2410c', accentLight: '#fed7aa' },
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    setAvatarUploading(true);

    // Compress image client-side for faster upload
    const compressImage = (file: File): Promise<Blob> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 256; // Avatar size
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
        };
        img.src = URL.createObjectURL(file);
      });
    };

    const compressedBlob = await compressImage(file);
    const supabase = createClient();

    // Upload to Supabase Storage
    const filePath = `${user.id}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, compressedBlob, { upsert: true, contentType: 'image/jpeg' });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setAvatarUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    await refreshProfile();
    setAvatarUploading(false);
  };

  // Stats
  const totalBooks = books.length;
  const booksRead = books.filter((b) => b.status === 'completed').length;
  const currentlyReading = books.filter((b) => b.status === 'reading').length;
  const totalPages = books.reduce((sum, b) => sum + b.currentPage, 0);
  const avgRating = booksRead > 0
    ? (books.filter(b => b.rating).reduce((sum, b) => sum + (b.rating || 0), 0) /
       books.filter(b => b.rating).length).toFixed(1)
    : '—';
  const favoriteBooks = books.filter((b) => b.favorite).length;

  const stats = [
    { icon: Library, label: 'Total Books', value: totalBooks, color: 'var(--th-gold)' },
    { icon: Trophy, label: 'Books Completed', value: booksRead, color: 'var(--th-forest)' },
    { icon: BookOpen, label: 'Currently Reading', value: currentlyReading, color: 'var(--th-amber)' },
    { icon: Flame, label: 'Pages Read', value: totalPages.toLocaleString(), color: 'var(--th-copper)' },
    { icon: Star, label: 'Avg Rating', value: avgRating, color: 'var(--th-gold-dark)' },
    { icon: Star, label: 'Favorites', value: favoriteBooks, color: 'var(--th-rose)' },
  ];

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const result = await res.json();
      if (result.success) {
        await signOut();
        router.replace('/login');
      } else {
        alert(result.error || 'Account deletion failed. Please try again.');
      }
    } catch (err) {
      // Network error — still try to sign out in case deletion partially succeeded
      await signOut();
      router.replace('/login');
    }
    setSaving(false);
  };

  // Skeleton loader for profile
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-8 pb-24 md:py-12 md:pb-8">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-2 text-ink-muted hover:text-ink transition-colors mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Home</span>
      </Link>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden"
        style={{ boxShadow: 'var(--th-card-shadow)' }}
      >
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 opacity-10">
          <MandalaCorner className="w-24 h-24" />
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={formName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, var(--th-gold), var(--th-amber))',
                  color: 'var(--th-parchment)',
                }}
              >
                {(formName || readerName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {/* Upload overlay */}
            <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              {avatarUploading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={avatarUploading}
              />
            </label>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-forest flex items-center justify-center">
              <Check className="w-3 h-3 text-parchment" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink"
                      style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.9rem' }}
                      placeholder="Your reader name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1 uppercase tracking-wider">Bio</label>
                    <textarea
                      value={formBio}
                      onChange={(e) => setFormBio(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink resize-none"
                      style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.9rem' }}
                      placeholder="Tell the world about your reading journey..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1 uppercase tracking-wider">Favorite Genre</label>
                    <select
                      value={formGenre}
                      onChange={(e) => setFormGenre(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink"
                      style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.9rem' }}
                    >
                      <option value="">Select a genre</option>
                      {genres.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSave}
                      disabled={saving}
                      className="px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-parchment"
                      style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save
                    </motion.button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormName(profile?.reader_name || '');
                        setFormBio(profile?.bio || '');
                        setFormGenre(profile?.favorite_genre || '');
                      }}
                      className="px-5 py-2 rounded-xl text-sm font-medium text-ink-muted hover:text-ink border border-gold-light/30 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="viewing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <h1
                      className="text-2xl font-bold text-ink"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {profile?.reader_name || readerName || 'Reader'}
                    </h1>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-gold-light/10 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {profile?.bio && (
                    <p className="text-ink-muted text-sm mb-2 italic">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{user?.email || '—'}</span>
                    </div>
                    {profile?.favorite_genre && (
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{profile.favorite_genre}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Joined {profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : '—'}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Decorative Divider */}
      <LotusDivider className="h-6 mb-6 opacity-30" />

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-8 glass-card rounded-xl p-1" style={{ boxShadow: 'var(--th-card-shadow)' }}>
        {(['profile', 'library'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={activeTab === tab
              ? { background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))', color: 'var(--th-parchment)' }
              : { color: 'var(--th-ink-muted)' }
            }
          >
            {tab === 'profile' ? <User className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
            {tab === 'profile' ? 'Profile' : 'My Library'}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2
          className="text-lg font-semibold text-ink mb-4"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Your Reading Journey
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass-card rounded-xl p-4 text-center"
            >
              <stat.icon
                className="w-5 h-5 mx-auto mb-2"
                style={{ color: stat.color }}
              />
              <div className="text-xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {stat.value}
              </div>
              <div className="text-xs text-ink-muted mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Divider */}
      <MehndiDivider className="h-4 mb-8 opacity-20" />

      {/* Account Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2
          className="text-lg font-semibold text-ink mb-4"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Account
        </h2>

        {/* Security info */}
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-gold" />
          <div className="flex-1">
            <div className="text-sm font-medium text-ink">Security</div>
            <div className="text-xs text-ink-muted">Your data is encrypted and stored securely</div>
          </div>
        </div>

        {/* Sign Out */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSignOut}
          className="w-full glass-card rounded-xl p-4 flex items-center gap-3 text-left hover:bg-cream/40 transition-colors group"
        >
          <LogOut className="w-5 h-5 text-ink-muted group-hover:text-amber transition-colors" />
          <div className="flex-1">
            <div className="text-sm font-medium text-ink">Sign Out</div>
            <div className="text-xs text-ink-muted">Your reading data is saved to the cloud</div>
          </div>
        </motion.button>

        {/* Delete Account */}
        <div className="pt-6">
          <AnimatePresence>
            {!showDeleteConfirm ? (
              <motion.button
                key="delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-ink-muted/50 hover:text-rose transition-colors underline"
              >
                Delete Account
              </motion.button>
            ) : (
              <motion.div
                key="delete-confirm"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-xl p-4 border border-rose/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-4 h-4 text-rose" />
                  <span className="text-sm font-medium text-rose">Delete your account?</span>
                </div>
                <p className="text-xs text-ink-muted mb-3">
                  This will permanently delete your profile and all reading data. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium text-ink-muted border border-gold-light/30 hover:bg-cream/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium bg-rose/10 text-rose border border-rose/20 hover:bg-rose/20 transition-colors"
                  >
                    Yes, Delete Everything
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
        </>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <>

      {/* Profile Privacy Section - Pinterest Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <h2
          className="text-lg font-semibold text-ink mb-4 flex items-center gap-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          <Shield className="w-5 h-5 text-gold" />
          Profile Privacy
        </h2>

        {/* Privacy Toggle Card */}
        <div className={`glass-card rounded-xl p-5 mb-4 border-2 transition-colors ${
          shelfPublic ? 'border-forest/30' : 'border-gold-light/20'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                shelfPublic 
                  ? 'bg-forest/20 text-forest' 
                  : 'bg-gold-light/20 text-gold'
              }`}>
                {shelfPublic ? <Eye className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <div className="text-base font-semibold text-ink">
                  {shelfPublic ? 'Public Profile' : 'Private Profile'}
                </div>
                <div className="text-sm text-ink-muted mt-1">
                  {shelfPublic 
                    ? 'Anyone with your link can view your profile'
                    : 'Only you can see your reading activity'
                  }
                </div>
              </div>
            </div>
            <button
              onClick={handleTogglePublicShelf}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 flex-shrink-0 ${
                shelfPublic ? 'bg-forest' : 'bg-gold-light/30'
              }`}
            >
              <motion.div
                className="absolute top-1 w-6 h-6 rounded-full bg-parchment shadow-sm"
                animate={{ left: shelfPublic ? '1.75rem' : '0.25rem' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* What's visible when public */}
          <AnimatePresence>
            {shelfPublic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="mt-4 pt-4 border-t border-gold-light/20">
                  <div className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-3">
                    What others can see
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-ink">
                      <Check className="w-4 h-4 text-forest" />
                      Your name & bio
                    </div>
                    <div className="flex items-center gap-2 text-ink">
                      <Check className="w-4 h-4 text-forest" />
                      Book collection
                    </div>
                    <div className="flex items-center gap-2 text-ink">
                      <Check className="w-4 h-4 text-forest" />
                      Reading progress
                    </div>
                    <div className="flex items-center gap-2 text-ink">
                      <Check className="w-4 h-4 text-forest" />
                      Ratings & reviews
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-forest/10 flex items-center gap-2">
                    {/* DM and comments UI removed */}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Share Link Section */}
        <AnimatePresence>
          {shelfPublic && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="glass-card rounded-xl p-4">
                <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                  Your profile URL
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-0 rounded-xl bg-cream/50 border border-gold-light/30 overflow-hidden">
                    <span className="pl-3 text-xs text-ink-muted whitespace-nowrap">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/user/
                    </span>
                    <input
                      type="text"
                      value={publicSlug}
                      onChange={(e) => setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 py-2.5 pr-3 bg-transparent text-ink text-sm border-none outline-none"
                      style={{ fontFamily: "'Lora', Georgia, serif" }}
                      placeholder="your-name"
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveSlug}
                    disabled={slugSaving}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-parchment"
                    style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
                  >
                    {slugSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                  </motion.button>
                </div>
              </div>

              {publicSlug && (
                <div className="flex gap-2">
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCopyLink}
                    className="flex-1 glass-card rounded-xl p-4 flex items-center gap-3 text-left hover:bg-cream/40 transition-colors"
                  >
                    {slugCopied ? (
                      <Check className="w-5 h-5 text-forest" />
                    ) : (
                      <Copy className="w-5 h-5 text-gold" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink">
                        {slugCopied ? 'Link copied!' : 'Copy share link'}
                      </div>
                      <div className="text-xs text-ink-muted truncate">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/user/{publicSlug}
                      </div>
                    </div>
                  </motion.button>
                  <motion.a
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileTap={{ scale: 0.98 }}
                    href={`/user/${publicSlug}`}
                    target="_blank"
                    className="glass-card rounded-xl p-4 flex items-center justify-center hover:bg-cream/40 transition-colors"
                  >
                    <Eye className="w-5 h-5 text-gold" />
                  </motion.a>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Divider */}
      <MehndiDivider className="h-4 mb-8 opacity-20" />

      {/* Library Customization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2
          className="text-lg font-semibold text-ink mb-4 flex items-center gap-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          <Library className="w-5 h-5 text-gold" />
          Customize Library
        </h2>

        <div className="space-y-4">
          {/* Accent Color */}
          <div className="glass-card rounded-xl p-4">
            <label className="block text-xs font-medium text-ink-muted mb-3 uppercase tracking-wider">Accent Color</label>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(accentThemes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setShelfAccent(key)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className="w-10 h-10 rounded-full transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})`,
                      boxShadow: shelfAccent === key ? `0 0 0 3px var(--th-parchment), 0 0 0 5px ${theme.accent}` : 'none',
                      transform: shelfAccent === key ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                  <span className="text-[10px] text-ink-muted">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle: Show Currently Reading */}
          <div className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-gold" />
              <div>
                <div className="text-sm font-medium text-ink">Show Currently Reading</div>
                <div className="text-xs text-ink-muted">Display books you&apos;re currently reading</div>
              </div>
            </div>
            <button
              onClick={() => setShelfShowReading(!shelfShowReading)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 flex-shrink-0 ${
                shelfShowReading ? 'bg-forest' : 'bg-gold-light/30'
              }`}
            >
              <motion.div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-parchment shadow-sm"
                animate={{ left: shelfShowReading ? '1.375rem' : '0.125rem' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Toggle: Show Stats */}
          <div className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-gold" />
              <div>
                <div className="text-sm font-medium text-ink">Show Reading Stats</div>
                <div className="text-xs text-ink-muted">Display your stats on your public library</div>
              </div>
            </div>
            <button
              onClick={() => setShelfShowStats(!shelfShowStats)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 flex-shrink-0 ${
                shelfShowStats ? 'bg-forest' : 'bg-gold-light/30'
              }`}
            >
              <motion.div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-parchment shadow-sm"
                animate={{ left: shelfShowStats ? '1.375rem' : '0.125rem' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Shelf Bio Override */}
          <div className="glass-card rounded-xl p-4">
            <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">Library Bio</label>
            <p className="text-[11px] text-ink-muted mb-2">A custom bio for your public library page (leave blank to use your profile bio)</p>
            <textarea
              value={shelfBioOverride}
              onChange={(e) => setShelfBioOverride(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-cream/50 border border-gold-light/30 text-ink resize-none text-sm"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
              placeholder="Welcome to my reading collection..."
            />
          </div>

          {/* Save button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveLibrary}
            disabled={librarySaving}
            className="w-full px-5 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 text-parchment"
            style={{ background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))' }}
          >
            {librarySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Library Settings
          </motion.button>
        </div>
      </motion.div>

        </>
      )}

      {/* Bottom spacing */}
      <div className="h-12" />
    </div>
  );
}
