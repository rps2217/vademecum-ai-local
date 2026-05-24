import React from 'react';
import { useStore } from '../store/useStore';

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useSearch = () => {
  const query = useStore((state) => state.searchQuery);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const isSearching = useStore((state) => state.isSearching);
  const setIsSearching = useStore((state) => state.setIsSearching);

  return {
    query,
    setQuery: setSearchQuery,
    isSearching,
    setIsSearching,
  };
};
