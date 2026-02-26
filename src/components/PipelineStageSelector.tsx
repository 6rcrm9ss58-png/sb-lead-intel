'use client';

import { useState } from 'react';

const STAGES = [
  { id: 'new', label: 'New', color: '#3B82F6' },
  { id: 'contacted', label: 'Contacted', color: '#8B5CF6' },
  { id: 'demo_scheduled', label: 'Demo Scheduled', color: '#F59E0B' },
  { id: 'proposal', label: 'Proposal Sent', color: '#F97316' },
  { id: 'negotiation', label: 'Negotiation', color: '#EC4899' },
  { id: 'closed_won', label: 'Closed Won', color: '#22C55E' },
  { id: 'closed_lost', label: 'Closed Lost', color: '#EF4444' },
];

interface Props {
  leadId: string;
  currentStage: string;
  onStageChanged: () => void;
}

export default function PipelineStageSelector({ leadId, currentStage, onStageChanged }: Props) {
  const [updating, setUpdating] = useState(false);

  const currentStageInfo = STAGES.find((s) => s.id === currentStage) || STAGES[0];
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  async function handleStageChange(newStage: string) {
    if (newStage === currentStage || updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/lead/${leadId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_stage: newStage }),
      });
      if (!res.ok) throw new Error('Failed to update stage');
      onStageChanged();
    } catch (err) {
      console.error('Stage change error:', err);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <h3 className="text-lg font-bold text-sb-orange mb-3">Pipeline Stage</h3>

      {/* Visual Progress */}
      <div className="flex gap-1 mb-4">
        {STAGES.filter((s) => s.id !== 'closed_lost').map((stage, i) => (
          <button
            key={stage.id}
            onClick={() => handleStageChange(stage.id)}
            disabled={updating}
            className="flex-1 h-2 rounded-full transition-all hover:scale-y-150"
            style={{
              backgroundColor: i <= currentIndex ? currentStageInfo.color : 'var(--sb-border)',
              opacity: updating ? 0.5 : 1,
            }}
            title={stage.label}
          />
        ))}
      </div>

      {/* Current Stage Label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentStageInfo.color }} />
        <span className="text-sm font-semibold text-sb-text">{currentStageInfo.label}</span>
      </div>

      {/* Stage Buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        {STAGES.map((stage) => (
          <button
            key={stage.id}
            onClick={() => handleStageChange(stage.id)}
            disabled={updating || stage.id === currentStage}
            className={`text-[11px] font-medium px-2 py-1.5 rounded-md transition text-left ${
              stage.id === currentStage
                ? 'ring-2 ring-offset-1'
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: stage.id === currentStage ? `${stage.color}20` : `${stage.color}08`,
              color: stage.color,
              ringColor: stage.id === currentStage ? stage.color : undefined,
              opacity: updating ? 0.5 : stage.id === currentStage ? 1 : 0.7,
            }}
          >
            {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}
