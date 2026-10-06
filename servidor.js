const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");

app.use(cors());
app.use(express.json());
app.use(express.static("."));

app.use(session({
  secret: "segredo-super-secreto",
  resave: false,
  saveUninitialized: false
}));

function exigirLogin(req, res, next) {
  if (req.session.logado) {
    next();
  } else {
    res.status(401).send("Você precisa estar logado.");
  }
}

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

app.post("/usuarios", exigirLogin, (req, res) => {
  const { nome, curso, email } = req.body;
  db.prepare("INSERT INTO usuarios (nome, curso, email) VALUES (?, ?, ?)").run(nome, curso, email);
  res.send(`Usuário ${nome} adicionado com sucesso via POST!`);
});

app.put("/usuarios/:id", exigirLogin, (req, res) => {
  const { id } = req.params;
  const { nome, curso, email } = req.body;
  db.prepare("UPDATE usuarios SET nome = ?, curso = ?, email = ? WHERE id = ?").run(nome, curso, email, id);
  res.send(`Usuário ${id} atualizado com sucesso!`);
});

app.delete("/usuarios/:id", exigirLogin, (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM usuarios WHERE id = ?").run(id);
  res.send(`Usuário ${id} deletado com sucesso!`);
});

// Registro de nova conta
app.post("/registro", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).send("Preencha e-mail e senha.");
  }

  const senhaCriptografada = await bcrypt.hash(senha, 10);

  try {
    db.prepare("INSERT INTO contas (email, senha) VALUES (?, ?)").run(email, senhaCriptografada);
    res.send("Conta criada com sucesso!");
  } catch (erro) {
    res.status(400).send("Esse e-mail já está cadastrado.");
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const conta = db.prepare("SELECT * FROM contas WHERE email = ?").get(email);

  if (!conta) {
    return res.status(401).send("E-mail ou senha inválidos.");
  }

  const senhaCorreta = await bcrypt.compare(senha, conta.senha);

  if (!senhaCorreta) {
    return res.status(401).send("E-mail ou senha inválidos.");
  }

  req.session.logado = true;
  req.session.email = conta.email;
  res.send("Login realizado com sucesso!");
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.send("Logout realizado!");
  });
});

// Verifica se está logado
app.get("/sessao", (req, res) => {
  res.json({ logado: !!req.session.logado, email: req.session.email || null });
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`servidor rodando em http://localhost:${PORTA}`);
});