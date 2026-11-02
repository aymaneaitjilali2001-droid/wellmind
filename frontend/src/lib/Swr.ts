import useSWR, { type SWRConfiguration } from 'swr';
import { isAxiosError, type AxiosError } from 'axios';
import { api, type ApiErrorBody } from './Api';

// ---------------------------------------------------------------
// SWR : chargement des données avec cache.
// La clé SWR est le chemin de l'API (ex : '/users'), passé au fetcher.
// ---------------------------------------------------------------

export type ApiError = AxiosError<ApiErrorBody>;

export const fetcher = <T>(url: string): Promise<T> => api.get<T>(url).then((res) => res.data);

// Configuration commune, appliquée par <SWRConfig> dans Providers.tsx
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  dedupingInterval: 2000,
  // Pas de nouvel essai pour une erreur 4xx (accès refusé, introuvable…) :
  // elle ne se corrigera pas seule. 3 essais maximum pour les autres.
  onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    if (status !== undefined && status >= 400 && status < 500) return;
    if (retryCount >= 3) return;
    setTimeout(() => void revalidate({ retryCount }), 2000 * 2 ** retryCount);
  },
};

// Lecture typée d'une route GET.
//   const { data, error, isLoading, mutate } = useApi<User[]>('/users');
// Clé null = ne rien charger (ex : un id pas encore disponible).
export const useApi = <T>(key: string | null, config?: SWRConfiguration<T, ApiError>) =>
  useSWR<T, ApiError>(key, config);