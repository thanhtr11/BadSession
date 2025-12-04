/**
 * useFetch Hook
 * Handles API data fetching with caching and error handling
 * Reduces duplicate requests and improves performance
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/api';

// Simple cache for fetch requests
const requestCache = new Map();
const requestInProgress = new Map();

export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!requestCache.has(url));
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  const {
    method = 'GET',
    body = null,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    skip = false,
    refetch = 0
  } = options;

  const fetchData = useCallback(async () => {
    if (skip || !url) {
      return;
    }

    const cacheKey = `${method}:${url}`;

    // Check if data is already cached and still fresh
    if (requestCache.has(cacheKey)) {
      const { data: cachedData, timestamp } = requestCache.get(cacheKey);
      if (Date.now() - timestamp < cacheTime) {
        if (isMounted.current) {
          setData(cachedData);
          setLoading(false);
          setError(null);
        }
        return;
      }
    }

    // Prevent duplicate requests
    if (requestInProgress.has(cacheKey)) {
      const existingPromise = requestInProgress.get(cacheKey);
      try {
        const result = await existingPromise;
        if (isMounted.current) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err);
        }
      }
      return;
    }

    // Start new request
    const promise = (async () => {
      try {
        if (isMounted.current) {
          setLoading(true);
          setError(null);
        }

        const config = {
          method,
          url
        };

        if (body && method !== 'GET') {
          config.data = body;
        }

        const response = await apiClient(config);
        const result = response.data;

        // Cache the result
        requestCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        if (isMounted.current) {
          setData(result);
          setError(null);
        }

        return result;
      } catch (err) {
        console.error('Fetch error:', err);
        if (isMounted.current) {
          setError(err);
          setData(null);
        }
        throw err;
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
        requestInProgress.delete(cacheKey);
      }
    })();

    requestInProgress.set(cacheKey, promise);
    await promise;
  }, [url, method, body, cacheTime, skip]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Manual refetch function
  const refetchData = useCallback(async () => {
    const cacheKey = `${method}:${url}`;
    requestCache.delete(cacheKey);
    await fetchData();
  }, [method, url, fetchData]);

  // Clear cache for this URL
  const clearCache = useCallback(() => {
    const cacheKey = `${method}:${url}`;
    requestCache.delete(cacheKey);
  }, [method, url]);

  return {
    data,
    loading,
    error,
    refetch: refetchData,
    clearCache
  };
};

// Utility to clear all cache
export const clearAllCache = () => {
  requestCache.clear();
  requestInProgress.clear();
};

export default useFetch;
