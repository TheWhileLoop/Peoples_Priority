import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// ─── Mock Data (shown if backend is offline) ─────────────────────────────────
const MOCK_COMPLAINTS = [
  {
    id: 'mock-1',
    category: 'Roads',
    icon: '🛣️',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.3)',
    title: 'Deep potholes causing accidents',
    ward_name: 'Andheri East, Mumbai',
    severity: 9.2,
    mentions: 450,
    sentiment: '😠 Highly Frustrated',
    time: '2 hours ago',
    snippet: 'Bahut bade gadd hain raat ko accident ho sakta hai. Kai log injury ho chuke hain.',
  },
  {
    id: 'mock-2',
    category: 'Water',
    icon: '💧',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.3)',
    title: 'No water supply since 3 days',
    ward_name: 'Borivali West, Mumbai',
    severity: 8.7,
    mentions: 312,
    sentiment: '😤 Frustrated',
    time: '5 hours ago',
    snippet: 'Teen din se paani nahi aa raha. Bacche pyaase hain. Tanker bhi nahi bheja.',
  },
  {
    id: 'mock-3',
    category: 'Electricity',
    icon: '💡',
    color: '#eab308',
    glow: 'rgba(234,179,8,0.3)',
    title: 'Street lights not working',
    ward_name: 'Dharavi, Mumbai',
    severity: 7.1,
    mentions: 89,
    sentiment: '😟 Concerned',
    time: '1 day ago',
    snippet: 'Puri gali mein andhera hai. Ladies ko bahut darr lagta hai raat ko bahar nikalna.',
  },
  {
    id: 'mock-4',
    category: 'Garbage',
    icon: '🗑️',
    color: '#84cc16',
    glow: 'rgba(132,204,22,0.3)',
    title: 'Garbage not collected for a week',
    ward_name: 'Kurla East, Mumbai',
    severity: 6.5,
    mentions: 67,
    sentiment: '😷 Disgusted',
    time: '1 day ago',
    snippet: 'Kachra nahi utha gaya ek hafte se. Badbu aa rahi hai. Binari bhar gayi.',
  },
  {
    id: 'mock-5',
    category: 'Roads',
    icon: '🛣️',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.3)',
    title: 'Broken footpath near school',
    ward_name: 'Bandra West, Mumbai',
    severity: 5.8,
    mentions: 34,
    sentiment: '😐 Neutral',
    time: '2 days ago',
    snippet: 'School ke paas ka phutpath toot gaya hai. Bacchon ko school jaane mein dikkat ho rahi hai.',
  },
];

// ─── Severity Badge ──────────────────────────────────────────────────────────
function SeverityBadge({ score }) {
  const color = score >= 8 ? '#ef4444' : score >= 6 ? '#f97316' : '#eab308';
  const label = score >= 8 ? '🔥 Critical' : score >= 6 ? '⚠️ High' : '📌 Medium';
  return (
    <span style={{
      background: `${color}22`, border: `1px solid ${color}55`,
      color, borderRadius: '8px', padding: '3px 10px',
      fontSize: '12px', fontWeight: 700,
    }}>
      {label} {score}/10
    </span>
  );
}

