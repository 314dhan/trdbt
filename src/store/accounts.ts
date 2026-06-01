import { useState, useCallback } from 'react';
import type { AccountEntry } from '../types';

const LIST_KEY = 'tsb-account-list-v1';
const ACTIVE_KEY = 'tsb-active-account-v1';

function initList(): AccountEntry[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (raw) return JSON.parse(raw) as AccountEntry[];
  } catch {}
  const def: AccountEntry = { id: 'default', name: 'Me', createdAt: new Date().toISOString() };
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

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountEntry[]>(initList);
  const [activeId, setActiveId] = useState<string>(() => initActiveId(initList()));

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
  }, []);

  return { accounts, activeId, switchAccount, createAccount, deleteAccount };
}
