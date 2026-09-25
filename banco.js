const Database = require("better-sqlite3");
const db = new Database("dados.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    curso TEXT NOT NULL
  )
`);

module.exports = db;