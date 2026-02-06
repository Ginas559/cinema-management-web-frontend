import { useState, useCallback } from 'react';
import { searchMovies, searchTopMovies, expandQuery } from '../services/SearchService';

export function useSearch() {
  const [searchResults, setSearchResults] = useState([]);
  const [expandedTokens, setExpandedTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query, topK = 20) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setError(null);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchMovies(query, topK);
      setSearchResults(data.results || []);
      return data.results || [];
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to search movies';
      setError(errorMessage);
      setSearchResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTopMovies = useCallback(async (query, topK = 10) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setError(null);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchTopMovies(query, topK);
      setSearchResults(data.results || []);
      return data.results || [];
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to get top movies';
      setError(errorMessage);
      setSearchResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const expand = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      setExpandedTokens([]);
      return [];
    }

    try {
      const data = await expandQuery(query);
      let tokens = data.expanded_tokens || [];

      if (typeof tokens === 'string') {
        try {
          tokens = JSON.parse(tokens);
        } catch (e) {
          console.error('Failed to parse expanded tokens:', e);
          tokens = [];
        }
      }

      if (!Array.isArray(tokens)) {
        tokens = [];
      }
      
      const originalWords = query.toLowerCase().split(/\s+/);
      tokens = tokens.filter(token => 
        token && 
        typeof token === 'string' && 
        !originalWords.includes(token.toLowerCase())
      );
      
      tokens = [...new Set(tokens)].slice(0, 8);
      
      setExpandedTokens(tokens);
      return tokens;
    } catch (err) {
      console.error('Error expanding query:', err);
      setExpandedTokens([]);
      return [];
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setExpandedTokens([]);
    setError(null);
  }, []);

  return {
    searchResults,
    expandedTokens,
    loading,
    error,
    search,
    getTopMovies,
    expand,
    clearSearch,
  };
}