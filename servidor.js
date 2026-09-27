const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
const db = require("./banco");

app.get("/", (req, res) => {
  res.send("Olá, meu primeiro servidor!");
});

app.get("/sobre", (req, res) => {
  res.send("Esta é a página sobre mim!");
});

app.get("/usuario", (req, res) => {
  res.json({ nome: "Vini", curso: "Análise e Desenvolvimento de Sistemas" });
});

app.get("/produto/:id", (req, res) => {
  res.send(`Você pediu o produto de número ${req.params.id}`);
});

app.get("/usuarios", (req, res) => {
  const usuarios = db.prepare("SELECT * FROM usuarios").all();
  res.json(usuarios);
});

app.get("/usuarios/adicionar/:nome/:curso", (req, res) => {
  const { nome, curso } = req.params;
  db.prepare("INSERT INTO usuarios (nome, curso) VALUES (?, ?)").run(nome, curso);
  res.send(`Usuário ${nome} adicionado com sucesso!`);
});

app.post("/usuarios", (req, res) => {
  const { nome, curso } = req.body;
  db.prepare("INSERT INTO usuarios (nome, curso) VALUES (?, ?)").run(nome, curso);
  res.send(`Usuário ${nome} adicionado com sucesso via POST!`);
});

app.put("/usuarios/:id", (req, res) => {
  const { id } = req.params;
  const { nome, curso } = req.body;
  db.prepare("UPDATE usuarios SET nome = ?, curso = ? WHERE id = ?").run(nome, curso, id);
  res.send(`Usuário ${id} atualizado com sucesso!`);
});

app.delete("/usuarios/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM usuarios WHERE id = ?").run(id);
  res.send(`Usuário ${id} deletado com sucesso!`);
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`servidor rodando em http://localhost:${PORTA}`);
});