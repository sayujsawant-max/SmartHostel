import { Link } from 'react-router-dom';
import ThemeToggle from '@components/ThemeToggle';

const features = [
  {
    title: 'QR Gate Pass',
    desc: 'Generate QR codes for approved leaves. Guards scan to verify and log entry/exit instantly.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v2.25m0 3v.75m3-3h.75m-6 0h.75m2.25-2.25h3v3h-3v-3z" />
      </svg>
    ),
  },
  {
    title: 'Leave Management',
    desc: 'Request day outings or overnight leaves. Wardens approve with one click. Full audit trail.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Complaint Tracking',
    desc: 'Report maintenance issues with priority levels. SLA tracking ensures timely resolution.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
      </svg>
    ),
  },
  {
    title: 'Emergency SOS',
    desc: 'One-tap panic button for students. Warden dashboard shows live alerts with instant acknowledgment.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    title: 'Mess Menu & Ratings',
    desc: 'Weekly menu at a glance. Rate meals with thumbs up/down. Wardens manage menus easily.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" />
      </svg>
    ),
  },
  {
    title: 'Laundry Booking',
    desc: 'Book washing machine slots online. Real-time availability grid. No more waiting in line.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Visitor Management',
    desc: 'Pre-register visitors online. Warden approves, guard checks in/out. Complete visitor log.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: 'Room Change Requests',
    desc: 'Browse available rooms and request transfers. Automatic bed count updates on approval.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: 'PDF Reports',
    desc: 'Download occupancy, complaints, fee collection, and leave summary reports as formatted PDFs.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: 'Analytics Dashboard',
    desc: 'Real-time occupancy, complaints, fees, and activity feed. Visual charts and live metrics.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: 'Dark Mode',
    desc: 'Full dark theme support across every page. Follows system preferences or toggle manually.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    ),
  },
  {
    title: 'Lost & Found',
    desc: 'Community board for lost and found items. Claim items, track returns, help fellow residents.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
];

const roles = [
  { name: 'Student', desc: 'Manage leaves, complaints, meals, laundry, visitors, and more', color: 'bg-blue-500' },
  { name: 'Warden', desc: 'Full dashboard with analytics, approvals, reports, and student oversight', color: 'bg-purple-500' },
  { name: 'Guard', desc: 'QR scanning, gate pass verification, and visitor check-in/out', color: 'bg-green-500' },
  { name: 'Maintenance', desc: 'Task management, repair history, and work order tracking', color: 'bg-orange-500' },
];

const stats = [
  { value: '20+', label: 'Features' },
  { value: '4', label: 'User Roles' },
  { value: '30+', label: 'API Endpoints' },
  { value: '100%', label: 'Dark Mode' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[hsl(var(--background))]/80 border-b border-[hsl(var(--border))]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent))] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[hsl(var(--foreground))]">SmartHostel</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent)/0.08)] via-transparent to-[hsl(var(--accent)/0.05)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--accent))] animate-pulse" />
            Smart Hostel Management System
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[hsl(var(--foreground))] leading-tight tracking-tight">
            Hostel Management,
            <br />
            <span style={{ color: 'hsl(var(--accent))' }}>Reimagined.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto leading-relaxed">
            A complete digital ecosystem for modern hostels. From QR gate passes to laundry booking,
            emergency SOS to PDF reports &mdash; everything your hostel needs in one platform.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity shadow-lg"
            >
              Start Free
            </Link>
            <Link
              to="/rooms"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
            >
              Browse Rooms
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-[hsl(var(--foreground))]">{s.value}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[hsl(var(--muted)/0.3)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))]">
              Everything You Need
            </h2>
            <p className="mt-3 text-lg text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              A comprehensive suite of tools for students, wardens, guards, and maintenance staff.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--accent)/0.5)] hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--accent)/0.1)] flex items-center justify-center text-[hsl(var(--accent))] group-hover:bg-[hsl(var(--accent))] group-hover:text-white transition-colors">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[hsl(var(--foreground))]">{f.title}</h3>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))]">
              Four Roles, One Platform
            </h2>
            <p className="mt-3 text-lg text-[hsl(var(--muted-foreground))]">
              Role-based access control with tailored experiences for every user type.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r) => (
              <div key={r.name} className="p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
                <div className={`w-14 h-14 rounded-full ${r.color} mx-auto flex items-center justify-center text-white text-xl font-bold`}>
                  {r.name[0]}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[hsl(var(--foreground))]">{r.name}</h3>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 bg-[hsl(var(--muted)/0.3)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))]">Built With Modern Tech</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {['React 19', 'TypeScript 5', 'Vite 7', 'Tailwind CSS 4', 'Express 5', 'MongoDB', 'Mongoose 9', 'JWT Auth', 'Zod Validation', 'Swagger API Docs'].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm font-medium text-[hsl(var(--foreground))]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))]">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))]">
            Sign up as a student or log in with one of the demo accounts to explore all features.
          </p>
          <div className="mt-8 p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-left max-w-md mx-auto">
            <h3 className="font-semibold text-[hsl(var(--foreground))] mb-3">Demo Accounts</h3>
            <div className="space-y-2 text-sm">
              {[
                { role: 'Student', email: 'student@smarthostel.dev' },
                { role: 'Warden', email: 'warden@smarthostel.dev' },
                { role: 'Guard', email: 'guard@smarthostel.dev' },
                { role: 'Maintenance', email: 'maintenance@smarthostel.dev' },
              ].map((d) => (
                <div key={d.role} className="flex items-center justify-between py-1.5 border-b border-[hsl(var(--border))] last:border-0">
                  <span className="font-medium text-[hsl(var(--foreground))]">{d.role}</span>
                  <code className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded">{d.email}</code>
                </div>
              ))}
              <p className="text-xs text-[hsl(var(--muted-foreground))] pt-2">
                Password for all: <code className="bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">password123</code>
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">SmartHostel &mdash; Smart Hostel Management System</p>
          <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
            <Link to="/rooms" className="hover:text-[hsl(var(--foreground))] transition-colors">Rooms</Link>
            <Link to="/login" className="hover:text-[hsl(var(--foreground))] transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-[hsl(var(--foreground))] transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
