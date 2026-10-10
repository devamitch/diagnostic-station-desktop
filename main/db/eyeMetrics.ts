import { EyeTrackingMetrics } from "../../renderer/src/store/slices/eye-tracking.slice";
import { getDatabase } from "./database";


export interface TimeFilterQueryDto {
  timeFilter: "today" | "week" | "month" | "year";
  start?: string;
  end?: string;
  interval?: "hour" | "day" | "month";
}
export interface EyeMetricsQueryDto {
  start: any;
  end: any;
  interval: "hour" | "day" | "month";
  user_id?: string;
}

export interface AggregatedEyeMetrics {
  time_bucket: string;
  blinkRate: number;
  eyeClosure: number;
  attention: number;
  dryness: number;
  redness: number;
  proximity: number;
  eyeAge: number;
  eyeAspectRatio: number;
  overallHealthScore: number;
  distanceCm: number;
   screenTimeMinutes: number; // Added
   sessionCount: number; // Added
}
export interface graphResponse{
  metrics: AggregatedEyeMetrics[];
  currentRange: {
    start: string;
    end: string;
  };
  previousRange?: {
    start: string;
    end: string;
    interval: 'hour' | 'day' | 'month';
  };
  nextRange?: {
    start: string;
    end: string;
    interval: 'hour' | 'day' | 'month';
  };
  hasPrevious: boolean;
  hasNext: boolean;
  timeFilter: string;
  isCustomRange?: boolean;
}
export interface SessionData{
    start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
}
export interface Sessionwithid extends SessionData{
  session_id: number;
}
export interface PaginationInfo {
  batchSize: number;
  hasMore: boolean;
  lastId: number | null;
  count: number;
}


