import { URLS } from "@/constants/urls";
import api from "../api";
import { CreateMetricResponse, EyeTrackingMetrics, EyeTrackingSummary } from "../schema/eyetracking";

export const create_metrics = async (data: EyeTrackingMetrics|EyeTrackingMetrics[]) =>
  (
    await api.post< { data: CreateMetricResponse },EyeTrackingMetrics|EyeTrackingMetrics[]>(URLS.eyeMetrics, data)
  ).data;

export const filter_reports = async (params: {filter: string}) =>
  (await api.get<EyeTrackingSummary[]>(URLS.timeFilter(params.filter))).data;
