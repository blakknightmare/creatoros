import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';

const API_BASE = '/api';

interface Project {
  id: number;
  content_type: string;
  topic: string | null;
  generated_content: string;
  created_at: string;
}

interface CalendarEvent {
  id: number;
  user_id: number;
  project_id: number;
  scheduled_date: string;
  platform: string | null;
  notes: string | null;
  created_at: string;
  content_type: string;
  topic: string | null;
  generated_content: string;
}

const TYPE_ICONS: Record<string, string> = {
  instagram: '📸',
  linkedin: '💼',
  x_post: '🐦',
  blog_post: '📝',
  email_newsletter: '📧',
  hooks: '🪝',
  ctas: '🎯',
  hashtags: '#️⃣',
};

const TYPE_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x_post: 'X Post',
  blog_post: 'Blog Post',
  email_newsletter: 'Newsletter',
  hooks: 'Hooks',
  ctas: 'CTAs',
  hashtags: 'Hashtags',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // Returns 0=Sun, 1=Mon, ..., 6=Sat
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function formatMonthKey(year: number, month: number): string {
  const m = String(month + 1).padStart(2, '0');
  return `${year}-${m}-${m}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

export default function Calendar() {
  const { tier, token } = useAuth();
  const isPaid = tier === 'pro' || tier === 'agency';

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [draggedProjectId, setDraggedProjectId] = useState<number | null>(null);
  const [removeConfirmId, setRemoveConfirmId] = useState<number | null>(null);

  // For detecting if we need to reload
  const sidebarRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const monthKey = formatMonthKey(currentYear, currentMonth);
      const res = await fetch(`${API_BASE}/calendar?month=${monthKey}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch {
      setError('Failed to load calendar events.');
    }
    setLoadingEvents(false);
  }, [currentYear, currentMonth, token]);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      // Fetch all projects (up to a high limit so we get everything)
      const res = await fetch(`${API_BASE}/projects?limit=500&sort=newest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {
      // ignore
    }
    setLoadingProjects(false);
  }, [token]);

  useEffect(() => {
    if (isPaid) {
      fetchEvents();
      fetchProjects();
    }
  }, [isPaid, fetchEvents, fetchProjects]);

  // Compute scheduled project IDs for the current month
  const scheduledProjectIds = new Set(events.map((e) => e.project_id));

  // Unscheduled = all projects not yet on calendar
  const unscheduledProjects = projects.filter((p) => !scheduledProjectIds.has(p.id));

  // Group events by date
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach((e) => {
    if (!eventsByDate[e.scheduled_date]) {
      eventsByDate[e.scheduled_date] = [];
    }
    eventsByDate[e.scheduled_date].push(e);
  });

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Drag handlers for project cards
  const handleDragStart = (projectId: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(projectId));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedProjectId(projectId);
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
    setDragOverDate(null);
  };

  const handleDateDragOver = (dateKey: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateKey);
  };

  const handleDateDragLeave = (dateKey: string) => () => {
    if (dragOverDate === dateKey) {
      setDragOverDate(null);
    }
  };

  const handleDateDrop = (dateKey: string) => async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDate(null);
    setDraggedProjectId(null);

    const projectId = parseInt(e.dataTransfer.getData('text/plain'));
    if (!projectId) return;

    // Check if already scheduled for this date
    const already = events.find((ev) => ev.project_id === projectId && ev.scheduled_date === dateKey);
    if (already) return;

    try {
      const res = await fetch(`${API_BASE}/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          scheduled_date: dateKey,
        }),
      });

      if (res.ok) {
        // Refresh events and recalculate unscheduled
        await fetchEvents();
      }
    } catch {
      // ignore
    }
  };

  const handleRemoveEvent = async (eventId: number) => {
    try {
      const res = await fetch(`${API_BASE}/calendar/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      }
    } catch {
      // ignore
    }
    setRemoveConfirmId(null);
  };

  const truncateContent = (content: string, maxLen: number = 60) => {
    return content.length > maxLen ? content.slice(0, maxLen).trim() + '...' : content;
  };

  // ---- Free tier / upgrade prompt ----
  if (!isPaid) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="text-6xl mb-6">📅</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">AI Content Calendar</h1>
          <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
            Plan your posting schedule effortlessly. Drag and drop your generated
            content onto dates, see your month at a glance, and never miss a
            posting day.
          </p>

          <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-purple-50 p-8 mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🔒</span>
              <h2 className="text-xl font-semibold text-slate-800">Pro Feature</h2>
            </div>
            <p className="text-slate-600 mb-6">
              Upgrade to Pro to access the AI Content Calendar — plan your posting
              schedule effortlessly. Just £19/month.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                View Plans
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-3 text-sm font-semibold text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ---- Calendar content ----
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const totalCells = firstDay + daysInMonth;
  const numRows = Math.ceil(totalCells / 7);
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null); // empty padding
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }
  // Pad to full rows
  while (cells.length < numRows * 7) {
    cells.push(null);
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Content Calendar</h1>
            <p className="text-slate-500 mt-1">Plan your posting schedule — drag projects onto dates.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                title="Previous month"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="px-3 py-1.5 text-sm font-semibold text-slate-700 min-w-[140px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                title="Next month"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm font-medium text-brand-600 border border-brand-300 rounded-lg hover:bg-brand-50 transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar grid */}
          <div className="flex-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              {cells.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[100px] border border-slate-100 bg-slate-50/50"
                    />
                  );
                }

                const dateKey = formatDateKey(currentYear, currentMonth, day);
                const dayEvents = eventsByDate[dateKey] || [];
                const isTodayDate = isToday(currentYear, currentMonth, day);
                const isDragOver = dragOverDate === dateKey;

                return (
                  <div
                    key={dateKey}
                    className={`min-h-[100px] border border-slate-100 p-1.5 transition-colors relative ${
                      isDragOver
                        ? 'bg-brand-50 ring-2 ring-brand-400 ring-inset'
                        : 'hover:bg-slate-50'
                    }`}
                    onDragOver={handleDateDragOver(dateKey)}
                    onDragLeave={handleDateDragLeave(dateKey)}
                    onDrop={handleDateDrop(dateKey)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          isTodayDate
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-brand-500 font-medium">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          className="group relative text-[10px] px-1.5 py-0.5 rounded bg-brand-50 border border-brand-100 text-brand-800 cursor-default leading-tight"
                          title={ev.generated_content.slice(0, 100)}
                        >
                          <span className="mr-1">{TYPE_ICONS[ev.content_type] || '📄'}</span>
                          <span className="truncate block">
                            {ev.topic || truncateContent(ev.generated_content, 40)}
                          </span>
                          {/* X to remove */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRemoveConfirmId(ev.id);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-100 text-red-600 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            title="Remove from calendar"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-slate-400 pl-1">
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {loadingEvents && (
              <div className="text-center py-4 text-sm text-slate-400">Loading events...</div>
            )}
          </div>

          {/* Sidebar — unscheduled projects */}
          <div className="lg:w-80 flex-shrink-0" ref={sidebarRef}>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm sticky top-24">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Unscheduled Content
                <span className="text-xs font-normal text-slate-400 ml-auto">
                  {unscheduledProjects.length}
                </span>
              </h2>

              {loadingProjects ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : unscheduledProjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-xs text-slate-400">
                    All projects are scheduled! Generate more content to fill your calendar.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {unscheduledProjects.map((project) => (
                    <div
                      key={project.id}
                      draggable
                      onDragStart={handleDragStart(project.id)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-grab active:cursor-grabbing hover:border-brand-300 hover:bg-brand-50 transition-colors ${
                        draggedProjectId === project.id ? 'opacity-50 ring-2 ring-brand-300' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{TYPE_ICONS[project.content_type] || '📄'}</span>
                        <span className="text-xs font-medium text-slate-600">
                          {TYPE_LABELS[project.content_type] || project.content_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {project.topic || truncateContent(project.generated_content, 60)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Drag a project from this sidebar onto a date in the calendar to schedule it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remove confirmation modal */}
      {removeConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Remove from calendar?</h3>
            <p className="text-sm text-slate-500 mb-6">
              This will remove the project from this date. The project itself will still be saved on your dashboard.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRemoveConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveEvent(removeConfirmId!)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </AppLayout>
  );
}
