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
        cpf TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS aulas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        instrutor TEXT NOT NULL,
        espaco TEXT NOT NULL,
        horario TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS consumo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        socio_cpf TEXT NOT NULL,
        item TEXT NOT NULL,
        quantidade INTEGER NOT NULL
      )
    `);


    db.run(`
      CREATE TABLE IF NOT EXISTS itens_consumo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        valor REAL NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS instrutores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT NOT NULL,
        telefone TEXT NOT NULL
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



// Garante compatibilidade para bases antigas sem a coluna CPF.
function ensureSociosCpfColumn() {
  db.all('PRAGMA table_info(socios)', [], (err, columns) => {
    if (err) return;
    const hasCpf = columns.some((column) => column.name === 'cpf');
    if (!hasCpf) {
      db.run("ALTER TABLE socios ADD COLUMN cpf TEXT NOT NULL DEFAULT ''");
    }
  });
}



function ensureAulasEspacoColumn() {
  db.all('PRAGMA table_info(aulas)', [], (err, columns) => {
    if (err) return;
    const hasEspaco = columns.some((column) => column.name === 'espaco');
    if (!hasEspaco) {
      db.run("ALTER TABLE aulas ADD COLUMN espaco TEXT NOT NULL DEFAULT ''");
    }
  });
}


function ensureInstrutoresCpfColumn() {
  db.all('PRAGMA table_info(instrutores)', [], (err, columns) => {
    if (err) return;
    const hasCpf = columns.some((column) => column.name === 'cpf');
    if (!hasCpf) db.run("ALTER TABLE instrutores ADD COLUMN cpf TEXT NOT NULL DEFAULT ''");
  });
}

function ensureConsumoSocioCpfColumn() {
  db.all('PRAGMA table_info(consumo)', [], (err, columns) => {
    if (err) return;
    const hasSocioCpf = columns.some((column) => column.name === 'socio_cpf');
    if (!hasSocioCpf) db.run("ALTER TABLE consumo ADD COLUMN socio_cpf TEXT NOT NULL DEFAULT ''");
  });
}


function ensureConsumoQuantidadeColumn() {
  db.all('PRAGMA table_info(consumo)', [], (err, columns) => {
    if (err) return;
    const hasQuantidade = columns.some((column) => column.name === 'quantidade');
    if (!hasQuantidade) db.run("ALTER TABLE consumo ADD COLUMN quantidade INTEGER NOT NULL DEFAULT 1");
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
ensureSociosCpfColumn();
ensureAulasEspacoColumn();
ensureInstrutoresCpfColumn();
ensureConsumoSocioCpfColumn();
ensureConsumoQuantidadeColumn();

createCrudRoutes('socios', 'socios', ['nome', 'cpf', 'email', 'telefone']);
createCrudRoutes('aulas', 'aulas', ['nome', 'instrutor', 'espaco', 'horario']);

function getConsumoColumns(callback) {
  db.all('PRAGMA table_info(consumo)', [], (err, columns) => {
    if (err) return callback(err);
    callback(null, columns.map((c) => c.name));
  });
}

app.post('/api/consumo', (req, res) => {
  const { socio_cpf, item, quantidade } = req.body;
  if (!socio_cpf || !item || quantidade === undefined || quantidade === '') {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  getConsumoColumns((err, columns) => {
    if (err) return res.status(500).json({ error: err.message });

    const fields = ['socio_cpf', 'item', 'quantidade'];
    const values = [socio_cpf, item, quantidade];

    if (columns.includes('socio_nome')) {
      fields.push('socio_nome');
      values.push(socio_cpf);
    }

    if (columns.includes('valor')) {
      fields.push('valor');
      values.push(quantidade);
    }

    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO consumo (${fields.join(', ')}) VALUES (${placeholders})`;

    db.run(sql, values, function (runErr) {
      if (runErr) return res.status(500).json({ error: runErr.message });
      res.status(201).json({ id: this.lastID, socio_cpf, item, quantidade });
    });
  });
});

app.get('/api/consumo', (req, res) => {
  db.all('SELECT * FROM consumo ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/consumo/:id', (req, res) => {
  const { id } = req.params;
  const { socio_cpf, item, quantidade } = req.body;
  if (!socio_cpf || !item || quantidade === undefined || quantidade === '') {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  getConsumoColumns((err, columns) => {
    if (err) return res.status(500).json({ error: err.message });

    const sets = ['socio_cpf = ?', 'item = ?', 'quantidade = ?'];
    const values = [socio_cpf, item, quantidade];

    if (columns.includes('socio_nome')) {
      sets.push('socio_nome = ?');
      values.push(socio_cpf);
    }

    if (columns.includes('valor')) {
      sets.push('valor = ?');
      values.push(quantidade);
    }

    const sql = `UPDATE consumo SET ${sets.join(', ')} WHERE id = ?`;
    db.run(sql, [...values, id], function (runErr) {
      if (runErr) return res.status(500).json({ error: runErr.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Registro não encontrado.' });
      res.json({ id: Number(id), socio_cpf, item, quantidade });
    });
  });
});

app.delete('/api/consumo/:id', (req, res) => {
  db.run('DELETE FROM consumo WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Registro não encontrado.' });
    res.json({ message: 'Registro removido com sucesso.' });
  });
});

createCrudRoutes('itens_consumo', 'itens_consumo', ['nome', 'valor']);
createCrudRoutes('instrutores', 'instrutores', ['nome', 'cpf', 'telefone']);
createCrudRoutes('espacos', 'espacos', ['nome', 'capacidade', 'status']);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
