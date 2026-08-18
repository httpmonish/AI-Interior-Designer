import { useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import {
  Sparkles, Loader2, CheckCircle2, ArrowRight, MessageSquare,
  Zap, TrendingUp, ChevronDown, ChevronUp, Send, Plus,
  LayoutGrid, Maximize, Target
} from 'lucide-react';
import AIChat from './AIChat';
import WhatIf from './WhatIf';

const ANALYSIS_STEPS = [
  'Checking room dimensions',
  'Mapping doors and windows',
  'Checking furniture collisions',
  'Calculating walkable space',
  'Analyzing natural light',
  'Understanding your lifestyle priorities',
  'Optimizing furniture relationships',
  'Creating layout alternatives',
];

export default function AIAssistant() {
  const {
    isOptimizing, optimizationStep, runOptimization,
    aiLayouts, appliedLayoutId, applyLayout,
    beforeScore, afterScore,
    designerMode,
  } = useRoomStore();
  const [showExplanations, setShowExplanations] = useState(false);
  const [activeTab, setActiveTab] = useState<'optimize' | 'chat' | 'whatif'>('optimize');

  const appliedLayout = aiLayouts.find(l => l.id === appliedLayoutId);

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{
        padding: '16px 14px', borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.05))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} style={{ color: 'var(--accent)' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>RoomMind AI</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your intelligent space-planning assistant</div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'optimize' as const, label: 'Optimize', icon: <Zap size={12} /> },
          { id: 'chat' as const, label: 'Chat', icon: <MessageSquare size={12} /> },
          { id: 'whatif' as const, label: 'What If', icon: <TrendingUp size={12} /> },
        ].map(tab => (
          <button
            key={tab.id}
            className="btn-ghost"
            style={{
              flex: 1, padding: '8px 4px', fontSize: 11, borderRadius: 0,
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--accent)' : undefined,
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Optimize tab */}
      {activeTab === 'optimize' && (
        <div style={{ padding: 14 }}>
          {/* Optimize button */}
          {!isOptimizing && aiLayouts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <button
                className="btn-primary animate-pulse-glow"
                style={{ padding: '12px 24px', fontSize: 14, width: '100%' }}
                onClick={runOptimization}
              >
                <Sparkles size={16} /> Optimize with AI
              </button>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                AI will analyze your room and generate optimized layouts.
              </p>
            </div>
          )}

          {/* Analysis animation */}
          {isOptimizing && (
            <div style={{ padding: '8px 0' }} className="animate-fadeIn">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 14, color: 'var(--accent)',
              }}>
                <Loader2 size={16} className="animate-spin-slow" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Analyzing your room...</span>
              </div>
              {ANALYSIS_STEPS.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 0', fontSize: 12,
                  opacity: i <= optimizationStep ? 1 : 0.3,
                  transition: 'opacity 0.3s ease',
                }}>
                  {i < optimizationStep ? (
                    <CheckCircle2 size={14} style={{ color: 'var(--success)' }} className="animate-check" />
                  ) : i === optimizationStep ? (
                    <Loader2 size={14} className="animate-spin-slow" style={{ color: 'var(--accent)' }} />
                  ) : (
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border)' }} />
                  )}
                  <span style={{ color: i <= optimizationStep ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Before / After score */}
          {!isOptimizing && beforeScore && afterScore && (
            <div style={{
              display: 'flex', gap: 12, marginBottom: 16,
              padding: 12, background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
            }} className="animate-fadeIn">
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Before</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-secondary)' }}>
                  {beforeScore.overall}
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                color: 'var(--success)', fontWeight: 700, fontSize: 13,
              }}>
                <ArrowRight size={16} />
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>After</div>
                <div className="score-value animate-score" style={{ fontSize: 24 }}>
                  {afterScore.overall}
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
              }}>
                <div className="badge badge-success" style={{ fontSize: 12, fontWeight: 700 }}>
                  +{afterScore.overall - beforeScore.overall}
                </div>
              </div>
            </div>
          )}

          {/* Layout cards */}
          {!isOptimizing && aiLayouts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {aiLayouts.map(layout => (
                <div
                  key={layout.id}
                  style={{
                    padding: 12, borderRadius: 'var(--radius-md)',
                    border: `1px solid ${appliedLayoutId === layout.id ? 'var(--border-accent)' : 'var(--border)'}`,
                    background: appliedLayoutId === layout.id ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                    cursor: 'pointer', transition: 'all var(--transition-fast)',
                  }}
                  onClick={() => applyLayout(layout.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {layout.variant === 'smart-balance' && <LayoutGrid size={14} style={{ color: 'var(--accent)' }} />}
                    {layout.variant === 'open-space' && <Maximize size={14} style={{ color: 'var(--success)' }} />}
                    {layout.variant === 'lifestyle-focus' && <Target size={14} style={{ color: 'var(--info)' }} />}
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{layout.name}</span>
                    <span className="badge badge-accent" style={{ marginLeft: 'auto', fontSize: 11 }}>
                      {layout.metrics.overall}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {layout.description}
                  </p>

                  {/* Mini metrics */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 10 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Walk: {layout.metrics.walkability}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Space: {layout.metrics.spaceEfficiency}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Light: {layout.metrics.naturalLight}</span>
                  </div>

                  {appliedLayoutId !== layout.id && (
                    <button className="btn-secondary" style={{ marginTop: 8, width: '100%', fontSize: 11 }}>
                      Apply Layout
                    </button>
                  )}
                  {appliedLayoutId === layout.id && (
                    <div className="badge badge-success" style={{ marginTop: 8 }}>
                      <CheckCircle2 size={10} /> Applied
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Why this layout */}
          {!isOptimizing && appliedLayout && appliedLayout.moves.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <button
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'space-between', padding: '8px 10px' }}
                onClick={() => setShowExplanations(!showExplanations)}
              >
                <span style={{ fontWeight: 600, fontSize: 13 }}>Why this layout?</span>
                {showExplanations ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showExplanations && (
                <div style={{
                  padding: 10, background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)', marginTop: 6,
                  border: '1px solid var(--border)',
                }} className="animate-fadeIn">
                  {appliedLayout.moves.map((move, i) => (
                    <div key={i} style={{
                      padding: '8px 0',
                      borderBottom: i < appliedLayout.moves.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 2 }}>
                        {move.furnitureName}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {move.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Re-optimize */}
          {!isOptimizing && aiLayouts.length > 0 && (
            <button
              className="btn-secondary"
              style={{ width: '100%', fontSize: 12 }}
              onClick={runOptimization}
            >
              <Sparkles size={14} /> Re-optimize
            </button>
          )}
        </div>
      )}

      {/* Chat tab */}
      {activeTab === 'chat' && <AIChat />}

      {/* What If tab */}
      {activeTab === 'whatif' && <WhatIf />}
    </div>
  );
}