export interface UnsyncedLocalResponse {
  data: any[];
  pagination: PaginationInfo;
}
export const eyeTrackingQueries = {
 createMetrics: async (
  eyeTrackingData: EyeTrackingMetrics,
  user_id: string
): Promise<{ success: boolean; id: number }> => {
  const db = getDatabase();
  const result = await db.run(
    `
    INSERT INTO eye_tracking_metrics (
      timestamp, blinkRate, perClose, attentionFrac, strainLevelIdx,
      strainText, tiredText, attBinary, eyeAspectRatio, pupilDilation,
      squintIntensity, eyeAge, faceAge, meanIBI, darkCircleScore,
      incompleteBlinkFrac, drynessScore, rednessMean, rednessStd, rednessNorm,
      rednessIndex, rednessScore, rednessZ, distanceCm, distanceVar,
      proximityScore, overallHealthScore, batteryLevel, user_id 
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    `,
    [
      eyeTrackingData.timestamp,
      eyeTrackingData.blinkRate,
      eyeTrackingData.perClose,
      eyeTrackingData.attentionFrac,
      eyeTrackingData.strainLevelIdx,
      eyeTrackingData.strainText,
      eyeTrackingData.tiredText,
      eyeTrackingData.attBinary,
      eyeTrackingData.eyeAspectRatio,
      eyeTrackingData.pupilDilation,
      eyeTrackingData.squintIntensity,
      eyeTrackingData.eyeAge,
      eyeTrackingData.faceAge,
      eyeTrackingData.meanIBI ?? null,
      eyeTrackingData.darkCircleScore ?? null,
      eyeTrackingData.incompleteBlinkFrac ?? null,
      eyeTrackingData.drynessScore ?? null,
      eyeTrackingData.rednessMean ?? null,
      eyeTrackingData.rednessStd ?? null,
      eyeTrackingData.rednessNorm ?? null,
      eyeTrackingData.rednessIndex ?? null,
      eyeTrackingData.rednessScore ?? null,
      eyeTrackingData.rednessZ ?? null,
      eyeTrackingData.distanceCm ?? null,
      eyeTrackingData.distanceVar ?? null,
      eyeTrackingData.proximityScore ?? null,
      eyeTrackingData.overallHealthScore ?? null,
      eyeTrackingData.batteryLevel ?? null,
      user_id ?? null
    ]
  );

  return { success: true, id: result.lastID };
}
,
remoteMetricSync: async (
  eyeTrackingDataArray: EyeTrackingMetrics[],
  user_id: string
): Promise<{ success: boolean; count: number }> => {
  const db = getDatabase();

  if (!eyeTrackingDataArray || eyeTrackingDataArray.length === 0) {
    return { success: true, count: 0 };
  }

  await db.run("BEGIN TRANSACTION");

  try {
    // Create placeholders for bulk insert - ONE placeholder set per row
    const placeholders = eyeTrackingDataArray.map(() => 
      "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)"
    ).join(",");

    // Flatten all data into a single values array
    const values: any[] = [];
    
    for (const data of eyeTrackingDataArray) {
      values.push(
        data.timestamp,
        data.blinkRate,
        data.perClose,
        data.attentionFrac,
        data.strainLevelIdx,
        data.strainText,
        data.tiredText,
        data.attBinary,
        data.eyeAspectRatio,
        data.pupilDilation,
        data.squintIntensity,
        data.eyeAge,
        data.faceAge,
        data.meanIBI,
        data.darkCircleScore,
        data.incompleteBlinkFrac,
        data.drynessScore,
        data.rednessMean,
        data.rednessStd,
        data.rednessNorm,
        data.rednessIndex,
        data.rednessScore,
        data.rednessZ,
        data.distanceCm,
        data.distanceVar,
        data.proximityScore,
        data.overallHealthScore,
        data.batteryLevel,
        user_id
      );
    }

    // SINGLE bulk insert query
    const query = `
      INSERT INTO eye_tracking_metrics (
        timestamp, blinkRate, perClose, attentionFrac, strainLevelIdx,
        strainText, tiredText, attBinary, eyeAspectRatio, pupilDilation,
        squintIntensity, eyeAge, faceAge, meanIBI, darkCircleScore,
        incompleteBlinkFrac, drynessScore, rednessMean, rednessStd, rednessNorm,
        rednessIndex, rednessScore, rednessZ, distanceCm, distanceVar,
        proximityScore, overallHealthScore, batteryLevel, user_id, synced
      )
      VALUES ${placeholders}
    `;

    // SINGLE database call for all records
    await db.run(query, values);

    await db.run(
      `
      UPDATE sync_status 
      SET remote_sync = datetime('now')
      WHERE user_id = ? AND sync_table = 'eye_tracking_metrics'
      `,
      [user_id]
    );

    await db.run("COMMIT");
    console.log("data inserted", eyeTrackingDataArray);
    return { success: true, count: eyeTrackingDataArray.length };
  } catch (error: any) {
    await db.run("ROLLBACK");
    console.error("[DB] remoteMetricSync (bulk insert) failed:", error.message);
    return { success: false, count: 0 };
  }
},

// Updated IPC function with pagination
getUnsyncedMetrics: async (user_id: string, lastId?: number, batchSize: number = 500) => {
  const db = getDatabase();

  const lastSyncRecord = await db.get<{ local_sync: string }>(
    `
    SELECT local_sync 
    FROM sync_status 
    WHERE user_id = ? AND sync_table = 'eye_tracking_metrics'
    ORDER BY id DESC
    LIMIT 1
    `,
    [user_id]
  );

  let query = `
    SELECT 
      id, timestamp, blinkRate, perClose, attentionFrac, strainLevelIdx,
      strainText, tiredText, attBinary, eyeAspectRatio, pupilDilation,
      squintIntensity, eyeAge, faceAge, meanIBI, darkCircleScore,
      incompleteBlinkFrac, drynessScore, rednessMean, rednessStd,
      rednessNorm, rednessIndex, rednessScore, rednessZ, distanceCm,
      distanceVar, proximityScore, overallHealthScore, batteryLevel
    FROM eye_tracking_metrics
    WHERE synced = 0 AND user_id = ?
  `;

  const params: any[] = [user_id];

  // If we have a last sync time, only pull records created after that time
  if (lastSyncRecord && lastSyncRecord.local_sync) {
    query += ` AND timestamp > ?`;
    params.push(lastSyncRecord.local_sync);
  }

  // Cursor-based pagination
  if (lastId) {
    query += ` AND id > ?`;
    params.push(lastId);
  }

  // Order and limit
  query += ` ORDER BY id ASC LIMIT ?`;
  params.push(batchSize);

  // Record the start time of sync only on first batch
  if (!lastId) {
    await db.run(
      `
      INSERT INTO sync_status (user_id, start_time, sync_table, remote_sync, local_sync)
      VALUES (?, datetime('now'), 'eye_tracking_metrics', NULL, NULL)
      `,
      [user_id]
    );
  }

  const result = await db.all(query, params);
  
  // Check if there are more records
  let hasMore = false;
  if (result.length === batchSize) {
    const nextRecord = await db.get(
      `SELECT id FROM eye_tracking_metrics WHERE synced = 0 AND user_id = ? AND id > ? ORDER BY id ASC LIMIT 1`,
      [user_id, result[result.length - 1].id]
    );
    hasMore = !!nextRecord;
  }

  console.log(`[LOCAL] Fetched ${result.length} records, hasMore: ${hasMore}`);
  
  return {
    data: result,
    pagination: {
      batchSize,
      hasMore,
      lastId: result.length > 0 ? result[result.length - 1].id : null,
      count: result.length
    }
  };
},
markMetricsSynced: async (ids: number[], user_id: string) => {
  const db = getDatabase();

  if (ids.length === 0) return; // nothing to update

  const placeholders = ids.map(() => '?').join(',');
  const query = `
    UPDATE eye_tracking_metrics
    SET synced = 1
    WHERE id IN (${placeholders}) AND user_id = ?
  `;

  await db.run(query, [...ids, user_id]);
  await db.run(
    `
    UPDATE sync_status 
    SET local_sync = datetime('now')
    WHERE user_id = ? AND sync_table = 'eye_tracking_metrics'
    `,
    [user_id]
  );
  console.log("updated",placeholders);
},

  generateTimeBuckets(
    start: Date,
    end: Date,
    interval: string,
    type: string
  ): Array<{ original: string; formatted: string }> {
    const buckets: Array<{ original: string; formatted: string }> = [];
    const current = new Date(start);
    
    if (isNaN(current.getTime()) || isNaN(end.getTime())) {
      console.error("Invalid dates in generateTimeBuckets:");
      return buckets;
    }

    while (current <= end) {
      let bucketDate: Date;
      let formatted: string;
      let original: string;

      if (interval === "hour") {
        bucketDate = new Date(
          Date.UTC(
            current.getUTCFullYear(),
            current.getUTCMonth(),
            current.getUTCDate(),
            current.getUTCHours(),
            0, 0, 0
          )
        );
        original = bucketDate.toISOString().replace(/\.\d{3}Z$/, ".000Z");
        const utcHour = current.getUTCHours();
        const hours = utcHour.toString().padStart(2, "0");
        formatted = `${hours}:00`;
        buckets.push({ original, formatted });
        current.setUTCHours(current.getUTCHours() + 1);
      } else if (interval === "day") {
        bucketDate = new Date(
          Date.UTC(
            current.getUTCFullYear(),
            current.getUTCMonth(),
            current.getUTCDate(),
            0, 0, 0, 0
          )
        );
        original = bucketDate.toISOString().replace(/\.\d{3}Z$/, ".000Z");
        if(type === "week"){
          formatted = bucketDate.toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "UTC",
        });         
        }else {
          const day = bucketDate.getUTCDate().toString().padStart(2, "0");
const month = (bucketDate.getUTCMonth() + 1).toString().padStart(2, "0");
formatted = `${day}/${month}`;

        }
        
        buckets.push({ original, formatted });
        current.setUTCDate(current.getUTCDate() + 1);
      } else if (interval === "month") {
        bucketDate = new Date(
          Date.UTC(
            current.getUTCFullYear(),
            current.getUTCMonth(),
            1, 0, 0, 0, 0
          )
        );
        original = bucketDate.toISOString().replace(/\.\d{3}Z$/, ".000Z");
        formatted = bucketDate.toLocaleDateString("en-US", {
          month: "short",
          timeZone: "UTC",
        });
        buckets.push({ original, formatted });
        current.setUTCMonth(current.getUTCMonth() + 1);
      }
    }

    return buckets;
  },

