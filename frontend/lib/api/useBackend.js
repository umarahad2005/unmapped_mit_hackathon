/**
 * UNMAPPED — React Hook: useBackend
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides seamless FastAPI backend integration with automatic fallback
 * to local processing if backend is offline.
 * 
 * Usage:
 *   const { backendOnline, extractSkills, runPipeline, config } = useBackend();
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from './client';

/**
 * Hook to interact with the FastAPI backend.
 * Automatically checks backend health and provides status.
 */
export function useBackend() {
  const [backendOnline, setBackendOnline] = useState(null); // null = checking
  const [systemStatus, setSystemStatus] = useState(null);
  const [activeConfig, setActiveConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const checkedRef = useRef(false);

  // Check backend health on mount
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    async function checkHealth() {
      const status = await api.getSystemStatus();
      setBackendOnline(status.online);
      setSystemStatus(status);

      if (status.online) {
        try {
          const config = await api.getActiveConfig();
          setActiveConfig(config);
        } catch (e) {
          console.warn('Could not fetch active config:', e.message);
        }
      }
    }
    checkHealth();
  }, []);

  // Retry backend connection
  const retryConnection = useCallback(async () => {
    api.resetBackendCache();
    setBackendOnline(null);
    const status = await api.getSystemStatus();
    setBackendOnline(status.online);
    setSystemStatus(status);
    return status.online;
  }, []);

  // Extract skills via FastAPI
  const extractSkills = useCallback(async (narrative, sessionId = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.extractSkills(narrative, sessionId);
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get mirror cards
  const getMirrorCards = useCallback(async (sessionId, skillIds) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getMirrorCards(sessionId, skillIds);
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Record mirror response
  const recordMirrorResponse = useCallback(async (sessionId, skillId, response, cardNumber) => {
    try {
      return await api.recordMirrorResponse(sessionId, skillId, response, cardNumber);
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  // Run full pipeline
  const runPipeline = useCallback(async (narrative, sessionId = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.runFullPipeline(narrative, sessionId);
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Swap config
  const swapConfig = useCallback(async (configId) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.swapConfig(configId);
      // Refresh active config after swap
      const newConfig = await api.getActiveConfig();
      setActiveConfig(newConfig);
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get signals
  const getSignals = useCallback(async (countryCode) => {
    try {
      return await api.getSignals(countryCode);
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  // Match opportunities
  const matchOpportunities = useCallback(async (skillIds) => {
    try {
      return await api.matchOpportunities(skillIds);
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  // Get profile
  const getProfile = useCallback(async (profileId) => {
    try {
      return await api.getProfile(profileId);
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  return {
    // Status
    backendOnline,
    systemStatus,
    activeConfig,
    isLoading,
    error,

    // Actions
    retryConnection,
    extractSkills,
    getMirrorCards,
    recordMirrorResponse,
    runPipeline,
    swapConfig,
    getSignals,
    matchOpportunities,
    getProfile,
  };
}

export default useBackend;
