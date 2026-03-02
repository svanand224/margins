'use client';

import { useState, Suspense } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, Check, Lock, Eye, EyeOff } from 'lucide-react';
import LotusLogo from '@/components/LotusLogo';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type Step = 'request' | 'sent' | 'reset';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    }>
      <ForgotPasswordInner />
    </Suspense>
  );
}

function ForgotPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // If we have a code in the URL, we're in the reset step
  const hasCode = searchParams.get('code');
  const [step, setStep] = useState<Step>(hasCode ? 'reset' : 'request');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getSupabase = () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }
    return createClient();
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/forgot-password`,
      });
      if (error) throw error;
      setStep('sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute opacity-[0.04]"
            style={{ left: `${20 + i * 20}%`, top: `${15 + (i % 2) * 40}%` }}
            animate={{ y: [0, -15, 0], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          >
            <svg viewBox="0 0 80 80" className="w-16 h-16" fill="var(--th-gold)">
              <path d="M40 10C35 25 33 40 40 60C47 40 45 25 40 10Z" />
              <path d="M40 60C30 50 20 35 18 25C22 35 30 50 40 60Z" />
              <path d="M40 60C50 50 60 35 62 25C58 35 50 50 40 60Z" />
            </svg>
          </motion.div>
        ))}
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
            <LotusLogo className="w-14 h-14" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-ink tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {step === 'reset' ? 'Set New Password' : 'Forgot Password'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-ink-muted text-sm mt-1 italic"
          >
            {step === 'reset'
              ? 'Choose a new password for your account'
              : 'We\u2019ll send you a link to reset it'}
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          layout
          className="glass-card rounded-2xl p-8 shadow-lg"
          style={{ boxShadow: 'var(--th-card-shadow)' }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Request reset */}
            {step === 'request' && (
              <motion.form
                key="request"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequestReset}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted/50 transition-all duration-200"
                      style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-rose/10 border border-rose/20 text-rose text-sm"
                  >
                    {error}
                  </motion.div>
                )}

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
                    <>Send Reset Link</>
                  )}
                </motion.button>
              </motion.form>
            )}

            {/* Step 2: Email sent confirmation */}
            {step === 'sent' && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--th-forest), var(--th-forest-light))' }}
                >
                  <Check className="w-8 h-8 text-parchment" />
                </motion.div>
                <h3
                  className="text-lg font-semibold text-ink mb-2"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Check Your Email
                </h3>
                <p className="text-sm text-ink-muted mb-1">
                  We sent a password reset link to
                </p>
                <p className="text-sm font-medium text-ink mb-4">{email}</p>
                <p className="text-xs text-ink-muted">
                  Click the link in the email to set a new password. The link expires in 1 hour.
                </p>
              </motion.div>
            )}

            {/* Step 3: Actually reset the password */}
            {step === 'reset' && (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
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

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Type it again"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink placeholder:text-ink-muted/50 transition-all duration-200"
                      style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-rose/10 border border-rose/20 text-rose text-sm"
                  >
                    {error}
                  </motion.div>
                )}

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
                    <>Set New Password</>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Back to login */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
