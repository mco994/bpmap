import { useSyncExternalStore } from 'react';
import { EMPTY_FILTERS, isEmptyFilters, type Filters } from '@bpmap/shared';

type FilterState = {
  filters: Filters;
  query: string;
};

let state: FilterState = { filters: EMPTY_FILTERS, query: '' };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setFilters(filters: Filters) {
  state = { ...state, filters };
  emit();
}

export function setQuery(query: string) {
  state = { ...state, query };
  emit();
}

export function clearAllFilters() {
  state = { filters: EMPTY_FILTERS, query: '' };
  emit();
}

export function useFilterState(): FilterState {
  return useSyncExternalStore(subscribe, () => state);
}

export function activeFiltersCount(f: Filters): number {
  return (
    f.eventTypes.length +
    f.genres.length +
    f.sizes.length +
    (f.organizer.trim() ? 1 : 0) +
    (f.artist.trim() ? 1 : 0) +
    (f.priceDayMax !== null ? 1 : 0) +
    (f.priceFullMax !== null ? 1 : 0) +
    (f.dateFrom || f.dateTo ? 1 : 0) +
    (f.includePast ? 1 : 0)
  );
}

export function hasActiveFilters(s: FilterState): boolean {
  return !isEmptyFilters(s.filters) || s.query.trim() !== '';
}