async findAll(query: EyeMetricsQueryDto, type: string) {
  try {
    const db = getDatabase();
    const { start, end, interval, user_id } = query;

    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return [];
    }

    const offsetMinutes = new Date().getTimezoneOffset() * -1;
    const hours = Math.floor(offsetMinutes / 60);
    const minutes = offsetMinutes % 60;

    // Simplified interval mapping
    const intervalMap = {
      hour: `strftime('%Y-%m-%dT%H:00:00.000Z', datetime(timestamp, '${hours} hours', '${minutes} minutes'))`,
      day: `strftime('%Y-%m-%dT00:00:00.000Z', datetime(timestamp, '${hours} hours', '${minutes} minutes'))`,
      month: `strftime('%Y-%m-01T00:00:00.000Z', datetime(timestamp, '${hours} hours', '${minutes} minutes'))`,
      year: `strftime('%Y-01-01T00:00:00.000Z', datetime(timestamp, '${hours} hours', '${minutes} minutes'))`
    };

    const groupExpr = intervalMap[interval as keyof typeof intervalMap] || intervalMap.day;

    const metrics = await db.all(
      `
      SELECT
        ${groupExpr} AS time_bucket,
        COALESCE(AVG(blinkRate), 0) AS blinkRate,
        COALESCE(AVG(perClose), 0) AS eyeClosure,
        COALESCE(AVG(attentionFrac), 0) AS attention,
        COALESCE(AVG(drynessScore), 0) AS dryness,
        COALESCE(AVG(rednessScore), 0) AS redness,
        COALESCE(AVG(proximityScore), 0) AS proximity,
        COALESCE(AVG(eyeAge), 0) AS eyeAge,
        COALESCE(AVG(eyeAspectRatio), 0) AS eyeAspectRatio,
        COALESCE(AVG(overallHealthScore), 0) AS overallHealthScore,
        COALESCE(AVG(distanceCm), 0) AS distanceCm,
        -- Count distinct minutes with at least one record for screen time, excluding attBinary = 0
        COUNT(DISTINCT 
          CASE 
            WHEN attBinary != 0 THEN strftime('%Y-%m-%d %H:%M:00', datetime(timestamp, '${hours} hours', '${minutes} minutes'))
            ELSE NULL 
          END
        ) AS screenTimeMinutes
      FROM eye_tracking_metrics
      WHERE timestamp BETWEEN ? AND ?
        AND user_id = ?
      GROUP BY time_bucket
      ORDER BY time_bucket;
      `,
      [start, end, user_id]
    );

    const allTimeBuckets = this.generateTimeBuckets(startDate, endDate, interval, type);

    const validMetrics = metrics.filter((m: any) => {
      if (!m.time_bucket) return false;
      const date = new Date(m.time_bucket);
      return !isNaN(date.getTime());
    });

    const metricsMap = new Map();
    validMetrics.forEach((m: any) => {
      metricsMap.set(m.time_bucket, m);
    });

    return allTimeBuckets.map((timeBucket) => {
      const existingMetric = metricsMap.get(timeBucket.original);

      if (existingMetric) {
        return {
          ...existingMetric,
          time_bucket: timeBucket.formatted,
          screenTimeMinutes: Number(existingMetric.screenTimeMinutes) || 0,
        };
      } else {
        return {
          time_bucket: timeBucket.formatted,
          blinkRate: 0,
          eyeClosure: 0,
          attention: 0,
          dryness: 0,
          redness: 0,
          proximity: 0,
          eyeAge: 0,
          eyeAspectRatio: 0,
          overallHealthScore: 0,
          distanceCm: 0,
          screenTimeMinutes: 0,
        };
      }
    });
  } catch (error) {
    console.error('Error in findAll:', error);
    return [];
  }
},

  // Consolidated date range calculation logic
  calculateDateRange(timeFilter: string, customStart?: string, customEnd?: string, customInterval?: string) {
    if (customStart && customEnd) {
      return {
        start: customStart,
        end: customEnd,
        interval: customInterval || this.determineIntervalFromRange(customStart, customEnd),
        isCustomRange: true
      };
    }

    const now = new Date();
    const ranges = {
      today: () => {
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        return { start: start.toISOString(), end: end.toISOString(), interval: "hour" as const };
      },
      week: () => {
        const dayOfWeek = now.getUTCDay();
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOfWeek, 0, 0, 0, 0));
        const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6, 23, 59, 59, 999));
        return { start: start.toISOString(), end: end.toISOString(), interval: "day" as const };
      },
      month: () => {
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        return { start: start.toISOString(), end: end.toISOString(), interval: "day" as const };
      },
      year: () => {
        const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
        return { start: start.toISOString(), end: end.toISOString(), interval: "month" as const };
      }
    };

    const range = ranges[timeFilter as keyof typeof ranges]?.();
    if (!range) throw new Error("Invalid time filter");
    
    return { ...range, isCustomRange: false };
  },

  async findAllTimeRange(query: TimeFilterQueryDto,user_id: string): Promise<any> {
    try {
      const { timeFilter, start: customStart, end: customEnd, interval: customInterval } = query;
      
      const { start, end, interval, isCustomRange } = this.calculateDateRange(timeFilter, customStart, customEnd, customInterval);
      const effectiveTimeFilter = isCustomRange ? 
        this.determineTimeFilterFromRange(new Date(start), new Date(end)) : 
        timeFilter;

      const data = await this.findAll({ start, end, interval,user_id, isPreviousPeriod: isCustomRange },timeFilter);
      
      const currentStart = new Date(start);
      const currentEnd = new Date(end);

      const [previousRanges, nextRanges] = await Promise.all([
        this.findNearestAvailablePeriod(currentStart, currentEnd, effectiveTimeFilter, 'previous',user_id),
        this.findNearestAvailablePeriod(currentStart, currentEnd, effectiveTimeFilter, 'next',user_id)
      ]);

      const response: any = {
        metrics: data,
        currentRange: { start, end, interval },
        hasPrevious: previousRanges !== null,
        hasNext: nextRanges !== null,
        timeFilter: effectiveTimeFilter,
        ...(isCustomRange && { isCustomRange: true })
      };

      if (previousRanges) {
        response.previousRange = {
          start: previousRanges.start.toISOString(),
          end: previousRanges.end.toISOString(),
          interval: this.getIntervalForTimeFilter(effectiveTimeFilter)
        };
      }

      if (nextRanges) {
        response.nextRange = {
          start: nextRanges.start.toISOString(),
          end: nextRanges.end.toISOString(),
          interval: this.getIntervalForTimeFilter(effectiveTimeFilter)
        };
      }

      return response;
    } catch (error) {
      console.error("findAllTimeRange error:", error);
      return {
        metrics: [],
        currentRange: { start: '', end: '', interval: 'hour' },
        hasPrevious: false,
        hasNext: false
      };
    }
  },

  // Consolidated period finding logic
  async findNearestAvailablePeriod(
    currentStart: Date,
    currentEnd: Date,
    timeFilter: string,
    direction: 'previous' | 'next',
    user_id?: string,
    maxAttempts: number = 10
  ): Promise<{ start: Date; end: Date } | null> {
    let attempts = 0;
    let searchStart = new Date(currentStart);
    let searchEnd = new Date(currentEnd);

    while (attempts < maxAttempts) {
      const ranges = direction === 'previous' ? 
        this.calculatePreviousRanges(searchStart, searchEnd, timeFilter) :
        this.calculateNextRanges(searchStart, searchEnd, timeFilter);
      
      const hasData = await this.checkPeriodDataExists(
        direction === 'previous' ? ranges.previousStart : ranges.nextStart,
        direction === 'previous' ? ranges.previousEnd : ranges.nextEnd,user_id
      );

      if (hasData) {
        return {
          start: direction === 'previous' ? ranges.previousStart : ranges.nextStart,
          end: direction === 'previous' ? ranges.previousEnd : ranges.nextEnd
        };
      }

      searchStart = direction === 'previous' ? ranges.previousStart : ranges.nextStart;
      searchEnd = direction === 'previous' ? ranges.previousEnd : ranges.nextEnd;
      attempts++;
    }

    return null;
  },

