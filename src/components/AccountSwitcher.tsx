import { useState, useRef, useEffect } from 'react';
import type { AccountEntry } from '../types';

type Props = {
  accounts: AccountEntry[];
  activeId: string;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
};

const LABEL: React.CSSProperties = {
  color: 'var(--ink-3)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

export function AccountSwitcher({ accounts, activeId, onSwitch, onCreate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const active = accounts.find(a => a.id === activeId) ?? accounts[0];

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function submitCreate() {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName('');
    setCreating(false);
    setOpen(false);
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={LABEL}>Account</span>
        {/* Dropdown trigger */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setOpen(o => !o); setCreating(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '5px 10px',
              cursor: 'pointer',
              color: 'var(--ink)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--violet)', flexShrink: 0 }} />
            {active?.name ?? 'Unknown'}
            <span style={{ color: 'var(--ink-3)', fontSize: 10 }}>▾</span>
          </button>

          {open && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                zIndex: 100,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                minWidth: 200,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                overflow: 'hidden',
              }}
            >
              {accounts.map(a => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: a.id === activeId ? 'var(--surface2)' : 'transparent',
                    cursor: 'pointer',
                    gap: 8,
                  }}
                  onClick={() => { onSwitch(a.id); setOpen(false); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {a.id === activeId && (
                      <span style={{ color: 'var(--violet)', fontSize: 12, flexShrink: 0 }}>✓</span>
                    )}
                    {a.id !== activeId && <span style={{ width: 12, flexShrink: 0 }} />}
                    <span
                      style={{
                        color: a.id === activeId ? 'var(--ink)' : 'var(--ink-2)',
                        fontSize: 13,
                        fontWeight: a.id === activeId ? 700 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a.name}
                    </span>
                  </div>
                  {accounts.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(a.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--ink-3)',
                        cursor: 'pointer',
                        fontSize: 13,
                        padding: '0 2px',
                        flexShrink: 0,
                      }}
                      title="Delete account"
                    >
                      🗑
                    </button>
                  )}
                </div>
              ))}

              <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px' }}>
                {creating ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      ref={inputRef}
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitCreate(); if (e.key === 'Escape') setCreating(false); }}
                      placeholder="Name..."
                      style={{
                        flex: 1,
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '4px 8px',
                        color: 'var(--ink)',
                        fontSize: 12,
                        minWidth: 0,
                      }}
                      maxLength={20}
                    />
                    <button
                      onClick={submitCreate}
                      style={{ background: 'var(--violet)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 10px', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setCreating(false); setNewName(''); }}
                      style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--ink-3)', fontSize: 12, padding: '4px 8px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreating(true)}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--violet)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    + New Account
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>
        {accounts.length} {accounts.length === 1 ? 'player' : 'players'}
      </span>
    </div>
  );
}
