import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
let db: Database | null = null;


export interface DatabaseResult {
  success: boolean;
  data?: any;
  error?: string;
}


export const initDatabase = async (): Promise<Database> => {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'app.sqlite');
    console.log('Database path:', dbPath);


    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }


    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });


    await db.exec(`
      CREATE TABLE IF NOT EXISTS eye_tracking_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        blinkRate REAL NOT NULL,
        perClose REAL NOT NULL,
        attentionFrac REAL NOT NULL,
        strainLevelIdx INTEGER NOT NULL,
        strainText TEXT NOT NULL,
        tiredText TEXT NOT NULL,
        attBinary INTEGER NOT NULL,
        eyeAspectRatio REAL NOT NULL,
        pupilDilation REAL NOT NULL,
        squintIntensity REAL NOT NULL,
        eyeAge INTEGER NOT NULL,
        faceAge INTEGER NOT NULL,
        meanIBI REAL,
        darkCircleScore REAL,
        incompleteBlinkFrac REAL,
        drynessScore REAL,
        rednessMean REAL,
        rednessStd REAL,
        rednessNorm REAL,
        rednessIndex REAL,
        rednessScore REAL,
        rednessZ REAL,
        distanceCm REAL,
        distanceVar REAL,
        proximityScore REAL,
        batteryLevel REAL,
        overallHealthScore INTEGER,
        synced INTEGER DEFAULT 0,
        user_id TEXT,
        level TEXT DEFAULT 'raw'
      )
    `);


    // New sync_status table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        start_time TEXT ,
        sync_table TEXT,
        remote_sync TEXT,
        local_sync TEXT
      )
    `);
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};




export const getDatabase = (): Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};


export const closeDatabase = async (): Promise<void> => {
  try {
    if (db) {
      await db.close();
      db = null;
      console.log("[DB] Closed successfully.");
    }
  } catch (error: any) {
    console.error("[DB] Error closing database:", error);
    throw new Error(`Failed to close database: ${error.message}`);
  }


};

