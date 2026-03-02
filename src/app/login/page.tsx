'use client';

import { useState, useRef } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, BookOpen, Loader2, ArrowRight, Sparkles, Sun, Moon, AtSign } from 'lucide-react';
import LotusLogo from '@/components/LotusLogo';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useThemeStore } from '@/lib/themeStore';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getSupabase = () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Copy .env.local.example to .env.local and fill in your credentials.');
    }
    return createClient();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const supabase = getSupabase();
      if (mode === 'signup') {
        // Validate username
        const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!cleanUsername || cleanUsername.length < 3) {
          throw new Error('Username must be at least 3 characters (letters, numbers, underscores only).');
        }
        // Check if username is already taken
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .maybeSingle();
        if (existing) {
          throw new Error('That username is already taken. Please choose another.');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              username: cleanUsername,
            },
          },
        });
        if (error) throw error;
        setSuccess('Account created! Check your email for a confirmation link, or if email confirmation is disabled, you are now signed in.');
        // Try to sign in immediately (works if email confirmation is disabled)
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInErr) {
          router.push('/');
          router.refresh();
          return;
        }
      } else {
        // Sign in — determine if input is username or email
        let signInEmail = email;
        if (!email.includes('@')) {
          // Treat as username — look up email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', email.toLowerCase())
            .maybeSingle();
          if (!profile?.email) {
            throw new Error('No account found with that username.');
          }
          signInEmail = profile.email;
        }
        const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Day / Night mode toggle */}
      <motion.button
        onClick={toggleTheme}
        className="absolute top-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center glass-card shadow-md border border-gold-light/30 transition-colors hover:bg-gold/10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Switch to ${theme === 'day' ? 'night' : 'day'} mode`}
        title={`Switch to ${theme === 'day' ? 'night' : 'day'} mode`}
      >
        {theme === 'day' ? (
          <Moon className="w-4.5 h-4.5 text-ink-muted" />
        ) : (
          <Sun className="w-4.5 h-4.5 text-gold" />
        )}
      </motion.button>
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating lotus shapes */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute opacity-[0.04]"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.8,
            }}
          >
            <svg viewBox="0 0 80 80" className="w-20 h-20" fill="var(--th-gold)">
              <path d="M40 10C35 25 33 40 40 60C47 40 45 25 40 10Z" />
              <path d="M40 60C30 50 20 35 18 25C22 35 30 50 40 60Z" />
              <path d="M40 60C50 50 60 35 62 25C58 35 50 50 40 60Z" />
            </svg>
          </motion.div>
        ))}

        {/* Ornamental corners */}
        <svg className="absolute top-0 left-0 w-32 h-32 opacity-[0.06]" viewBox="0 0 100 100">
          <path d="M0 0 Q50 0 50 50 Q50 0 100 0" fill="none" stroke="var(--th-gold)" strokeWidth="1" />
          <circle cx="50" cy="25" r="3" fill="var(--th-gold)" />
        </svg>
        <svg className="absolute top-0 right-0 w-32 h-32 opacity-[0.06] -scale-x-100" viewBox="0 0 100 100">
          <path d="M0 0 Q50 0 50 50 Q50 0 100 0" fill="none" stroke="var(--th-gold)" strokeWidth="1" />
          <circle cx="50" cy="25" r="3" fill="var(--th-gold)" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-32 h-32 opacity-[0.06] -scale-y-100" viewBox="0 0 100 100">
          <path d="M0 0 Q50 0 50 50 Q50 0 100 0" fill="none" stroke="var(--th-gold)" strokeWidth="1" />
          <circle cx="50" cy="25" r="3" fill="var(--th-gold)" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-32 h-32 opacity-[0.06] scale-x-[-1] scale-y-[-1]" viewBox="0 0 100 100">
          <path d="M0 0 Q50 0 50 50 Q50 0 100 0" fill="none" stroke="var(--th-gold)" strokeWidth="1" />
          <circle cx="50" cy="25" r="3" fill="var(--th-gold)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center mb-4"
          >
            <LotusLogo className="w-16 h-16" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-ink tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Margins
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-ink-muted text-sm mt-1 italic"
          >
            reading, remembered.
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          layout
          className="glass-card rounded-2xl p-8 shadow-lg"
          style={{ boxShadow: 'var(--th-card-shadow)' }}
        >
          {/* Mode Toggle */}
          <div className="flex rounded-xl bg-cream/60 p-1 mb-6">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                  mode === m
                    ? 'bg-gradient-to-r from-gold/20 to-amber/10 text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted/50 transition-all duration-200"
                          style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last name"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted/50 transition-all duration-200"
                          style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                      Username
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="choose_a_username"
                        required
                        minLength={3}
                        maxLength={30}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted/50 transition-all duration-200"
                        style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.9rem' }}
                      />
                    </div>
                    <p className="text-[10px] md:text-xs text-ink-muted mt-1">Letters, numbers, and underscores only. This is how others will find you.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                {mode === 'signin' ? 'Email or Username' : 'Email'}
              </label>
              <div className="relative">
                {mode === 'signin' ? (
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                ) : (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                )}
                <input
                  type={mode === 'signup' ? 'email' : 'text'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'signin' ? 'your@email.com or username' : 'your@email.com'}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted/50 transition-all duration-200"
                  style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted/50 transition-all duration-200"
                  style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.9rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error / Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 rounded-lg bg-rose/10 border border-rose/20 text-rose text-sm"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 rounded-lg bg-forest/10 border border-forest/20 text-forest text-sm"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))',
                color: 'var(--th-parchment)',
              }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Enter the Library' : 'Begin Your Journey'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {mode === 'signin' && (
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-xs text-ink-muted hover:text-gold-dark transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            )}
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-ink-muted">
            <div className="h-px w-8 bg-gold-light/30" />
            <BookOpen className="w-3.5 h-3.5" />
            <div className="h-px w-8 bg-gold-light/30" />
          </div>
          <p className="text-xs text-ink-muted mt-3 italic" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            &ldquo;A reader lives a thousand lives before he dies.&rdquo;
          </p>
          <p className="text-xs text-gold-dark mt-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            — George R.R. Martin
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
