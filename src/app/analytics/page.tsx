'use client';

import { useBookStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { MehndiDivider, LotusDivider, BlockPrintBorder } from '@/components/IndianPatterns';
import {
  BarChart3,
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  Calendar,
  PieChart,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  getMonth,
  isThisYear,
} from 'date-fns';

export default function AnalyticsPage() {
  const { books, dailyLogs } = useBookStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    const completed = books.filter(b => b.status === 'completed');
    const completedThisYear = completed.filter(b => b.finishDate && isThisYear(new Date(b.finishDate)));
    const reading = books.filter(b => b.status === 'reading');
    const wantToRead = books.filter(b => b.status === 'want-to-read');
    const totalPages = books.reduce((s, b) => s + b.currentPage, 0);
    const totalMinutes = books.reduce(
      (s, b) => s + b.sessions.reduce((ss, sess) => ss + sess.minutesSpent, 0),
      0
    );
    const ratedBooks = completed.filter(b => b.rating);
    const avgRating = ratedBooks.length > 0
      ? (ratedBooks.reduce((s, b) => s + (b.rating || 0), 0) / ratedBooks.length).toFixed(1)
      : '—';

    // Genre breakdown
    const genreCounts: Record<string, number> = {};
    books.forEach(b => {
      if (b.genre) genreCounts[b.genre] = (genreCounts[b.genre] || 0) + 1;
    });
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const maxGenreCount = topGenres.length > 0 ? topGenres[0][1] : 1;

    // Monthly completion for current year
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i;
      const count = completedThisYear.filter(b => {
        if (!b.finishDate) return false;
        return getMonth(new Date(b.finishDate)) === month;
      }).length;
      return { month: format(new Date(currentYear, month), 'MMM'), count };
    });
    const maxMonthly = Math.max(...monthlyData.map(d => d.count), 1);

    // Build a combined daily map from dailyLogs + sessions (to catch any sessions
    // that were logged before the dailyLog pipeline was added)
    const dailyMap: Record<string, { pages: number; minutes: number }> = {};
    dailyLogs.forEach(l => {
      dailyMap[l.date] = { pages: l.pagesRead, minutes: l.minutesSpent };
    });
    // Merge session data as fallback / additive source
    books.forEach(b => {
      b.sessions.forEach(sess => {
        const dateKey = sess.date.split('T')[0];
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = { pages: sess.pagesRead, minutes: sess.minutesSpent };
        } else {
          // Additive: accumulate session data not already in dailyLogs
          dailyMap[dateKey].pages += sess.pagesRead;
          dailyMap[dateKey].minutes += sess.minutesSpent;
        }
      });
    });

    // Reading activity heatmap (last 90 days)
    const last90Days = eachDayOfInterval({
      start: subDays(new Date(), 89),
      end: new Date(),
    }).map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const entry = dailyMap[dateKey];
      return {
        date: dateKey,
        dayLabel: format(date, 'EEE'),
        dateLabel: format(date, 'MMM d'),
        pages: entry?.pages || 0,
        minutes: entry?.minutes || 0,
      };
    });
    const maxActivity = Math.max(...last90Days.map(d => d.pages), 1);

    // Pages per day over selected range
    let rangeStart: Date;
    switch (timeRange) {
      case 'week':
        rangeStart = subDays(new Date(), 6);
        break;
      case 'year':
        rangeStart = startOfYear(new Date());
        break;
      case 'month':
      default:
        rangeStart = subDays(new Date(), 29);
    }
    const rangeDays = eachDayOfInterval({ start: rangeStart, end: new Date() }).map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const entry = dailyMap[dateKey];
      return {
        label: timeRange === 'year' ? format(date, 'MMM') : format(date, 'd'),
        pages: entry?.pages || 0,
      };
    });
    // For year view, aggregate by month
    let chartData = rangeDays;
    if (timeRange === 'year') {
      const monthAgg: Record<string, number> = {};
      rangeDays.forEach(d => {
        monthAgg[d.label] = (monthAgg[d.label] || 0) + d.pages;
      });
      chartData = Object.entries(monthAgg).map(([label, pages]) => ({ label, pages }));
    }
    const maxChartPages = Math.max(...chartData.map(d => d.pages), 1);

    // Top rated books
    const topRated = [...completed]
      .filter(b => b.rating)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    // Longest books
    const longestBooks = [...completed]
      .sort((a, b) => b.totalPages - a.totalPages)
      .slice(0, 5);

    // Author frequency
    const authorCounts: Record<string, number> = {};
    books.forEach(b => {
      authorCounts[b.author] = (authorCounts[b.author] || 0) + 1;
    });
    const topAuthors = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Status breakdown
    const statusBreakdown = [
      { label: 'Reading', count: reading.length, colorVar: 'var(--th-status-reading)' },
      { label: 'Want to Read', count: wantToRead.length, colorVar: 'var(--th-status-want)' },
      { label: 'Completed', count: completed.length, colorVar: 'var(--th-status-completed)' },
      { label: 'DNF', count: books.filter(b => b.status === 'dnf').length, colorVar: 'var(--th-status-dnf)' },
    ].filter(s => s.count > 0);

    return {
      completed,
      completedThisYear,
      totalPages,
      totalMinutes,
      avgRating,
      topGenres,
      maxGenreCount,
      monthlyData,
      maxMonthly,
      last90Days,
      maxActivity,
      chartData,
      maxChartPages,
      topRated,
      longestBooks,
      topAuthors,
      statusBreakdown,
    };
  }, [books, dailyLogs, timeRange, currentYear]);

  const getHeatColor = (value: number, max: number) => {
    if (value === 0) return 'bg-cream';
    const intensity = value / max;
    if (intensity < 0.25) return 'bg-rose-light/40';
    if (intensity < 0.5) return 'bg-rose/40';
    if (intensity < 0.75) return 'bg-plum/30';
    return 'bg-forest/40';
  };

  return (
    <div className="min-h-screen p-4 pb-24 md:p-8 md:pb-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-ink flex items-center gap-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          <BarChart3 className="w-8 h-8 text-gold" />
          Reading Analytics
        </h1>
        <p className="text-ink-muted mt-1">Insights into your reading habits</p>
        <div className="mt-2">
          <MehndiDivider className="h-4 opacity-50" />
        </div>
      </motion.div>

      {/* Decorative lotus divider */}
      <div className="mb-6 -mt-2">
        <LotusDivider className="h-12 opacity-80" />
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
      >
        {[
          { label: 'Books Read', value: stats.completed.length, icon: BookOpen, color: 'text-gold-dark' },
          { label: 'Pages Read', value: stats.totalPages.toLocaleString(), icon: TrendingUp, color: 'text-gold' },
          { label: 'Hours Read', value: Math.round(stats.totalMinutes / 60), icon: Clock, color: 'text-rose' },
          { label: 'Avg Rating', value: stats.avgRating, icon: Star, color: 'text-copper' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="glass-card rounded-2xl p-4"
          >
            <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {stat.value}
            </p>
            <p className="text-xs text-ink-muted">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Pages Over Time Chart */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-5 mb-6 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Pages Read Over Time
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              {stats.chartData.reduce((s, d) => s + d.pages, 0).toLocaleString()} pages this {timeRange}
            </p>
          </div>
          <div className="flex gap-1">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  timeRange === range
                    ? 'bg-gold/10 text-gold-dark'
                    : 'text-ink-muted hover:bg-cream'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-40 flex items-end gap-1">
          {stats.chartData.length > 0 && stats.chartData.some(d => d.pages > 0) ? (
            stats.chartData.map((d, i) => (
              <motion.div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 group relative"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: 0.3 + i * 0.01 }}
              >
                {d.pages > 0 && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-medium text-gold-dark bg-cream/90 px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                    {d.pages}p
                  </div>
                )}
                <div className="w-full flex flex-col items-center justify-end" style={{ height: '120px' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.pages / stats.maxChartPages) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.01 }}
                    className="w-full max-w-[20px] bg-gradient-to-t from-gold to-amber rounded-t-sm min-h-[2px] group-hover:from-gold-dark group-hover:to-gold transition-all"
                    title={`${d.pages} pages`}
                  />
                </div>
                {(timeRange === 'week' || timeRange === 'year' || i % 5 === 0) && (
                  <span className="text-[8px] text-ink-muted">{d.label}</span>
                )}
              </motion.div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-gold-light/30 mx-auto mb-2" />
                <p className="text-sm text-ink-muted">No reading data yet</p>
                <p className="text-xs text-ink-muted/70 mt-1">Log reading sessions or update page progress to see your chart</p>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Block print border */}
      <div className="mb-6">
        <BlockPrintBorder className="h-6 opacity-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Monthly Completions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold text-ink mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            <Calendar className="w-4 h-4 text-copper inline mr-2" />
            Books Completed by Month ({currentYear})
          </h2>
          <div className="space-y-2">
            {stats.monthlyData.map((d, i) => (
              <div key={d.month} className="flex items-center gap-3">
                <span className="text-xs text-ink-muted w-8">{d.month}</span>
                <div className="flex-1 h-5 bg-cream rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.count / stats.maxMonthly) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.03 }}
                    className="h-full bg-gradient-to-r from-amber to-copper rounded-full"
                  />
                </div>
                <span className="text-xs font-medium text-ink w-4 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Genre Distribution */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold text-ink mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            <PieChart className="w-4 h-4 text-amber inline mr-2" />
            Genre Distribution
          </h2>
          {stats.topGenres.length > 0 ? (
            <div className="space-y-2.5">
              {stats.topGenres.map(([genre, count], i) => (
                <div key={genre} className="flex items-center gap-3">
                  <span className="text-xs text-ink truncate w-24">{genre}</span>
                  <div className="flex-1 h-5 bg-cream rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / stats.maxGenreCount) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.35 + i * 0.03 }}
                      className="h-full bg-gradient-to-r from-rose to-rose-light rounded-full"
                    />
                  </div>
                  <span className="text-xs font-medium text-ink w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted text-center py-8">Add books to see genre distribution</p>
          )}
        </motion.section>
      </div>

      {/* Reading Activity Heatmap */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card rounded-2xl p-5 mb-6"
      >
        <h2 className="text-lg font-semibold text-ink mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Reading Activity (Last 90 Days)
        </h2>
        <div className="flex flex-wrap gap-1">
          {stats.last90Days.map((day) => (
            <motion.div
              key={day.date}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: Math.random() * 0.3 }}
              className={`w-3.5 h-3.5 rounded-sm ${getHeatColor(day.pages, stats.maxActivity)} cursor-pointer`}
              title={`${day.dateLabel}: ${day.pages} pages, ${day.minutes} min`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-[10px] text-ink-muted">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-cream" />
          <div className="w-3 h-3 rounded-sm bg-rose-light/40" />
          <div className="w-3 h-3 rounded-sm bg-rose/40" />
          <div className="w-3 h-3 rounded-sm bg-plum/30" />
          <div className="w-3 h-3 rounded-sm bg-forest/40" />
          <span>More</span>
        </div>
      </motion.section>

      {/* Status Breakdown & Top Books */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Status Breakdown */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold text-ink mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Library Breakdown
          </h2>
          {stats.statusBreakdown.length > 0 ? (
            <>
              <div className="flex h-6 rounded-full overflow-hidden mb-3">
                {stats.statusBreakdown.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.count / books.length) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                    style={{ backgroundColor: s.colorVar }}
                    className="h-full"
                    title={`${s.label}: ${s.count}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {stats.statusBreakdown.map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.colorVar }} />
                    <span className="text-xs text-ink-muted">{s.label} ({s.count})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-muted text-center py-8">No books in your library yet</p>
          )}
        </motion.section>

        {/* Top Rated */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold text-ink mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            <Star className="w-4 h-4 text-gold inline mr-2" />
            Top Rated Books
          </h2>
          {stats.topRated.length > 0 ? (
            <div className="space-y-2">
              {stats.topRated.map((book, i) => (
                <div key={book.id} className="flex items-center gap-3">
                  <span className="text-xs text-ink-muted w-4">{i + 1}.</span>
                  <div className="w-6 h-9 rounded bg-gradient-to-br from-bark to-espresso overflow-hidden flex-shrink-0">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-3 h-3 text-gold-light/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">{book.title}</p>
                    <p className="text-[10px] text-ink-muted truncate">{book.author}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className={`w-3 h-3 ${s < (book.rating || 0) ? 'text-gold fill-gold' : 'text-gold-light/20'}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted text-center py-8">Rate books to see your top picks</p>
          )}
        </motion.section>
      </div>

      {/* Top Authors */}
      {stats.topAuthors.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold text-ink mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Most Read Authors
          </h2>
          <div className="flex flex-wrap gap-3">
            {stats.topAuthors.map(([author, count], i) => (
              <motion.div
                key={author}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + i * 0.03 }}
                className="px-4 py-2 glass-card rounded-xl bg-gradient-to-br from-lavender/10 to-plum/5"
              >
                <p className="text-sm font-medium text-ink">{author}</p>
                <p className="text-[10px] text-ink-muted">{count} book{count !== 1 ? 's' : ''}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