// ─── Swipe Card ──────────────────────────────────────────────────────────────
function SwipeCard({ complaint, onUpvote, onSkip, isTop }) {
  const cardRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const handlePointerDown = (e) => {
    if (!isTop) return;
    isDragging.current = true;
    startX.current = e.clientX;
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    currentX.current = e.clientX - startX.current;
    setDragX(currentX.current);
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dx = currentX.current;

    if (dx > 90) {
      // Swipe right = Upvote
      setSwiping(true);
      setTimeout(() => { setSwiping(false); onUpvote(complaint); }, 350);
    } else if (dx < -90) {
      // Swipe left = Skip
      setSwiping(true);
      setTimeout(() => { setSwiping(false); onSkip(complaint.id); }, 350);
    } else {
      setDragX(0);
    }
    currentX.current = 0;
  };

  const rotation = isTop ? `rotate(${dragX * 0.04}deg)` : 'none';
  const showRight = isTop && dragX > 40;
  const showLeft  = isTop && dragX < -40;

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        width: '100%',
        borderRadius: '28px',
        background: 'linear-gradient(145deg, rgba(30,27,75,0.95), rgba(15,12,41,0.98))',
        border: `1.5px solid ${complaint.color}33`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${complaint.glow}`,
        cursor: isTop ? 'grab' : 'default',
        userSelect: 'none',
        transform: `translateX(${dragX}px) ${rotation}`,
        transition: swiping ? 'transform 0.35s ease' : isDragging.current ? 'none' : 'transform 0.3s ease',
        opacity: isTop ? 1 : 0.6,
        scale: isTop ? '1' : '0.95',
        top: isTop ? '0' : '16px',
        zIndex: isTop ? 2 : 1,
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}
    >
      {/* Swipe overlays */}
      {showRight && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '28px',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.25), transparent)',
          border: '2px solid rgba(34,197,94,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          padding: '0 30px', zIndex: 5,
          transition: 'opacity 0.15s',
        }}>
          <div style={{
            background: '#22c55e', borderRadius: '50%', padding: '12px',
            fontSize: '28px', boxShadow: '0 0 20px rgba(34,197,94,0.6)',
          }}>✅</div>
        </div>
      )}
      {showLeft && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '28px',
          background: 'linear-gradient(135deg, transparent, rgba(239,68,68,0.25))',
          border: '2px solid rgba(239,68,68,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 30px', zIndex: 5,
        }}>
          <div style={{
            background: '#ef4444', borderRadius: '50%', padding: '12px',
            fontSize: '28px', boxShadow: '0 0 20px rgba(239,68,68,0.6)',
          }}>❌</div>
        </div>
      )}

      {/* Card header strip */}
      <div style={{
        height: '5px',
        background: `linear-gradient(90deg, ${complaint.color}, transparent)`,
      }} />

      <div style={{ padding: '24px' }}>
        {/* Category + Time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: `${complaint.color}15`, border: `1px solid ${complaint.color}30`,
            borderRadius: '10px', padding: '6px 12px',
          }}>
            <span style={{ fontSize: '18px' }}>{complaint.icon}</span>
            <span style={{ color: complaint.color, fontWeight: 700, fontSize: '13px' }}>
              {complaint.category}
            </span>
          </div>
          <span style={{ color: '#475569', fontSize: '12px' }}>{complaint.time}</span>
        </div>

        {/* Title */}
        <h3 style={{ margin: '0 0 8px', color: 'white', fontSize: '20px', fontWeight: 800, lineHeight: 1.3 }}>
          {complaint.title}
        </h3>

        {/* Ward */}
        <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          📍 {complaint.ward_name}
        </p>

        {/* Snippet */}
        <p style={{
          margin: '0 0 20px', color: '#94a3b8', fontSize: '14px', lineHeight: 1.6,
          background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
          padding: '12px', borderLeft: `3px solid ${complaint.color}55`,
        }}>
          "{complaint.snippet}"
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <SeverityBadge score={complaint.severity} />
          <span style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', borderRadius: '8px', padding: '3px 10px',
            fontSize: '12px', fontWeight: 600,
          }}>
            👥 {complaint.mentions} affected
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', borderRadius: '8px', padding: '3px 10px',
            fontSize: '12px', fontWeight: 600,
          }}>
            {complaint.sentiment}
          </span>
        </div>

        {/* Action row */}
        {isTop && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => onSkip(complaint.id)}
              style={{
                flex: 1, padding: '14px',
                background: 'rgba(239,68,68,0.12)', border: '1.5px solid rgba(239,68,68,0.3)',
                borderRadius: '14px', color: '#f87171', fontWeight: 700,
                fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
            >
              ❌ Skip
            </button>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => onUpvote(complaint)}
              style={{
                flex: 2, padding: '14px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none', borderRadius: '14px', color: 'white',
                fontWeight: 800, fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(34,197,94,0.35)',
                transition: 'all 0.2s', lineHeight: 1.3,
              }}
              onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 25px rgba(34,197,94,0.5)'}
              onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(34,197,94,0.35)'}
            >
              👆 Mujhe bhi yeh problem hai!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Toast Notification ──────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      color: 'white', padding: '12px 24px', borderRadius: '12px',
      fontWeight: 700, fontSize: '14px',
      boxShadow: '0 8px 30px rgba(34,197,94,0.5)',
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease',
      pointerEvents: 'none', zIndex: 100, whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CommunityFeed() {
  const { token } = useAuthStore();
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS);
  const [skipped, setSkipped] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [upvotedIds, setUpvotedIds] = useState(new Set());
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    // Try to fetch real data; fallback to mock silently
    axios.get('http://localhost:8000/api/complaints/', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(res => {
      if (res.data?.results?.length > 0) {
        setComplaints(res.data.results);
      }
    }).catch(() => {});
  }, [token]);

  const showToast = (msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };

  const handleUpvote = async (complaint) => {
    if (upvotedIds.has(complaint.id)) return;

    try {
      await axios.post(`http://localhost:8000/api/complaints/${complaint.id}/upvote/`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Silently fail — demo mode
    }

    setUpvotedIds(prev => new Set([...prev, complaint.id]));
    showToast(`👆 Upvoted! ${(complaint.mentions || 0) + 1} people affected now`);
    handleSkip(complaint.id);
  };

  const handleSkip = (id) => {
    setSkipped(prev => {
      const next = [...prev, id];
      if (next.length >= complaints.length) setAllDone(true);
      return next;
    });
  };

  const handleReset = () => {
    setSkipped([]);
    setUpvotedIds(new Set());
    setAllDone(false);
  };

  const visibleComplaints = complaints.filter(c => !skipped.includes(c.id));
  const topCard = visibleComplaints[0];
  const nextCard = visibleComplaints[1];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <h1 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 800 }}>
            Community Feed
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
            Swipe right to upvote · left to skip
          </p>
        </div>
        <Link to="/citizen/dashboard" style={{
          background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
          color: '#a5b4fc', borderRadius: '10px', padding: '8px 14px',
          fontSize: '13px', fontWeight: 600, textDecoration: 'none',
        }}>
          ← Report Hub
        </Link>
      </div>

      {/* Swipe hint */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '24px',
        padding: '12px 0 0',
      }}>
        <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
          ← Skip
        </span>
        <span style={{ color: '#64748b', fontSize: '12px' }}>
          {visibleComplaints.length} issues near you
        </span>
        <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
          Upvote →
        </span>
      </div>

      {/* Card Stack */}
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px 20px 100px' }}>
        {allDone ? (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '28px', backdropFilter: 'blur(16px)',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>
              You're all caught up!
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px' }}>
              You've reviewed all issues in your area. Thank you for being an active citizen!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleReset}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
                  color: '#a5b4fc', borderRadius: '12px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '14px',
                }}
              >
                🔄 See Again
              </button>
              <Link to="/citizen/dashboard" style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none', borderRadius: '12px', color: 'white',
                fontWeight: 700, fontSize: '14px', textDecoration: 'none',
              }}>
                ➕ Report New Issue
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', height: '580px' }}>
            {nextCard && (
              <SwipeCard
                key={nextCard.id + '-next'}
                complaint={nextCard}
                onUpvote={handleUpvote}
                onSkip={handleSkip}
                isTop={false}
              />
            )}
            {topCard && (
              <SwipeCard
                key={topCard.id}
                complaint={topCard}
                onUpvote={handleUpvote}
                onSkip={handleSkip}
                isTop={true}
              />
            )}
          </div>
        )}

        {/* Progress */}
        {!allDone && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Progress</span>
              <span style={{ color: '#64748b', fontSize: '12px' }}>
                {skipped.length} / {complaints.length} reviewed
              </span>
            </div>
            <div style={{
              height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '2px',
                background: 'linear-gradient(90deg, #6366f1, #22c55e)',
                width: `${(skipped.length / complaints.length) * 100}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      <Toast visible={toast.visible} message={toast.message} />
    </div>
  );
}
