const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Banco SQLite (arquivo será criado automaticamente)
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Criação das tabelas simples do sistema
function createTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS aulas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        instrutor TEXT NOT NULL,
        horario TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS consumo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        socio_nome TEXT NOT NULL,
        item TEXT NOT NULL,
        valor REAL NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS espacos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        capacidade INTEGER NOT NULL,
        status TEXT NOT NULL
      )
    `);
  });
}

// Factory de CRUD para evitar repetição exagerada
function createCrudRoutes(moduleName, tableName, fields) {
  // CREATE
  app.post(`/api/${moduleName}`, (req, res) => {
    const values = fields.map((field) => req.body[field]);

    if (values.some((value) => value === undefined || value === '')) {
      return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;

    db.run(sql, values, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, ...req.body });
    });
  });

  // READ
  app.get(`/api/${moduleName}`, (req, res) => {
    const sql = `SELECT * FROM ${tableName} ORDER BY id DESC`;

    db.all(sql, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // UPDATE
  app.put(`/api/${moduleName}/:id`, (req, res) => {
    const { id } = req.params;
    const values = fields.map((field) => req.body[field]);

    if (values.some((value) => value === undefined || value === '')) {
      return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    const sets = fields.map((field) => `${field} = ?`).join(', ');
    const sql = `UPDATE ${tableName} SET ${sets} WHERE id = ?`;

    db.run(sql, [...values, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Registro não encontrado.' });
      res.json({ id: Number(id), ...req.body });
    });
  });

  // DELETE
  app.delete(`/api/${moduleName}/:id`, (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM ${tableName} WHERE id = ?`;

    db.run(sql, [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Registro não encontrado.' });
      res.json({ message: 'Registro removido com sucesso.' });
    });
  });
}

createTables();

createCrudRoutes('socios', 'socios', ['nome', 'email', 'telefone']);
createCrudRoutes('aulas', 'aulas', ['nome', 'instrutor', 'horario']);
createCrudRoutes('consumo', 'consumo', ['socio_nome', 'item', 'valor']);
createCrudRoutes('espacos', 'espacos', ['nome', 'capacidade', 'status']);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});