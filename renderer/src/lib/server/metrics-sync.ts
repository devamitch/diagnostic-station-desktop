import { URLS } from "@/constants/urls";
import z from "zod";
import api from "../api";

interface UnsyncedMetrics {
  id: number; // internal only — will omit later
  timestamp: string;
  blinkRate: number;
  perClose: number;
  attentionFrac: number;
  strainLevelIdx: number;
  strainText: string;
  tiredText: string;
  attBinary: number;
  eyeAspectRatio: number;
  pupilDilation: number;
  squintIntensity: number;
  eyeAge: number;
  faceAge: number;
  meanIBI: number;
  darkCircleScore: number;
  incompleteBlinkFrac: number;
  drynessScore: number;
  rednessMean: number;
  rednessStd: number;
  rednessNorm: number;
  rednessIndex: number;
  rednessScore: number;
  rednessZ: number;
  distanceCm: number;
  distanceVar: number;
  proximityScore: number;
  overallHealthScore: number;
  batteryLevel: number;
}
type unsyncedMetric_without_id = Omit<UnsyncedMetrics, 'id'>;

export type unsyncedRemoteMetric = {
  id: string;
  user_id: string;
  timestamp: string;

  blinkRate: number;
  perClose: string;
  attentionFrac: string;
  strainLevelIdx: number;
  strainText: string;
  tiredText: string;
  attBinary: number;

  eyeAspectRatio: string;
  pupilDilation: string;
  squintIntensity: string;

  eyeAge: number;
  faceAge: number;
  age: number;
  perclos: string;

  darkCircleScore: string | null;
  tirednessScore: string;
  eyeAgeIndex: string;
  drynessScore: string;
  meanIBI: string;
  incompleteBlinkFrac: string;

  rednessMean: string;
  rednessStd: string;
  rednessNorm: string;
  rednessIndex: string;
  rednessZ: string;
  rednessScore: string;

  distanceVar: string;
  distanceCm: string;
  proximityScore: string;
  overallHealthScore: string;
  batteryLevel: string;

  localdbSync: number;
};

export type sessiondata ={
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
} 
export type getSessionResponse ={
  id:string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  localdbSync: number;
} 
export const CreateMetricResponseSchema = z.object({
  status: z.number(), 
  message: z.string(),    
  data: z.array(z.string()), 
});
export const BulksessionResponseSchema = z.object({
  status: z.number(), 
  message: z.string(),    
  data: z.array(z.string()),
})
// Define the response interface
interface UnsyncedResponse {
  status: number;
  data: unsyncedRemoteMetric[];
  pagination: {
    batchSize: number;
    hasMore: boolean;
    lastId: number | null;
    count: number;
  };
}

// Or if you want to reuse the service response type:
interface PaginationInfo {
  batchSize: number;
  hasMore: boolean;
  lastId: number | null;
  count: number;
}

interface UnsyncedResponse {
  status: number;
  data: unsyncedRemoteMetric[];
  pagination: PaginationInfo;
}
export type BulksessionResponse = z.infer<typeof BulksessionResponseSchema>;
export type CreateMetricResponse = z.infer<typeof CreateMetricResponseSchema>;

export const localdatasync = async (data: unsyncedMetric_without_id|unsyncedMetric_without_id[]) =>
  (
    await api.post< { data: CreateMetricResponse },unsyncedMetric_without_id|unsyncedMetric_without_id[]>(URLS.eyeMetrics, data)
  ).data;

export const localSessionsync = async (data: sessiondata[]) =>
  (
    await api.post<{ data: BulksessionResponse },sessiondata[]>(URLS.sessions, data)
  ).data;

export const getUnsyncedRemoteData = async (lastId?: number): Promise<UnsyncedResponse> =>
  (await api.get<UnsyncedResponse>(URLS.getunsycned, { 
    params: { lastId, batchSize: 200 } 
  })).data;
export const getUnsyncedRemoteSessions = async () =>
  (await api.get<{ data: getSessionResponse[]}>(URLS.getUnsyncedSession)).data;

export const markRemoteAsSynced = async (ids: string[]) =>
  (
    await api.post<{ data: { success: boolean } }, { ids: string[] }>(URLS.markSync, { ids })
  ).data;
export const markRemoteAsSyncedSessions = async (ids: string[]) =>
  (
    await api.post<{ data: { success: boolean } }, { ids: string[] }>(URLS.markSessionSynced, { ids })
  ).data;
