import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import { LayoutGrid, Folder, Plus, CheckCircle2, HelpCircle, Box, Upload, X } from 'lucide-react';
import FloorPlan2D from '../components/2d/FloorPlan2D';
import { useState } from 'react';

export default function Landing() {
  const { loadDemoRoom, createNewProject } = useRoomStore();
  const { user } = useAuthStore();
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpImage, setHelpImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setHelpImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* Help Modal */}
      {helpModalOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-primary)', padding: 32, borderRadius: 'var(--radius-lg)', width: 400, position: 'relative' }}>
            <button className="btn-icon" style={{ position: 'absolute', top: 16, right: 16 }} onClick={() => setHelpModalOpen(false)}>
              <X size={16} />
            </button>
            <h2 className="font-serif" style={{ fontSize: 24, marginBottom: 16 }}>Need Help?</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Describe your issue or upload a screenshot so we can help you.</p>
            
            <textarea className="input-field" placeholder="Describe the issue..." style={{ height: 100, marginBottom: 16, resize: 'none' }} />
            
            <label className="btn-secondary" style={{ width: '100%', marginBottom: 16, justifyContent: 'center', cursor: 'pointer' }}>
              <Upload size={16} /> Upload Screenshot
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
            
            {helpImage && (
              <div style={{ width: '100%', height: 120, borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 16, border: '1px solid var(--border)' }}>
                <img src={helpImage} alt="Upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setHelpModalOpen(false)}>
              Submit Ticket
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 240, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40, paddingLeft: 8 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <div style={{ width: 6, height: 16, background: 'var(--accent)', borderRadius: 2 }} />
            <div style={{ width: 6, height: 10, background: 'var(--success)', borderRadius: 2, marginTop: 'auto' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>
            roommind <span style={{ color: 'var(--terracotta)', fontStyle: 'italic', fontSize: 12 }}>ai</span>
          </span>
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, paddingLeft: 8, letterSpacing: '0.05em' }}>
          WORKSPACE
        </div>

        <button className="btn-ghost" style={{ justifyContent: 'flex-start', background: 'var(--accent-light)', color: 'var(--text-primary)', marginBottom: 4 }}>
          <LayoutGrid size={16} /> Dashboard
        </button>
        <button className="btn-ghost" style={{ justifyContent: 'flex-start', marginBottom: 4 }}>
          <Folder size={16} /> My Designs
        </button>
        <button className="btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={createNewProject}>
          <Plus size={16} /> New Design
        </button>

        <div style={{ marginTop: 'auto', paddingLeft: 8 }}>
          <button className="btn-ghost" style={{ color: 'var(--text-muted)', fontSize: 12 }} onClick={() => setHelpModalOpen(true)}>
            Need help?
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Welcome back, {user?.name || 'User'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={14} /> All changes saved
            </div>
            <button className="btn-icon" style={{ borderRadius: '50%', border: '1px solid var(--border)' }}>
              <HelpCircle size={16} />
            </button>
            <div style={{ position: 'relative' }}>
              <button 
                className="btn-icon" 
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--text-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, border: 'none' }}
                onClick={() => {
                  const el = document.getElementById('landing-user-dropdown');
                  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                }}
              >
                {user?.name.charAt(0).toUpperCase() || 'U'}
              </button>
              <div id="landing-user-dropdown" style={{ display: 'none', position: 'absolute', top: 40, right: 0, width: 200, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, boxShadow: 'var(--shadow-lg)', zIndex: 1000 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>User Account</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{user?.email || 'user@example.com'}</div>
                <button 
                  className="btn-danger" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                     localStorage.removeItem('roommind-auth');
                     window.location.reload();
                  }}
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div style={{ padding: '60px 40px', display: 'flex', gap: 40, flex: 1 }}>
          <div style={{ flex: 1, maxWidth: 500, alignSelf: 'center' }}>
            <div className="badge badge-success" style={{ marginBottom: 24, fontSize: 10 }}>STUDIO OVERVIEW</div>
            <h1 style={{ fontSize: 56, lineHeight: 1.1, marginBottom: 24, color: 'var(--text-primary)' }}>
              Design your space <span style={{ color: 'var(--terracotta)', fontStyle: 'italic' }}>around how you live.</span>
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 40 }}>
              RoomMind AI turns your room dimensions, furniture and lifestyle into practical layouts that actually work.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              <button className="btn-primary" style={{ padding: '12px 24px' }} onClick={createNewProject}>
                <Plus size={16} /> Create new design
              </button>
              <button className="btn-secondary" style={{ padding: '12px 24px' }} onClick={loadDemoRoom}>
                <Box size={16} /> Try demo room
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              background: 'white', borderRadius: 'var(--radius-lg)', 
              boxShadow: 'var(--shadow-lg)', padding: 24, width: '100%', maxWidth: 500,
              transform: 'rotate(2deg)', transition: 'transform 0.3s' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <span>Featured Room</span>
                <span>400 × 500 cm</span>
              </div>
              <div style={{ height: 200, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
                 <FloorPlan2D previewOnly />
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h3 className="font-serif" style={{ fontSize: 20, marginBottom: 4 }}>Modern Living Room</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last arranged just now</div>
                </div>
                <button className="btn-success" style={{ padding: '8px 16px' }} onClick={loadDemoRoom}>
                  Open
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Bottom */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '40px', borderTop: '1px solid var(--border)' }}>
          {[
            { n: '01', title: 'Smart layout', desc: 'Optimizes placement around space, movement and comfort.' },
            { n: '02', title: 'Lifestyle-aware', desc: 'Adapts the room to how you study, relax, work and host.' },
            { n: '03', title: 'Explainable AI', desc: 'See the design decisions, evidence and trade-offs behind every move.' }
          ].map((f, i) => (
            <div key={i} style={{ paddingRight: 40, borderRight: i < 2 ? '1px solid var(--border)' : 'none', paddingLeft: i > 0 ? 40 : 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{f.n}</div>
              <h3 className="font-serif" style={{ fontSize: 18, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
