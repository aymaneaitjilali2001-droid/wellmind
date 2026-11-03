import { useApi } from '@/lib/Swr';
import type { Action, ActionListItem, ActionsSummary } from '@/types/action';

// Toutes les clés commencent par /actions : mutate(isActionsKey) recharge
// la liste, le détail et le résumé du tableau de bord après une modification.
export const isActionsKey = (key: unknown) => typeof key === 'string' && key.startsWith('/actions');

export function useActions() {
  return useApi<ActionListItem[]>('/actions', { keepPreviousData: true });
}

export function useAction(id: string | null) {
  return useApi<Action>(id ? `/actions/${id}` : null);
}

export function useActionsSummary() {
  return useApi<ActionsSummary>('/actions/summary');
}