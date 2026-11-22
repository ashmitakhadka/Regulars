import { useState, useRef, useEffect, useCallback } from "react";
import { joinService } from "../services/customer/joinService";

/**
 * Maps API errors to user-friendly messages as required by the customer join specification.
 */
const mapJoinError = (err) => {
  const status = err.response?.status;
  if (status === 404) {
    return "This program is no longer available";
  }
  if (status === 429) {
    return "Too many attempts, please try again in a minute";
  }
  return (
    err.response?.data?.message || "Something went wrong, please try again"
  );
};

/**
 * Reusable hook for single and bulk loyalty program joins.
 * Handles loading flags, synchronous double-click protection via ref,
 * unmount safety, and centralized error mapping.
 */
export const useJoinProgram = () => {
  const [joiningIds, setJoiningIds] = useState(() => new Set());
  const [isBulkJoining, setIsBulkJoining] = useState(false);
  const [errors, setErrors] = useState({});
  const [bulkError, setBulkError] = useState(null);

  // Synchronous double-click protection ref (set before async tick)
  const inFlightRef = useRef({
    single: new Set(),
    bulk: false,
  });

  // Track component mount status to prevent updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Join a single loyalty program by ID.
   * Double clicks blocked synchronously via inFlightRef.
   */
  const join = useCallback(async (programId, signal) => {
    if (!programId) return null;

    // 1. Synchronously block duplicate in-flight requests for this program
    if (inFlightRef.current.single.has(programId)) {
      return null;
    }
    inFlightRef.current.single.add(programId);

    // Update state to reflect loading and clear prior error for this program
    if (isMountedRef.current) {
      setJoiningIds((prev) => {
        const next = new Set(prev);
        next.add(programId);
        return next;
      });
      setErrors((prev) => {
        if (!prev[programId]) return prev;
        const next = { ...prev };
        delete next[programId];
        return next;
      });
    }

    try {
      const response = await joinService.joinProgram(programId, signal);

      if (!isMountedRef.current) return null;

      // Both 201 (new card) and 200 (already joined) return success: true with data.card
      if (response && response.success && response.data?.card) {
        return {
          success: true,
          card: response.data.card,
          already_joined: Boolean(response.data.already_joined),
          message: response.message,
        };
      }

      // Fallback if success flag missing
      const fallbackError =
        response?.message || "Something went wrong, please try again";
      setErrors((prev) => ({ ...prev, [programId]: fallbackError }));
      return { success: false, error: fallbackError };
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return null;
      }

      const errorMessage = mapJoinError(err);
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, [programId]: errorMessage }));
      }
      return { success: false, error: errorMessage };
    } finally {
      // Clear in-flight lock
      inFlightRef.current.single.delete(programId);

      if (isMountedRef.current) {
        setJoiningIds((prev) => {
          const next = new Set(prev);
          next.delete(programId);
          return next;
        });
      }
    }
  }, []);

  /**
   * Bulk join multiple loyalty programs by IDs.
   * Double clicks blocked synchronously via inFlightRef.
   */
  const joinBulk = useCallback(async (programIds, signal) => {
    if (!Array.isArray(programIds) || programIds.length === 0) {
      return null;
    }

    // 1. Synchronously block duplicate in-flight bulk requests
    if (inFlightRef.current.bulk) {
      return null;
    }
    inFlightRef.current.bulk = true;

    if (isMountedRef.current) {
      setIsBulkJoining(true);
      setBulkError(null);
    }

    try {
      const response = await joinService.joinPrograms(programIds, signal);

      if (!isMountedRef.current) return null;

      if (response && response.success && response.data?.results) {
        return {
          success: true,
          results: response.data.results,
          message: response.message,
        };
      }

      const fallbackError =
        response?.message || "Something went wrong, please try again";
      setBulkError(fallbackError);
      return { success: false, error: fallbackError };
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return null;
      }

      const errorMessage = mapJoinError(err);
      if (isMountedRef.current) {
        setBulkError(errorMessage);
      }
      return { success: false, error: errorMessage };
    } finally {
      inFlightRef.current.bulk = false;
      if (isMountedRef.current) {
        setIsBulkJoining(false);
      }
    }
  }, []);

  const isJoining = useCallback(
    (programId) => joiningIds.has(programId),
    [joiningIds]
  );

  const getError = useCallback(
    (programId) => errors[programId] || null,
    [errors]
  );

  const clearErrors = useCallback(() => {
    if (isMountedRef.current) {
      setErrors({});
      setBulkError(null);
    }
  }, []);

  return {
    join,
    joinBulk,
    isJoining,
    isBulkJoining,
    getError,
    bulkError,
    clearErrors,
  };
};

export default useJoinProgram;
