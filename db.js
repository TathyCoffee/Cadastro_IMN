const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS alunos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      registro_interno TEXT,
      cad_nis TEXT,
      data_nasc TEXT,
      tipo_deficiencia TEXT,
      contato TEXT,
      endereco_responsavel TEXT,
      renda_percapita REAL,
      termo_uso_imagem INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS modalidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aluno_id INTEGER,
      nome_modalidade TEXT,
      FOREIGN KEY(aluno_id) REFERENCES alunos(id)
    )
  `);
});

module.exports = db;
