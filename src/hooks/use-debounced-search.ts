import { useEffect, useRef, useState } from 'react';

/**
 * Search input state that updates immediately, and calls `onSearch` with the trimmed
 * value once typing pauses for `delayMs`.
 */
export function useDebouncedSearch(onSearch: (value: string) => void, initialValue = '', delayMs = 300) {
  const [searchInput, setSearchInput] = useState(initialValue);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(value.trim()), delayMs);
  }

  function clearSearch() {
    clearTimeout(timer.current);
    setSearchInput('');
  }

  return { searchInput, handleSearchChange, clearSearch };
}
