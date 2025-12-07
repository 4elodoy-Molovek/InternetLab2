const Database = require("better-sqlite3");

// Открываем / создаём базу данных
const db = new Database("users.db");

// Создаём таблицу пользователей
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
`).run();

// Таблица сохранённых данных
db.prepare(`
    CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        schema_name TEXT,
        data TEXT,
        created_at TEXT
    )
`).run();

module.exports = db;
