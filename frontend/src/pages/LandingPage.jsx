import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: "🍽️",
    title: "Table Management",
    desc: "Real-time table status. Know what's open, occupied, or waiting for billing at a glance.",
  },
  {
    icon: "📋",
    title: "Order Tracking",
    desc: "Place and update orders instantly. Every waiter sees live changes without refreshing.",
  },
  {
    icon: "🧾",
    title: "Receipt Generation",
    desc: "Auto-generate itemized receipts with subtotals, taxes, and bill IDs in one click.",
  },
  {
    icon: "⚡",
    title: "Real-Time Sync",
    desc: "Socket-powered updates across all devices. Kitchen, cashier, and manager stay in sync.",
  },
  {
    icon: "🚫",
    title: "Void Requests",
    desc: "Structured void request workflow so cancellations are tracked and approved properly.",
  },
  {
    icon: "📊",
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
    <div className="text-center">
      <div className="text-5xl font-black text-orange-500 mb-1">
        {count}{suffix}
      </div>
      <div className="text-gray-400 text-sm font-medium uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

const STEPS = [
  { step: "01", title: "Staff logs in", desc: "Each waiter and cashier has their own role-scoped account." },
  { step: "02", title: "Order is placed", desc: "Select table, add items with quantity and price — done in seconds." },
  { step: "03", title: "Kitchen is notified", desc: "Real-time socket update pushes the order to the kitchen display instantly." },
  { step: "04", title: "Bill & receipt", desc: "One click generates a full itemized receipt with a unique bill ID." },
];

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

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍴</span>
            <span className="font-black text-xl tracking-tight">
              Resto<span className="text-orange-500">POS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#stats" className="hover:text-white transition-colors">Stats</a>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="hidden md:block bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Staff Login →
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-6 h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800 px-6 py-4 flex flex-col gap-4 text-sm font-medium">
            <a href="#features" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white">Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white">How it Works</a>
            <a href="#stats" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white">Stats</a>
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-500 text-white font-semibold py-2 rounded-lg"
            >
              Staff Login →
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="pt-40 pb-28 px-6 text-center relative">
        {/* Glow */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
            Live POS System
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            The POS your
            <br />
            <span className="text-orange-500">restaurant deserves</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time orders, table management, receipts, and revenue tracking —
            all in one fast, role-based system built for busy restaurants.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-orange-500/25"
            >
              Go to Login →
            </button>
            <a
              href="#features"
              className="text-gray-400 hover:text-white font-semibold px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors"
            >
              See Features
            </a>
          </div>
        </div>

        {/* Mock POS terminal */}
        <div className="mt-20 max-w-3xl mx-auto relative">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
            {/* Terminal bar */}
            <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-gray-500 text-xs font-mono">RestoPOS — Table View</span>
            </div>
            {/* Mock content */}
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
                  className={`rounded-xl p-3 text-center text-sm font-bold border transition-all cursor-pointer hover:scale-105 ${
                    table.s === "open"
                      ? "bg-gray-800 border-gray-600 text-gray-400"
                      : table.s === "occupied"
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                      : "bg-green-500/15 border-green-500/40 text-green-400"
                  }`}
                >
                  <div className="text-lg">{table.t}</div>
                  <div className="text-xs font-normal capitalize mt-0.5 opacity-75">
                    {table.s}
                  </div>
                  {table.items > 0 && (
                    <div className="text-xs mt-1 opacity-60">{table.items} items</div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div className="border-t border-gray-700 px-6 py-3 flex items-center justify-between text-xs text-gray-500">
              <span>🟢 3 occupied · 3 open · 2 billing</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-black">Everything you need,<br />nothing you don't</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Featured highlight */}
            <div className="md:row-span-2 bg-gray-900 border border-gray-700 rounded-2xl p-8 flex flex-col justify-between group hover:border-orange-500/40 transition-colors">
              <div>
                <div className="text-5xl mb-6">{FEATURES[activeFeature].icon}</div>
                <h3 className="text-2xl font-bold mb-3">{FEATURES[activeFeature].title}</h3>
                <p className="text-gray-400 leading-relaxed text-lg">{FEATURES[activeFeature].desc}</p>
              </div>
              <div className="flex gap-2 mt-8">
                {FEATURES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFeature(i)}
                    className={`h-1.5 rounded-full transition-all ${i === activeFeature ? "bg-orange-500 w-8" : "bg-gray-700 w-4 hover:bg-gray-500"}`}
                  />
                ))}
              </div>
            </div>

            {/* Other features grid */}
            {FEATURES.filter((_, i) => i !== activeFeature).slice(0, 4).map((f, i) => (
              <div
                key={i}
                onClick={() => setActiveFeature(FEATURES.indexOf(f))}
                className="bg-gray-900 border border-gray-700 rounded-2xl p-6 flex items-start gap-4 hover:border-orange-500/30 cursor-pointer transition-colors group"
              >
                <div className="text-2xl">{f.icon}</div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-orange-400 transition-colors">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest mb-3">Workflow</p>
            <h2 className="text-4xl md:text-5xl font-black">How it works</h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gray-800 -translate-x-1/2 hidden md:block" />

            <div className="space-y-12">
              {STEPS.map((s, i) => (
                <div key={i} className={`flex items-start gap-6 md:gap-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  <div className={`flex-1 ${i % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16"}`}>
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-orange-500/30 transition-colors">
                      <div className="text-orange-500 text-xs font-black tracking-widest mb-2">STEP {s.step}</div>
                      <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="hidden md:flex w-0 relative justify-center">
                    <div className="absolute top-6 -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full border-4 border-gray-950 z-10" />
                  </div>

                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section id="stats" ref={statsRef} className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest mb-3">By the numbers</p>
            <h2 className="text-4xl font-black">Built for scale</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {STATS.map((s, i) => (
              <StatCard key={i} {...s} animate={statsVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ───────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest mb-3">Access Control</p>
          <h2 className="text-4xl font-black mb-4">Role-based access</h2>
          <p className="text-gray-400 mb-12">Every staff member gets exactly the access they need — nothing more.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { role: "Waiter", icon: "👨‍🍳", perms: ["Place orders", "View table status", "Request voids"] },
              { role: "Cashier", icon: "💳", perms: ["Generate receipts", "Process payments", "View orders"] },
              { role: "Manager", icon: "📊", perms: ["Revenue reports", "Approve voids", "All access"] },
            ].map((r) => (
              <div key={r.role} className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-left hover:border-orange-500/30 transition-colors">
                <div className="text-3xl mb-3">{r.icon}</div>
                <h3 className="font-bold text-lg mb-4">{r.role}</h3>
                <ul className="space-y-2">
                  {r.perms.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="text-orange-500">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/20 rounded-3xl p-12">
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-4xl font-black mb-4">Ready to take orders?</h2>
            <p className="text-gray-400 mb-8">Log in and start managing your restaurant in real time.</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-orange-500/25"
            >
              Staff Login →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-lg">🍴</span>
          <span className="font-black text-gray-400">Resto<span className="text-orange-500">POS</span></span>
        </div>
        Restaurant Point of Sale System · All rights reserved
      </footer>
    </div>
  );
}
