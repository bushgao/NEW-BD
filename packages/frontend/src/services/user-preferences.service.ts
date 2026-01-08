import api from './api';
import type { FilterConfig, SavedFilter } from '../pages/Influencers/QuickFilters';

/**
 * Get user's saved filter configurations
 */
export async function getSavedFilters(): Promise<SavedFilter[]> {
  const response = await api.get('/users/saved-filters');
  return response.data.data.savedFilters.map((f: any) => ({
    ...f,
    createdAt: new Date(f.createdAt),
  }));
}

/**
 * Save a new filter configuration
 */
export async function saveFilter(name: string, filter: FilterConfig): Promise<SavedFilter> {
  const response = await api.post('/users/saved-filters', { name, filter });
  return {
    ...response.data.data.filter,
    createdAt: new Date(response.data.data.filter.createdAt),
  };
}

/**
 * Delete a saved filter
 */
export async function deleteFilter(filterId: string): Promise<void> {
  await api.delete(`/users/saved-filters/${filterId}`);
}

/**
 * Toggle favorite status of a saved filter
 */
export async function toggleFilterFavorite(filterId: string): Promise<void> {
  await api.put(`/users/saved-filters/${filterId}/favorite`);
}
