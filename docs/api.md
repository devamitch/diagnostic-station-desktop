# 📘 Eye-Tracking Metrics API

## 📁 File: `eyeMetrics.ts`

Database operations for eye tracking metrics including CRUD, synchronization, and analytics.

## 📋 Core Functions

### `createMetrics()`

- **Purpose**: Insert single metric row
- **Returns**: `{ success: boolean, id: number }`

### `findAll()`

- **Purpose**: Generate aggregated graph data
- **Aggregates**: blinkRate, attention, proximity, eyeClosure, distanceCm
- **Computes**: screenTimeMinutes
- **Handles**: Timezone adjustments, missing bucket filling

### `generateTimeBuckets()`

- **Purpose**: Create time intervals for graphing
- **Formats**:
  - Hourly: `HH:00`
  - Daily: `DD/MM`
  - Weekly: `Mon`, `Tue`
  - Monthly: `Jan`, `Feb`

### `calculateDateRange()`

- **Purpose**: Handle time ranges (today, week, month, year, custom)
- **Features**: Auto interval selection, ISO formatting

### `findAllTimeRange()`

- **Purpose**: Get metrics for specific time range with navigation
- **Returns**: Metrics with current/previous/next range info
- **Features**: Custom range support, period navigation

### `findNearestAvailablePeriod()`

- **Purpose**: Find adjacent periods with data
- **Direction**: Previous/next period search
- **Limits**: Max 10 attempts

### `checkPeriodDataExists()`

- **Purpose**: Verify data exists in time period
- **Returns**: Boolean indicating data presence

### `calculateRanges()`

- **Purpose**: Calculate date ranges for navigation
- **Supports**: Today, week, month, year adjustments

### `determineTimeFilterFromRange()`

- **Purpose**: Auto-detect time filter from date range
- **Logic**: Based on duration and date boundaries

### `getIntervalForTimeFilter()`

- **Purpose**: Map time filter to appropriate interval
- **Mappings**: Today→hour, Week→day, Month→day, Year→month

### `determineIntervalFromRange()`

- **Purpose**: Auto-select interval based on range duration
- **Logic**: <24h→hour, <7d→day, else→month

### Utility Functions

- `calculateNextRanges()`: Compute next period ranges
- `calculatePreviousRanges()`: Compute previous period ranges

### `remoteMetricSync()`

- **Purpose**: Bulk insert remote metrics
- **Features**: Transactions, bulk placeholders, single SQL execution
- **Updates**: `sync_status.remote_sync`

### `getUnsyncedMetrics()`

- **Purpose**: Fetch unsynced rows for upload
- **Features**: Cursor pagination, time filtering, batch control (default: 500)
- **Returns**: Data array with pagination info

### `markMetricsSynced()`

- **Purpose**: Mark metrics as synced
- **Operations**: Batch ID updates, `sync_status.local_sync` update
