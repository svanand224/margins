'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  BookOpen,
  PlusCircle,
  Target,
  BarChart3,
  Library,
  Sun,
  Moon,
} from 'lucide-react';
import { useThemeStore } from '@/lib/themeStore';
import LotusLogo from './LotusLogo';
import { PaisleyBorder, ChintzFloral } from './IndianPatterns';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/library', icon: Library, label: 'Library' },
  { href: '/add', icon: PlusCircle, label: 'Add Book' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const isNight = theme === 'night';

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 lg:w-64 bg-cream/80 backdrop-blur-xl border-r border-gold-light/30 flex-col z-50 transition-colors duration-500">
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-gold-light/30">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center"
            >
              <LotusLogo className="w-9 h-9 lg:w-11 lg:h-11" />
            </motion.div>
            <div className="hidden lg:block">
              <h1 className="text-lg font-bold text-ink tracking-tight">Margins</h1>
              <p className="text-xs text-ink-muted">reading, remembered.</p>
            </div>
          </Link>
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-4 px-2 lg:px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-gold/20 to-amber/10 text-ink'
                      : 'text-ink-muted hover:text-ink hover:bg-gold-light/10'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold rounded-r-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-gold-dark' : ''}`} />
                  <span className="hidden lg:block text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-gold"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Theme toggle + decorative bottom */}
        <div className="p-4 border-t border-gold-light/30 space-y-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 hover:bg-gold-light/10 group"
            aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
          >
            <motion.div
              className="relative w-10 h-10 lg:w-9 lg:h-9 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: isNight
                  ? 'linear-gradient(135deg, var(--th-gold), var(--th-amber))'
                  : 'linear-gradient(135deg, var(--th-espresso), var(--th-bark))',
              }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                key={theme}
                initial={{ y: isNight ? 20 : -20, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: isNight ? -20 : 20, opacity: 0, rotate: 90 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                {isNight ? (
                  <Sun className="w-4 h-4 text-parchment" />
                ) : (
                  <Moon className="w-4 h-4 text-parchment" />
                )}
              </motion.div>
            </motion.div>
            <span className="hidden lg:block text-sm font-medium text-ink-muted group-hover:text-ink transition-colors">
              {isNight ? 'Day Mode' : 'Night Mode'}
            </span>
          </button>

          <div className="hidden lg:block">
            <div className="mb-2">
              <PaisleyBorder className="h-3 opacity-40" />
            </div>
            <p className="text-xs text-ink-muted italic text-center">&ldquo;A reader lives a thousand lives.&rdquo;</p>
            <p className="text-xs text-gold-dark mt-1 text-center">— George R.R. Martin</p>
            <div className="mt-2 flex justify-center opacity-20">
              <ChintzFloral className="w-8 h-8" />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-cream/90 backdrop-blur-xl border-t border-gold-light/30 z-50 mobile-nav transition-colors duration-500">
        <div className="flex items-center justify-around px-2 pt-2 pb-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`
                    flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl relative
                    ${isActive ? 'text-gold-dark' : 'text-ink-muted'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-gold rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
          {/* Mobile theme toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-ink-muted"
            aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
          >
            {isNight ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="text-[10px] font-medium">{isNight ? 'Day' : 'Night'}</span>
          </motion.button>
        </div>
      </nav>
    </>
  );
}
