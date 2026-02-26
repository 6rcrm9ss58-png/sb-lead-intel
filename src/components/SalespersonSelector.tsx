'use client';

import { useEffect, useState, useRef } from 'react';

interface Salesperson {
  name: string;
  title: string;
  email: string;
  slack_id: string;
  region: string;
  group: string;
}

interface Props {
  leadId: string;
  currentAssignee: string | null;
  currentEmail: string | null;
  onAssigned: () => void;
}

export default function SalespersonSelector({ leadId, currentAssignee, currentEmail, onAssigned }: Props) {
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSalespeople() {
      setLoading(true);
      try {
        const res = await fetch('/api/salespeople');
        const data = await res.json();
        setSalespeople(data.salespeople || []);
      } catch (err) {
        console.error('Failed to fetch salespeople:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSalespeople();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = salespeople.filter((sp) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      sp.name.toLowerCase().includes(q) ||
      sp.title.toLowerCase().includes(q) ||
      sp.email.toLowerCase().includes(q) ||
      sp.region.toLowerCase().includes(q) ||
      sp.group.toLowerCase().includes(q)
    );
  });

  // Group filtered results
  const groups: Record<string, Salesperson[]> = {};
  for (const sp of filtered) {
    if (!groups[sp.group]) groups[sp.group] = [];
    groups[sp.group].push(sp);
  }

  const groupLabels: Record<string, string> = {
    Leadership: 'Leadership & Ops',
    Field: 'Regional Sales Managers',
    ISE: 'Inside Sales Engineers',
  };

  async function handleAssign(sp: Salesperson) {
    setAssigning(true);
    try {
      const res = await fetch(`/api/lead/${leadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sp.name, email: sp.email, slack_id: sp.slack_id }),
      });
      if (!res.ok) throw new Error('Failed to assign');
      setOpen(false);
      setSearch('');
      onAssigned();
    } catch (err) {
      console.error('Assignment failed:', err);
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassign() {
    setAssigning(true);
    try {
      const res = await fetch(`/api/lead/${leadId}/assign`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unassign');
      onAssigned();
    } catch (err) {
      console.error('Unassign failed:', err);
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <h3 className="text-lg font-bold text-sb-orange mb-3">Assigned Salesperson</h3>

      {currentAssignee ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-sb-bg rounded-lg border border-sb-border">
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              {currentAssignee.split(' ').map((n) => n[0]).join('').substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sb-text truncate">{currentAssignee}</p>
              <p className="text-xs text-sb-text-secondary truncate">{currentEmail}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1" ref={dropdownRef}>
              <button
                onClick={() => {
                  setOpen(!open);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-sb-text-secondary bg-sb-bg border border-sb-border rounded-lg hover:border-sb-orange transition text-left"
              >
                Reassign...
              </button>
              {open && (
                <DropdownMenu
                  inputRef={inputRef}
                  search={search}
                  setSearch={setSearch}
                  groups={groups}
                  groupLabels={groupLabels}
                  loading={loading}
                  assigning={assigning}
                  onAssign={handleAssign}
                  currentEmail={currentEmail}
                />
              )}
            </div>
            <button
              onClick={handleUnassign}
              disabled={assigning}
              className="px-3 py-2 text-xs font-medium text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg hover:bg-red-900/40 transition disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setOpen(!open);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            disabled={loading}
            className="w-full px-4 py-3 text-sm font-medium bg-sb-bg border-2 border-dashed border-sb-border rounded-lg hover:border-sb-orange transition text-sb-text-secondary text-center"
          >
            {loading ? 'Loading team...' : '+ Assign a Salesperson'}
          </button>
          {open && (
            <DropdownMenu
              inputRef={inputRef}
              search={search}
              setSearch={setSearch}
              groups={groups}
              groupLabels={groupLabels}
              loading={loading}
              assigning={assigning}
              onAssign={handleAssign}
              currentEmail={currentEmail}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Extracted dropdown menu component
function DropdownMenu({
  inputRef,
  search,
  setSearch,
  groups,
  groupLabels,
  loading,
  assigning,
  onAssign,
  currentEmail,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  search: string;
  setSearch: (s: string) => void;
  groups: Record<string, Salesperson[]>;
  groupLabels: Record<string, string>;
  loading: boolean;
  assigning: boolean;
  onAssign: (sp: Salesperson) => void;
  currentEmail: string | null;
}) {
  return (
    <div
      className="absolute z-50 mt-1 w-full bg-sb-card border border-sb-border rounded-lg shadow-lg overflow-hidden"
      style={{ maxHeight: 320 }}
    >
      <div className="p-2 border-b border-sb-border">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by name, role, region..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-sb-bg border border-sb-border rounded-md text-sb-text placeholder:text-sb-text-tertiary focus:outline-none focus:border-sb-orange"
        />
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
        {loading ? (
          <p className="text-xs text-sb-text-secondary p-3">Loading...</p>
        ) : Object.keys(groups).length === 0 ? (
          <p className="text-xs text-sb-text-secondary p-3">No matches found</p>
        ) : (
          Object.entries(groups).map(([group, people]) => (
            <div key={group}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sb-text-tertiary px-3 pt-2 pb-1">
                {groupLabels[group] || group}
              </p>
              {people.map((sp) => (
                <button
                  key={sp.email}
                  onClick={() => onAssign(sp)}
                  disabled={assigning || sp.email === currentEmail}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-sb-bg transition text-sm ${
                    sp.email === currentEmail ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', fontSize: 10 }}
                  >
                    {sp.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sb-text font-medium truncate">{sp.name}</p>
                    <p className="text-[11px] text-sb-text-secondary truncate">
                      {sp.title}
                      {sp.region ? ` · ${sp.region}` : ''}
                    </p>
                  </div>
                  {sp.email === currentEmail && (
                    <span className="text-[10px] text-sb-orange font-medium">Current</span>
                  )}
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
