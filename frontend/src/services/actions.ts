import { api } from '@/lib/Api';
import type { Action, ActionInput, ActionStatus } from '@/types/action';

export const createAction = (input: ActionInput) => api.post<Action>('/actions', input).then((res) => res.data);

export const updateAction = (id: string, input: ActionInput) =>
  api.patch<Action>(`/actions/${id}`, input).then((res) => res.data);

export const changeActionStatus = (id: string, status: ActionStatus, note?: string) =>
  api.patch<Action>(`/actions/${id}/status`, { status, note }).then((res) => res.data);

export const addActionUpdate = (id: string, note: string) =>
  api.post<Action>(`/actions/${id}/updates`, { note }).then((res) => res.data);