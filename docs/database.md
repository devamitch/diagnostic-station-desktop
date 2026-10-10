# 📘 Electron Backend – Database Layer Documentation

## 📁 File: `database.ts`

## Purpose

Initializes and manages a SQLite database inside Electron's userData directory.

**Provides:**

- DB initialization
- Schema creation  
- Reusable DB instance getter
- Safe DB closing

## 📌 Exports

### 1. `initDatabase(): Promise<Database>`

Initializes SQLite database.

**Steps:**

1. Determines user data directory: `app.getPath('userData')`
2. Ensures directory exists
3. Opens `app.sqlite`
4. Creates two tables:
   - `eye_tracking_metrics`
   - `sync_status`

### 2. `getDatabase(): Database`

Returns the active DB instance.

**Throws an error** if `initDatabase()` was not called.

### 3. `closeDatabase(): Promise<void>`

Gracefully closes DB connection.

## Database Schemas

### `eye_tracking_metrics` Table Schema

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | INTEGER | Auto increment row ID | PRIMARY KEY AUTOINCREMENT |
| `timestamp` | TEXT | ISO string timestamp | NOT NULL |
| `blinkRate` | REAL | Blink rate | NOT NULL |
| `perClose` | REAL | Eye closure percentage | NOT NULL |
| `attentionFrac` | REAL | Attention fraction | NOT NULL |
| `strainLevelIdx` | INTEGER | Strain level index | NOT NULL |
| `strainText` | TEXT | Strain label | NOT NULL |
| `tiredText` | TEXT | Tiredness label | NOT NULL |
| `attBinary` | INTEGER | 1 = active, 0 = inactive | NOT NULL |
| `eyeAspectRatio` | REAL | Eye aspect ratio metric | NOT NULL |
| `pupilDilation` | REAL | Pupil dilation measurement | NOT NULL |
| `squintIntensity` | REAL | Squint intensity level | NOT NULL |
| `eyeAge` | INTEGER | Estimated eye age | NOT NULL |
| `faceAge` | INTEGER | Estimated face age | NOT NULL |
| `meanIBI` | REAL | Mean inter-blink interval | |
| `darkCircleScore` | REAL | Dark circle severity score | |
| `incompleteBlinkFrac` | REAL | Incomplete blink fraction | |
| `drynessScore` | REAL | Eye dryness score | |
| `rednessMean` | REAL | Mean redness value | |
| `rednessStd` | REAL | Redness standard deviation | |
| `rednessNorm` | REAL | Normalized redness value | |
| `rednessIndex` | REAL | Redness index calculation | |
| `rednessScore` | REAL | Overall redness score | |
| `rednessZ` | REAL | Redness Z-score | |
| `distanceCm` | REAL | Distance from screen in cm | |
| `distanceVar` | REAL | Distance variance | |
| `proximityScore` | REAL | Screen proximity score | |
| `batteryLevel` | REAL | Battery percentage | |
| `overallHealthScore` | INTEGER | Overall eye health score | |
| `synced` | INTEGER | Sync status | DEFAULT 0 |
| `user_id` | TEXT | User identifier | |
| `level` | TEXT | Metadata level | DEFAULT 'raw' |

### `sync_status` Table Schema

Tracks incremental sync:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | INTEGER | PK |
| `user_id` | TEXT | User |
| `start_time` | TEXT | Sync batch start |
| `sync_table` | TEXT | e.g., `eye_tracking_metrics` |
| `remote_sync` | TEXT | Last remote sync timestamp |
| `local_sync` | TEXT | Last local sync timestamp |
