// src/helpers/dbHelper.js
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'watchlist.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS hotel_watchlist (
        user_id TEXT,
        hotel_id TEXT,
        hotel_name TEXT,
        PRIMARY KEY (user_id, hotel_id)
    )`);
});

export function addHotelToWatchlist(userId, hotelId, hotelName) {
    return new Promise((resolve, reject) => {
        // Using db.run directly prevents memory locks
        db.run('INSERT OR IGNORE INTO hotel_watchlist (user_id, hotel_id, hotel_name) VALUES (?, ?, ?)', 
        [userId, hotelId, hotelName], 
        function(err) {
            if (err) reject(err);
            else resolve(this.changes); 
        });
    });
}

export function getWatchlist(userId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT hotel_id, hotel_name FROM hotel_watchlist WHERE user_id = ?', [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

export function removeHotelFromWatchlist(userId, hotelId) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM hotel_watchlist WHERE user_id = ? AND hotel_id = ?', [userId, hotelId], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
}

export function clearWatchlist(userId) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM hotel_watchlist WHERE user_id = ?', [userId], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
}