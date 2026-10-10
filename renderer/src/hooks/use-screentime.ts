import { electronAPI } from '@/types/electron-api';
import {  useRef } from 'react';

export const useScreenTime = () => {
  const sessionIdRef = useRef<number | null>(null);

  const startSession = async () => {
    try {
      const result = await electronAPI.startSession();
      if (result.success) {
        sessionIdRef.current = result.sessionId;
        console.log('Session started with ID:', result.sessionId);
      }
      return result;
    } catch (error) {
      console.error('Failed to start session:', error);
      return { success: false, sessionId: null };
    }
  };

  const endSession = async () => {
    if (sessionIdRef.current !== null) {
      try {
        const result = await electronAPI.endSession(sessionIdRef.current);
        console.log('Session ended, duration:', result.durationMinutes);
        sessionIdRef.current = null;
        return result;
      } catch (error) {
        console.error('Failed to end session:', error);
        return { success: false, durationMinutes: 0 };
      }
    }
    return { success: false, durationMinutes: 0 };
  };

  return {
    sessionIdRef,
    startSession,
    endSession
  };
};