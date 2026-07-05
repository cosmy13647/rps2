import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ClipboardList,
  Receipt,
  Zap,
  XCircle,
  BarChart2,
  UserCircle,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Check,
} from "lucide-react";

const FEATURES = [
  {
    Icon: LayoutGrid,
    title: "Table Management",
    desc: "Real-time table status. Know what's open, occupied, or waiting for billing at a glance.",
  },
  {
    Icon: ClipboardList,
    title: "Order Tracking",
    desc: "Place and update orders instantly. Every waiter sees live changes without refreshing.",
  },
  {
    Icon: Receipt,
    title: "Receipt Generation",
    desc: "Auto-generate itemized receipts with subtotals, taxes, and bill IDs in one click.",
  },
  {
    Icon: Zap,
    title: "Real-Time Sync",
    desc: "Socket-powered updates across all devices. Kitchen, cashier, and manager stay in sync.",
  },
  {
    Icon: XCircle,
    title: "Void Requests",
    desc: "Structured void request workflow so cancellations are tracked and approved properly.",
  },
  {
    Icon: BarChart2,
    title: "Revenue Reports",
    desc: "Daily and period revenue breakdowns. Know your best-selling items and peak hours.",
  },
];

const STATS = [
  { value: 500, suffix: "+", label: "Tables Managed Daily" },
  { value: 12000, suffix: "+", label: "Orders Processed" },
  { value: 99, suffix: "%", label: "Uptime" },
  { value: 3, suffix: "s", label: "Avg. Order Entry Time" },
];

const STEPS = [
  { step: "01", title: "Staff logs in", desc: "Each waiter and cashier has their own role-scoped account." },
  { step: "02", title: "Order is placed", desc: "Select table, add items with quantity and price — done in seconds." },
  { step: "03", title: "Kitchen is notified", desc: "Real-time socket update pushes the order to the kitchen display instantly." },
  { step: "04", title: "Bill & receipt", desc: "One click generates a full itemized receipt with a unique bill ID." },
];

