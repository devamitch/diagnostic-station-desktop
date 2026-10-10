import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  getUnsyncedRemoteData,
  getUnsyncedRemoteSessions,
  localdatasync,
  localSessionsync,
  markRemoteAsSynced,
  markRemoteAsSyncedSessions,
} from "@/lib/server/metrics-sync";
import { EyeTrackingMetrics } from "@/store/slices/eye-tracking.slice";
import { SessionData } from "../../../main/db/eyeMetrics";

// ---------------------- Helpers -----------------------
function normalizeItems<T>(remoteData: any[]): { ids: string[]; cleaned: T[] } {
  const ids: string[] = [];
  const cleaned: T[] = [];

  for (const item of remoteData) {
    ids.push(item.id);
    const { id, user_id, localdbSync, ...rest } = item;

    const parsed: any = {};
    for (const [key, value] of Object.entries(rest)) {
      if (typeof value === "string" && value.trim() !== "" && !isNaN(Number(value))) {
        parsed[key] = Number(value);
      } else if (value === null || value === undefined || value === "null") {
        parsed[key] = null;
      } else {
        parsed[key] = value;
      }
    }
    cleaned.push(parsed as T);
  }

  return { ids, cleaned };
}

// ======================================================
export function useDataSync() {
  const [syncCompleted, setSyncCompleted] = useState(false);

  // ------------------ Local → Remote ------------------
async function syncLocalMetrics() {
  let lastId: number | undefined = undefined;
  let hasMore = true;
  let totalSynced = 0;
  const batchSize = 50;

  while (hasMore) {
    try {
      // Now TypeScript knows the response structure
      const localResponse = await window.ipc.getunsyncedMetrics(lastId, batchSize);
      
      if (!localResponse?.data?.length) {
        hasMore = false;
        continue;
      }

      const localMetricWithIds = localResponse.data;
      const ids = localMetricWithIds.map((i) => i.id);
      const metrics = localMetricWithIds.map(({ id, ...rest }) => rest);

      await localdatasync(metrics);
      await window.ipc.markMetricsSynced(ids);
      
      lastId = localResponse.pagination.lastId ?? undefined;
      hasMore = localResponse.pagination.hasMore;
      totalSynced += localResponse.data.length;
      
      console.log(`[SYNC] Local → Remote: ${localResponse.data.length} records (Total: ${totalSynced})`);
      
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error) {
      console.error('[SYNC] Error syncing local batch:', error);
      throw error;
    }
  }

  console.log(`[SYNC] Completed: ${totalSynced} local metrics synced to remote`);
  return totalSynced;
}

  // ------------------ Remote → Local ------------------
async function syncRemoteMetrics() {
  let lastId: number | undefined = undefined;
  let hasMore = true;
  let totalSynced = 0;

  while (hasMore) {
    try {
      // Fetch batch of unsynced data
      const remote = await getUnsyncedRemoteData(lastId);
      
      if (!remote?.data?.length) {
        hasMore = false;
        continue;
      }

      const { ids, cleaned } = normalizeItems<EyeTrackingMetrics>(remote.data);
      
      await window.ipc.remoteMetricsSync(cleaned);
      await markRemoteAsSynced(ids);
      
      // Update pagination variables
      lastId = remote.pagination.lastId ?? undefined;
      hasMore = remote.pagination.hasMore;
      totalSynced += remote.data.length;
      
      console.log(`[SYNC] Batch synced: ${remote.data.length} records (Total: ${totalSynced})`);
      
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error('[SYNC] Error syncing batch:', error);
      throw error; // Or implement retry logic
    }
  }

  if (totalSynced > 0) {
    console.log(`[SYNC] Completed: ${totalSynced} metrics synced remote → local`);
  } else {
    console.log('[SYNC] No metrics to sync');
  }
}


  // ------------------ Main Sync Trigger ------------------
  const syncMutation = useMutation({
    mutationFn: async () => {
      // Run all sync tasks independently — no dependency between metric & session
      await Promise.allSettled([
        syncLocalMetrics(),
        syncRemoteMetrics(),
      ]);
    },
    onSuccess: () => {
      setSyncCompleted(true);
      console.log("[SYNC] ✅ Full sync completed.");
    },
    onError: (err: any) => {
      setSyncCompleted(false);
      console.log("[SYNC] ❌ Sync failed:", err?.message);
    },
  });

  const startSync = useCallback(() => {
    setSyncCompleted(false);
    syncMutation.mutate();
  }, [syncMutation]);

  return {
    isSyncing: syncMutation.isPending,
    syncCompleted,
    startSync,
  };
}