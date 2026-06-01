import { useState, useCallback, useEffect } from 'react';
import type { AccountEntry } from '../types';
import { supabase } from '../lib/supabase';

const LIST_KEY = 'tsb-account-list-v1';
const ACTIVE_KEY = 'tsb-active-account-v1';

function initList(): AccountEntry[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (raw) {
      let list = JSON.parse(raw) as AccountEntry[];
      // Migrate legacy 'default' id to UUID so Supabase rows don't collide across users
      let migrated = false;
      list = list.map(a => {
        if (a.id === 'default') {
          migrated = true;
          const newId = crypto.randomUUID();
          const oldData =
            localStorage.getItem('tsb-account-default') ??
            localStorage.getItem('tsb-demo-v1');
          if (oldData) localStorage.setItem(`tsb-account-${newId}`, oldData);
          return { ...a, id: newId };
        }
        return a;
      });
      if (migrated) localStorage.setItem(LIST_KEY, JSON.stringify(list));
      return list;
    }
  } catch {}
  const def: AccountEntry = { id: crypto.randomUUID(), name: 'Me', createdAt: new Date().toISOString() };
  localStorage.setItem(LIST_KEY, JSON.stringify([def]));
  return [def];
}

function initActiveId(list: AccountEntry[]): string {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw && list.some(a => a.id === raw)) return raw;
  } catch {}
  const first = list[0].id;
  localStorage.setItem(ACTIVE_KEY, first);
  return first;
}

async function pushAccountsToSupabase(list: AccountEntry[]) {
  const rows = list.map(a => ({ id: a.id, name: a.name, created_at: a.createdAt }));
  const { error } = await supabase.from('accounts').upsert(rows, { onConflict: 'id' });
  if (error) console.warn('Supabase accounts sync failed:', error.message);
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountEntry[]>(initList);
  const [activeId, setActiveId] = useState<string>(() => initActiveId(initList()));

  // Sync all local accounts to Supabase on mount (handles first-time + returning users)
  useEffect(() => {
    pushAccountsToSupabase(accounts);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const switchAccount = useCallback((id: string) => {
    localStorage.setItem(ACTIVE_KEY, id);
    setActiveId(id);
  }, []);

  const createAccount = useCallback((name: string) => {
    const id = crypto.randomUUID();
    const entry: AccountEntry = { id, name: name.trim() || 'Player', createdAt: new Date().toISOString() };
    setAccounts(prev => {
      const next = [...prev, entry];
      localStorage.setItem(LIST_KEY, JSON.stringify(next));
      return next;
    });
    localStorage.setItem(ACTIVE_KEY, id);
    setActiveId(id);
    // Sync new account to Supabase
    supabase.from('accounts')
      .insert({ id: entry.id, name: entry.name, created_at: entry.createdAt })
      .then(({ error }) => { if (error) console.warn('Supabase insert failed:', error.message); });
  }, []);

  const deleteAccount = useCallback((id: string, currentActiveId: string) => {
    setAccounts(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter(a => a.id !== id);
      localStorage.setItem(LIST_KEY, JSON.stringify(next));
      localStorage.removeItem(`tsb-account-${id}`);
      if (currentActiveId === id) {
        localStorage.setItem(ACTIVE_KEY, next[0].id);
        setActiveId(next[0].id);
      }
      return next;
    });
    // Remove from Supabase (cascades to trades)
    supabase.from('accounts')
      .delete()
      .eq('id', id)
      .then(({ error }) => { if (error) console.warn('Supabase delete failed:', error.message); });
  }, []);

  return { accounts, activeId, switchAccount, createAccount, deleteAccount };
}