function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ value, suffix, label, animate }) {
  const count = useCountUp(value, 1600, animate);
  return (
    <div className="text-center bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
      <div className="text-5xl font-black text-orange-500 mb-2">
        {count}{suffix}
      </div>
      <div className="text-stone-500 text-sm font-medium uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

// Subtle dot-grid background pattern via inline SVG data URI
const dotPattern = {
  backgroundImage: `radial-gradient(circle, #d6d3d1 1px, transparent 1px)`,
  backgroundSize: "24px 24px",
};

export default function LandingPage() {
  const navigate = useNavigate();
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const ActiveIcon = FEATURES[activeFeature].Icon;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-50/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍴</span>
            <span className="font-black text-xl tracking-tight text-stone-900">
              Resto<span className="text-orange-500">POS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-500">
            <a href="#features" className="hover:text-stone-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-stone-900 transition-colors">How it Works</a>
            <a href="#stats" className="hover:text-stone-900 transition-colors">Stats</a>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="hidden md:flex items-center gap-2 bg-stone-900 hover:bg-stone-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Staff Login <ArrowRight size={14} />
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-stone-500 hover:text-stone-900 flex flex-col gap-1.5 p-1"
          >
            <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-stone-200 px-6 py-4 flex flex-col gap-4 text-sm font-medium shadow-lg">
            <a href="#features" onClick={() => setMenuOpen(false)} className="text-stone-500 hover:text-stone-900">Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-stone-500 hover:text-stone-900">How it Works</a>
            <a href="#stats" onClick={() => setMenuOpen(false)} className="text-stone-500 hover:text-stone-900">Stats</a>
            <button onClick={() => navigate("/login")} className="bg-stone-900 text-white font-semibold py-2 rounded-lg">
              Staff Login
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="pt-40 pb-28 px-6 text-center relative" style={dotPattern}>
        {/* Fade out dot pattern at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50/60 via-stone-50/80 to-stone-50 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Handmade stamp badge */}
          <div className="inline-flex items-center gap-2 border-2 border-orange-400 text-orange-500 text-xs font-black px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest rotate-[-0.5deg]">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
            Live POS System
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 text-stone-900">
            The POS your
            <br />
            <span className="text-orange-500 relative inline-block">
              restaurant deserves
              {/* Hand-drawn underline */}
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 400 8" preserveAspectRatio="none">
                <path d="M0 6 Q100 1 200 5 Q300 9 400 3" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
              </svg>
            </span>
          </h1>

          <p className="text-stone-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time orders, table management, receipts, and revenue tracking —
            all in one fast, role-based system built for busy restaurants.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-orange-200"
            >
              Go to Login <ArrowRight size={18} />
            </button>
            <a
              href="#features"
              className="text-stone-500 hover:text-stone-900 font-semibold px-8 py-4 rounded-xl border-2 border-stone-300 hover:border-stone-400 transition-colors"
            >
              See Features
            </a>
          </div>
        </div>

        {/* Mock POS — paper receipt style */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xl shadow-stone-200/80">
            {/* Header bar */}
            <div className="bg-stone-900 px-5 py-3 flex items-center justify-between">
              <span className="text-white font-bold text-sm tracking-wide">RestoPOS — Table View</span>
              <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Live
              </span>
            </div>

            {/* Table grid */}
            <div className="p-6 grid grid-cols-4 gap-3">
              {[
                { t: "T1", s: "occupied", items: 3 },
                { t: "T2", s: "open", items: 0 },
                { t: "T3", s: "billing", items: 5 },
                { t: "T4", s: "occupied", items: 2 },
                { t: "T5", s: "open", items: 0 },
                { t: "T6", s: "open", items: 0 },
                { t: "T7", s: "occupied", items: 4 },
                { t: "T8", s: "billing", items: 7 },
              ].map((table) => (
                <div
                  key={table.t}
                  className={`rounded-xl p-3 text-center text-sm font-bold border-2 transition-all cursor-pointer hover:scale-105 ${
                    table.s === "open"
                      ? "bg-stone-50 border-stone-200 text-stone-400"
                      : table.s === "occupied"
                      ? "bg-orange-50 border-orange-200 text-orange-600"
                      : "bg-green-50 border-green-200 text-green-600"
                  }`}
                >
                  <div className="text-base font-black">{table.t}</div>
                  <div className="text-xs font-medium capitalize mt-0.5 opacity-75">{table.s}</div>
                  {table.items > 0 && (
                    <div className="text-xs mt-1 opacity-60">{table.items} items</div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 px-6 py-3 flex items-center justify-between text-xs text-stone-400 bg-stone-50">
              <span>3 occupied · 3 open · 2 billing</span>
              <span className="text-stone-400 font-medium">Updated just now</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-black uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900">
              Everything you need,
              <br />nothing you don't
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Featured large card */}
            <div className="md:row-span-2 bg-stone-900 text-white rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6">
                  <ActiveIcon size={28} className="text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{FEATURES[activeFeature].title}</h3>
                <p className="text-stone-400 leading-relaxed text-lg">{FEATURES[activeFeature].desc}</p>
              </div>
              <div className="flex gap-2 mt-8">
                {FEATURES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFeature(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeFeature ? "bg-orange-500 w-8" : "bg-stone-600 w-4 hover:bg-stone-500"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Other features */}
            {FEATURES.filter((_, i) => i !== activeFeature).slice(0, 4).map((f, i) => {
              const FIcon = f.Icon;
              return (
                <div
                  key={i}
                  onClick={() => setActiveFeature(FEATURES.indexOf(f))}
                  className="bg-stone-50 border-2 border-stone-200 hover:border-orange-300 rounded-2xl p-6 flex items-start gap-4 cursor-pointer transition-all group hover:bg-orange-50/40"
                >
                  <div className="w-10 h-10 bg-white border-2 border-stone-200 group-hover:border-orange-200 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                    <FIcon size={18} className="text-stone-500 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 text-stone-800 group-hover:text-orange-600 transition-colors">{f.title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-stone-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-black uppercase tracking-widest mb-3">Workflow</p>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900">How it works</h2>
          </div>

          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`flex items-start gap-6 bg-white border-2 rounded-2xl p-6 transition-all ${
                  i === 0 ? "border-orange-300 shadow-sm shadow-orange-100" : "border-stone-200"
                }`}
                style={{ transform: i % 2 === 0 ? "rotate(0deg)" : "rotate(-0.3deg)" }}
              >
                <div className="text-3xl font-black text-stone-200 w-12 shrink-0 leading-none pt-0.5">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 mb-1">{s.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
                <div className="ml-auto shrink-0">
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                    <Check size={14} className="text-orange-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section id="stats" ref={statsRef} className="py-24 px-6 bg-white border-y border-stone-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-black uppercase tracking-widest mb-3">By the numbers</p>
            <h2 className="text-4xl font-black text-stone-900">Built for scale</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <StatCard key={i} {...s} animate={statsVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ───────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-stone-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-orange-500 text-sm font-black uppercase tracking-widest mb-3">Access Control</p>
          <h2 className="text-4xl font-black text-stone-900 mb-3">Role-based access</h2>
          <p className="text-stone-500 mb-12">Every staff member gets exactly the access they need — nothing more.</p>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                role: "Waiter",
                Icon: UserCircle,
                color: "orange",
                perms: ["Place orders", "View table status", "Request voids"],
              },
              {
                role: "Cashier",
                Icon: CreditCard,
                color: "blue",
                perms: ["Generate receipts", "Process payments", "View orders"],
              },
              {
                role: "Manager",
                Icon: ShieldCheck,
                color: "green",
                perms: ["Revenue reports", "Approve voids", "All access"],
              },
            ].map((r, i) => {
              const RIcon = r.Icon;
              const accent = {
                orange: "bg-orange-50 border-orange-200 text-orange-500",
                blue: "bg-blue-50 border-blue-200 text-blue-500",
                green: "bg-green-50 border-green-200 text-green-500",
              }[r.color];
              const iconBg = {
                orange: "bg-orange-100 text-orange-500",
                blue: "bg-blue-100 text-blue-500",
                green: "bg-green-100 text-green-500",
              }[r.color];
              return (
                <div
                  key={r.role}
                  style={{ transform: `rotate(${[-0.4, 0, 0.4][i]}deg)` }}
                  className={`bg-white border-2 rounded-2xl p-6 text-left ${accent} hover:scale-[1.02] transition-transform`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
                    <RIcon size={22} />
                  </div>
                  <h3 className="font-black text-lg text-stone-900 mb-4">{r.role}</h3>
                  <ul className="space-y-2.5">
                    {r.perms.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-stone-600">
                        <Check size={14} className="text-orange-500 shrink-0" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-stone-900">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block border-2 border-orange-400 text-orange-400 text-xs font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            Get Started
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Ready to take orders?</h2>
          <p className="text-stone-400 mb-8 text-lg">Log in and start managing your restaurant in real time.</p>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 mx-auto bg-orange-500 hover:bg-orange-400 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-orange-500/20"
          >
            Staff Login <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-stone-800 bg-stone-900 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-lg">🍴</span>
          <span className="font-black text-stone-300">Resto<span className="text-orange-500">POS</span></span>
        </div>
        <p className="text-stone-600 text-sm">Restaurant Point of Sale System · All rights reserved</p>
      </footer>
    </div>
  );
      }
