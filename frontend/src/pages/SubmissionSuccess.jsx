import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// ─── Canvas Confetti ─────────────────────────────────────────────────────────
function ConfettiCanvas() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = [
      '#f97316', '#ef4444', '#6366f1', '#22c55e',
      '#eab308', '#ec4899', '#06b6d4', '#8b5cf6',
    ];

    const pieces = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: 8 + Math.random() * 10,
      h: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 6,
      opacity: 1,
    }));

    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      pieces.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        p.angle += p.spin;
        if (frame > 180) p.opacity = Math.max(0, p.opacity - 0.008);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (pieces.some(p => p.opacity > 0)) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    // Short delay for dramatic effect
    const timeout = setTimeout(() => { animRef.current = requestAnimationFrame(draw); }, 300);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
      }}
    />
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', prefix = '' }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const inc = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + inc, target);
      setValue(Math.floor(current));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{prefix}{value.toLocaleString()}{suffix}</span>;
}

// ─── Timeline Step ────────────────────────────────────────────────────────────
function TimelineStep({ icon, label, sublabel, status, delay }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const colors = {
    done:    { dot: '#22c55e', glow: '0 0 12px #22c55e88', text: '#4ade80', line: '#22c55e' },
    active:  { dot: '#f97316', glow: '0 0 12px #f9731688', text: '#fb923c', line: '#f97316' },
    pending: { dot: '#334155', glow: 'none',               text: '#475569', line: '#1e293b' },
  };
  const c = colors[status] || colors.pending;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '16px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(-20px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      {/* Dot + line column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: status === 'pending' ? 'rgba(51,65,85,0.4)' : `${c.dot}22`,
          border: `2px solid ${c.dot}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', boxShadow: c.glow,
          animation: status === 'active' ? 'pulseStep 1.5s ease-in-out infinite' : 'none',
        }}>
          {status === 'done' ? '✅' : status === 'active' ? '⏳' : icon}
        </div>
        <div style={{ width: '2px', height: '36px', background: c.line, opacity: 0.4 }} />
      </div>

      {/* Text */}
      <div style={{ paddingTop: '8px', paddingBottom: '16px' }}>
        <div style={{ color: c.text, fontWeight: 700, fontSize: '15px' }}>{label}</div>
        <div style={{ color: '#475569', fontSize: '13px', marginTop: '2px' }}>{sublabel}</div>
      </div>

      <style>{`@keyframes pulseStep { 0%,100%{box-shadow:0 0 12px ${c.dot}88} 50%{box-shadow:0 0 24px ${c.dot}cc} }`}</style>
    </div>
  );
}

// ─── AI Score Card ────────────────────────────────────────────────────────────
function AIScoreCard({ score, people, sentiment }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 600); }, []);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(239,68,68,0.1))',
      border: '1.5px solid rgba(251,146,60,0.4)',
      borderRadius: '20px', padding: '24px',
      marginBottom: '28px',
      boxShadow: '0 0 40px rgba(249,115,22,0.2)',
      opacity: show ? 1 : 0,
      transform: show ? 'scale(1)' : 'scale(0.95)',
      transition: 'all 0.5s ease 0.5s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '24px' }}>🤖</span>
        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em' }}>
          GEMINI AI ANALYSIS
        </span>
      </div>

      {/* Big score */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          fontSize: '56px', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, #f97316, #ef4444)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {show && <AnimatedCounter target={score} />}
        </div>
        <div style={{ paddingBottom: '10px' }}>
          <div style={{ color: '#f97316', fontWeight: 700, fontSize: '14px' }}>/10 Priority</div>
          <div style={{ color: '#64748b', fontSize: '12px' }}>severity score</div>
        </div>
        <div style={{ marginLeft: 'auto', paddingBottom: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            color: 'white', borderRadius: '10px', padding: '6px 14px',
            fontWeight: 800, fontSize: '14px',
          }}>
            🔥 HIGH
          </div>
        </div>
      </div>

      {/* People affected */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px 16px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontSize: '20px' }}>👥</span>
        <div>
          <span style={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>
            {show && <AnimatedCounter target={people} />}
          </span>
          <span style={{ color: '#64748b', fontSize: '14px' }}> people in your area have the same problem</span>
        </div>
      </div>

      {/* Sentiment */}
      <div style={{
        marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px',
        color: '#fb923c', fontSize: '13px', fontWeight: 600,
      }}>
        <span>😠</span>
        <span>Citizen sentiment: <strong>{sentiment}</strong></span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SubmissionSuccess() {
  const locationState = useLocation().state || {};
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => { setTimeout(() => setHeaderVisible(true), 200); }, []);

  const steps = [
    {
      icon: '📨', label: 'Complaint Received',
      sublabel: 'Your report has been logged in our system.',
      status: 'done', delay: 800,
    },
    {
      icon: '🤖', label: 'AI Verified',
      sublabel: 'Gemini AI scanned and confirmed the civic issue.',
      status: 'done', delay: 1200,
    },
    {
      icon: '🏗️', label: 'Forwarded to PWD',
      sublabel: 'Assigned to Public Works Department.',
      status: 'active', delay: 1600,
    },
    {
      icon: '🔧', label: 'Work In Progress',
      sublabel: 'Department team will begin work soon.',
      status: 'pending', delay: 2000,
    },
    {
      icon: '✅', label: 'Resolved',
      sublabel: 'Issue closed. You will be notified.',
      status: 'pending', delay: 2400,
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: '0 0 60px',
    }}>
      <ConfettiCanvas />

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '18px 24px',
        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)',
      }}>
        <h1 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 800 }}>
          People's Priority
        </h1>
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Hero checkmark */}
        <div style={{
          textAlign: 'center', marginBottom: '36px',
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.6s ease',
        }}>
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '44px', margin: '0 auto 20px',
            boxShadow: '0 0 0 16px rgba(34,197,94,0.12), 0 0 0 32px rgba(34,197,94,0.06)',
            animation: 'bounceIn 0.6s ease 0.2s both',
          }}>
            🎉
          </div>
          <h2 style={{
            margin: '0 0 8px', fontSize: '28px', fontWeight: 900,
            background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Complaint Submitted!
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
            Aapki complaint AI ne scan kar li hai. Neta tak pahunch gayi! 🙌
          </p>
        </div>

        {/* Tracking ID */}
        <div style={{
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Tracking ID</span>
          <span style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '14px', letterSpacing: '0.04em' }}>
            #PP-{Math.random().toString(36).substring(2, 8).toUpperCase()}
          </span>
        </div>

        {/* AI Score Card */}
        <AIScoreCard
          score={locationState.severity_score || 8.5}
          people={locationState.people || 340}
          sentiment={locationState.sentiment || 'Highly Frustrated'}
        />

        {/* Timeline */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px', padding: '24px',
          marginBottom: '28px',
          backdropFilter: 'blur(12px)',
        }}>
          <h3 style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em' }}>
            STATUS TIMELINE
          </h3>
          {steps.map((step, i) => (
            <TimelineStep key={i} {...step} />
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            to="/citizen/feed"
            style={{
              display: 'block', textAlign: 'center', padding: '16px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              borderRadius: '14px', color: 'white',
              fontWeight: 700, fontSize: '15px', textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            🗺️ See Community Feed — Others Like You
          </Link>

          <Link
            to="/citizen/dashboard"
            style={{
              display: 'block', textAlign: 'center', padding: '14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px', color: '#94a3b8',
              fontWeight: 600, fontSize: '14px', textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            ➕ Report Another Issue
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes bounceIn {
          0%   { transform: scale(0.3); opacity: 0; }
          50%  { transform: scale(1.08); }
          70%  { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