async checkPeriodDataExists(
  periodStart: Date,
  periodEnd: Date,
  user_id?: string
): Promise<boolean> {
  try {
    const db = getDatabase();
    const start = periodStart.toISOString();
    const end = periodEnd.toISOString();

    const result = await db.get(
      `
      SELECT 1
      FROM eye_tracking_metrics
      WHERE user_id = ?
        AND timestamp BETWEEN ? AND ?
      LIMIT 1;
      `,
      [user_id, start, end]
    );

    return !!result;
  } catch (error) {
    console.error("Error checking period data:", error);
    return false;
  }
},

  // REMOVED: checkPreviousPeriodData - duplicate functionality

  calculateNextRanges(currentStart: Date, currentEnd: Date, timeFilter: string) {
    return this.calculateRanges(currentStart, currentEnd, timeFilter, 1);
  },

  calculatePreviousRanges(currentStart: Date, currentEnd: Date, timeFilter: string) {
    return this.calculateRanges(currentStart, currentEnd, timeFilter, -1);
  },

  // Consolidated range calculation
  calculateRanges(currentStart: Date, currentEnd: Date, timeFilter: string, direction: number) {
    const start = new Date(currentStart);
    const end = new Date(currentEnd);

    const adjustments = {
      today: () => {
        start.setUTCDate(start.getUTCDate() + direction);
        end.setUTCDate(end.getUTCDate() + direction);
      },
      week: () => {
        start.setUTCDate(start.getUTCDate() + (7 * direction));
        end.setUTCDate(end.getUTCDate() + (7 * direction));
      },
      month: () => {
        start.setUTCMonth(start.getUTCMonth() + direction);
        const tempEnd = new Date(start);
        tempEnd.setUTCMonth(tempEnd.getUTCMonth() + 1);
        tempEnd.setUTCDate(0);
        tempEnd.setUTCHours(23, 59, 59, 999);
        return { start, end: tempEnd };
      },
      year: () => {
        start.setUTCFullYear(start.getUTCFullYear() + direction);
        end.setUTCFullYear(end.getUTCFullYear() + direction);
      }
    };

    const adjustment = adjustments[timeFilter as keyof typeof adjustments];
    if (adjustment) {
      const result = adjustment();
      if (result) return { previousStart: start, previousEnd: result.end, nextStart: start, nextEnd: result.end };
    } else {
      // Fallback for custom ranges
      const durationMs = end.getTime() - start.getTime();
      start.setTime(start.getTime() + (durationMs * direction));
      end.setTime(end.getTime() + (durationMs * direction));
    }

    return {
      previousStart: start,
      previousEnd: end,
      nextStart: start,
      nextEnd: end
    };
  },

  determineTimeFilterFromRange(start: Date, end: Date): string {
    const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;
    
    if (diffInHours <= 24 && start.getUTCHours() === 0 && end.getUTCHours() === 23) return "today";
    if (diffInDays <= 7 && start.getUTCDay() === 0) return "week";
    if (start.getUTCDate() === 1 && end.getUTCDate() === new Date(end.getUTCFullYear(), end.getUTCMonth() + 1, 0).getUTCDate()) return "month";
    if (start.getUTCMonth() === 0 && start.getUTCDate() === 1 && end.getUTCMonth() === 11 && end.getUTCDate() === 31) return "year";
    
    if (diffInHours <= 24) return "today";
    if (diffInDays <= 7) return "week";
    if (diffInDays <= 31) return "month";
    return "year";
  },

