const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./banco");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET || "segredo-so-para-desenvolvimento-local",
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

// Ferramentas de validação
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function textoValido(valor, max = 100) {
  return typeof valor === "string" && valor.trim() !== "" && valor.trim().length <= max;
}

// ---------- TAREFAS ----------

app.get("/tarefas", exigirLogin, (req, res) => {
  const tarefas = db
    .prepare("SELECT * FROM tarefas WHERE conta_id = ?")
    .all(req.session.contaId);
  res.json(tarefas);
});

app.post("/tarefas", exigirLogin, (req, res) => {
  const { titulo } = req.body;

  if (!textoValido(titulo, 200)) {
    return res.status(400).send("O título é obrigatório (até 200 caracteres).");
  }

  const resultado = db
    .prepare("INSERT INTO tarefas (titulo, conta_id) VALUES (?, ?)")
    .run(titulo.trim(), req.session.contaId);

  res.json({ id: resultado.lastInsertRowid, titulo: titulo.trim(), concluida: 0 });
});

// Atualizar tarefa (título e/ou concluída)
app.put("/tarefas/:id", exigirLogin, (req, res) => {
  const { titulo, concluida } = req.body;

  if (!textoValido(titulo, 200)) {
    return res.status(400).send("O título é obrigatório (até 200 caracteres).");
  }

  const resultado = db
    .prepare("UPDATE tarefas SET titulo = ?, concluida = ? WHERE id = ? AND conta_id = ?")
    .run(titulo.trim(), concluida ? 1 : 0, req.params.id, req.session.contaId);

  if (resultado.changes === 0) {
    return res.status(404).send("Tarefa não encontrada.");
  }

  res.send("Tarefa atualizada!");
});

// Deletar tarefa
app.delete("/tarefas/:id", exigirLogin, (req, res) => {
  const resultado = db
    .prepare("DELETE FROM tarefas WHERE id = ? AND conta_id = ?")
    .run(req.params.id, req.session.contaId);

  if (resultado.changes === 0) {
    return res.status(404).send("Tarefa não encontrada.");
  }

  res.send("Tarefa deletada!");
});

// ---------- PERFIL ----------

app.put("/perfil/senha", exigirLogin, async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  if (
    typeof senhaAtual !== "string" ||
    typeof novaSenha !== "string" ||
    !senhaAtual ||
    !novaSenha
  ) {
    return res.status(400).send("Preencha a senha atual e a nova senha.");
  }

  if (novaSenha.length < 6 || novaSenha.length > 72) {
    return res.status(400).send("A nova senha precisa ter entre 6 e 72 caracteres.");
  }

  const conta = db
    .prepare("SELECT * FROM contas WHERE id = ?")
    .get(req.session.contaId);

  const senhaCorreta = await bcrypt.compare(senhaAtual, conta.senha);

  if (!senhaCorreta) {
    return res.status(401).send("Senha atual incorreta.");
  }

  const novaCriptografada = await bcrypt.hash(novaSenha, 10);

  db.prepare("UPDATE contas SET senha = ? WHERE id = ?")
    .run(novaCriptografada, req.session.contaId);

  res.send("Senha alterada com sucesso!");
});

// ---------- ROTAS DE TESTE ----------

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

// ---------- USUÁRIOS ----------

app.get("/usuarios", (req, res) => {
  const usuarios = db.prepare("SELECT * FROM usuarios").all();
  res.json(usuarios);
});

app.post("/usuarios", exigirLogin, (req, res) => {
  const { nome, curso, email } = req.body;

  if (!textoValido(nome) || !textoValido(curso) || !textoValido(email)) {
    return res.status(400).send("Preencha nome, curso e e-mail (até 100 caracteres cada).");
  }

  if (!REGEX_EMAIL.test(email.trim())) {
    return res.status(400).send("E-mail inválido.");
  }

  db.prepare("INSERT INTO usuarios (nome, curso, email) VALUES (?, ?, ?)")
    .run(nome.trim(), curso.trim(), email.trim());

  res.send(`Usuário ${nome.trim()} adicionado com sucesso via POST!`);
});

app.put("/usuarios/:id", exigirLogin, (req, res) => {
  const { id } = req.params;
  const { nome, curso, email } = req.body;

  if (!textoValido(nome) || !textoValido(curso) || !textoValido(email)) {
    return res.status(400).send("Preencha nome, curso e e-mail (até 100 caracteres cada).");
  }

  if (!REGEX_EMAIL.test(email.trim())) {
    return res.status(400).send("E-mail inválido.");
  }

  const resultado = db
    .prepare("UPDATE usuarios SET nome = ?, curso = ?, email = ? WHERE id = ?")
    .run(nome.trim(), curso.trim(), email.trim(), id);

  if (resultado.changes === 0) {
    return res.status(404).send("Usuário não encontrado.");
  }

  res.send(`Usuário ${id} atualizado com sucesso!`);
});

app.delete("/usuarios/:id", exigirLogin, (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM usuarios WHERE id = ?").run(id);
  res.send(`Usuário ${id} deletado com sucesso!`);
});

// ---------- CONTAS (registro, login, logout, sessão) ----------

// Registro de nova conta
app.post("/registro", async (req, res) => {
  const { email, senha } = req.body;

  if (!textoValido(email) || typeof senha !== "string") {
    return res.status(400).send("Preencha e-mail e senha.");
  }

  const emailLimpo = email.trim();

  if (!REGEX_EMAIL.test(emailLimpo)) {
    return res.status(400).send("E-mail inválido.");
  }

  if (senha.length < 6 || senha.length > 72) {
    return res.status(400).send("A senha precisa ter entre 6 e 72 caracteres.");
  }

  const senhaCriptografada = await bcrypt.hash(senha, 10);

  try {
    db.prepare("INSERT INTO contas (email, senha) VALUES (?, ?)").run(emailLimpo, senhaCriptografada);
    res.send("Conta criada com sucesso!");
  } catch (erro) {
    res.status(400).send("Esse e-mail já está cadastrado.");
  }
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (typeof email !== "string" || typeof senha !== "string") {
    return res.status(400).send("Preencha e-mail e senha.");
  }

  const conta = db.prepare("SELECT * FROM contas WHERE email = ?").get(email.trim());

  if (!conta) {
    return res.status(401).send("E-mail ou senha inválidos.");
  }

  const senhaCorreta = await bcrypt.compare(senha, conta.senha);

  if (!senhaCorreta) {
    return res.status(401).send("E-mail ou senha inválidos.");
  }

  req.session.logado = true;
  req.session.email = conta.email;
  req.session.contaId = conta.id;
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