getIntervalForTimeFilter(timeFilter: string): "hour" | "day" | "month" {
  const intervalMap: Record<string, "hour" | "day" | "month"> = {
    today: "hour",
    week: "day", 
    month: "day",
    year: "month"
  };
  
  return intervalMap[timeFilter] || "day";
},

  determineIntervalFromRange(start: string, end: string): "hour" | "day" | "month" {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffInHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours <= 24) return "hour";
    if (diffInHours <= 24 * 7) return "day";
    return "month";
  },
};

/** Utility: Map numeric score to text */
function mapScoreToLabel(score: number, type: 'strain' | 'tired'): string {
  if (type === 'strain') {
    if (score < 1.5) return 'Low';
    if (score < 2.5) return 'Moderate';
    return 'High';
  }
  if (type === 'tired') {
    if (score < 1.5) return 'Low';
    if (score < 2.5) return 'Moderate';
    if (score < 3.5) return 'High';
    return 'Very High';
  }
  return 'Unknown';
}

/** Shared helper to aggregate data between two levels */
async function aggregateData({
  fromLevel,
  toLevel,
  durationMs,
}: {
  fromLevel: "raw" | "hourly";
  toLevel: "hourly" | "daily";
  durationMs: number;
}) {
  const db = getDatabase();
  console.log(`[CRON] Starting ${toLevel.toUpperCase()} Aggregation...`);

  const levelCondition =
    fromLevel === "raw" ? "(level IS NULL OR level='raw')" : `level='${fromLevel}'`;

  const oldest = await db.get<{ minTime: string }>(
    `SELECT MIN(timestamp) AS minTime FROM eye_tracking_metrics WHERE ${levelCondition}`
  );

  if (!oldest?.minTime) {
    console.log(`[DB] No ${fromLevel} data available to aggregate.`);
    return;
  }

  const oldestTime = new Date(oldest.minTime);
  const now = new Date();
  const currentBoundary = new Date(
    toLevel === "hourly"
      ? now.setMinutes(0, 0, 0)
      : now.setUTCHours(0, 0, 0, 0)
  );

  let start = new Date(oldestTime);
  if (toLevel === "hourly") start.setMinutes(0, 0, 0);
  else start.setUTCHours(0, 0, 0, 0);

  while (start < currentBoundary) {
    const end = new Date(start.getTime() + durationMs);

    const rows = await db.all<any[]>(
      `SELECT * FROM eye_tracking_metrics 
       WHERE timestamp >= ? AND timestamp < ? AND ${levelCondition}`,
      [start.toISOString(), end.toISOString()]
    );

    if (rows.length > 0) {
      // Average numeric values
      const strainTextAvg =
        rows.reduce(
          (sum, r) =>
            sum +
            (r.strainText === "Low"
              ? 1
              : r.strainText === "Moderate"
              ? 2
              : r.strainText === "High"
              ? 3
              : 0),
          0
        ) / rows.length;

      const tiredTextAvg =
        rows.reduce(
          (sum, r) =>
            sum +
            (r.tiredText === "Low"
              ? 1
              : r.tiredText === "Moderate"
              ? 2
              : r.tiredText === "High"
              ? 3
              : 0),
          0
        ) / rows.length;

      const strainLabel = mapScoreToLabel(strainTextAvg, "strain");
      const tiredLabel = mapScoreToLabel(tiredTextAvg, "tired");

      await db.run(
        `
        INSERT INTO eye_tracking_metrics (
          timestamp, blinkRate, perClose, attentionFrac, strainLevelIdx, strainText, tiredText,
          attBinary, eyeAspectRatio, pupilDilation, squintIntensity, eyeAge, faceAge,
          meanIBI, darkCircleScore, incompleteBlinkFrac, drynessScore, rednessMean, rednessStd,
          rednessNorm, rednessIndex, rednessScore, rednessZ, distanceCm, distanceVar,
          proximityScore, overallHealthScore, level
        )
        SELECT 
          ?, 
          AVG(blinkRate), AVG(perClose), AVG(attentionFrac), AVG(strainLevelIdx),
          ? AS strainText, ? AS tiredText,
          AVG(attBinary), AVG(eyeAspectRatio), AVG(pupilDilation), AVG(squintIntensity),
          AVG(eyeAge), AVG(faceAge), AVG(meanIBI), AVG(darkCircleScore),
          AVG(incompleteBlinkFrac), AVG(drynessScore), AVG(rednessMean), AVG(rednessStd),
          AVG(rednessNorm), AVG(rednessIndex), AVG(rednessScore), AVG(rednessZ),
          AVG(distanceCm), AVG(distanceVar), AVG(proximityScore), AVG(overallHealthScore),
          ?
        FROM eye_tracking_metrics 
        WHERE timestamp >= ? AND timestamp < ? AND ${levelCondition}`,
        [start.toISOString(), strainLabel, tiredLabel, toLevel, start.toISOString(), end.toISOString()]
      );

      await db.run(
        `DELETE FROM eye_tracking_metrics 
         WHERE timestamp >= ? AND timestamp < ? AND ${levelCondition}`,
        [start.toISOString(), end.toISOString()]
      );

      console.log(`[DB] ${toLevel} aggregation completed for ${start.toISOString()}`);
    }

    start = end;
  }

  console.log(`[CRON] Finished ${toLevel.toUpperCase()} Aggregation`);
}
export const aggregateHourlyData = async () =>
  aggregateData({
    fromLevel: "raw",
    toLevel: "hourly",
    durationMs: 60 * 60 * 1000, // 1 hour
  });

export const aggregateDailyData = async () =>
  aggregateData({
    fromLevel: "hourly",
    toLevel: "daily",
    durationMs: 24 * 60 * 60 * 1000, // 1 day
  }); 
  