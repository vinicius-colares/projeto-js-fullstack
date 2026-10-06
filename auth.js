function mostrarTelaLogin() {
  document.getElementById("tela-login").classList.remove("escondido");
  document.getElementById("tela-registro").classList.add("escondido");
  document.getElementById("conteudo-principal").classList.add("escondido");
}

function mostrarTelaRegistro() {
  document.getElementById("tela-registro").classList.remove("escondido");
  document.getElementById("tela-login").classList.add("escondido");
  document.getElementById("conteudo-principal").classList.add("escondido");
}

function mostrarConteudoPrincipal() {
  document.getElementById("conteudo-principal").classList.remove("escondido");
  document.getElementById("tela-login").classList.add("escondido");
  document.getElementById("tela-registro").classList.add("escondido");
  carregarUsuarios();
}

// Checa se já está logado ao carregar a página
fetch("/sessao")
  .then(resposta => resposta.json())
  .then(dados => {
    if (dados.logado) {
      mostrarConteudoPrincipal();
    } else {
      mostrarTelaLogin();
    }
  });

// Links para trocar entre telas
document.getElementById("link-ir-registro").addEventListener("click", mostrarTelaRegistro);
document.getElementById("link-ir-login").addEventListener("click", mostrarTelaLogin);

// Formulário de login
document.getElementById("form-login").addEventListener("submit", function (evento) {
  evento.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha })
  }).then(resposta => {
    if (resposta.ok) {
      mostrarConteudoPrincipal();
    } else {
      mostrarToast("E-mail ou senha inválidos!", "erro");
    }
  });
});

// Formulário de registro
document.getElementById("form-registro").addEventListener("submit", function (evento) {
  evento.preventDefault();

  const email = document.getElementById("registro-email").value.trim();
  const senha = document.getElementById("registro-senha").value;

  fetch("/registro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha })
  }).then(resposta => {
    if (resposta.ok) {
      mostrarToast("Conta criada! Faça login.");
      mostrarTelaLogin();
    } else {
      mostrarToast("Erro ao criar conta. E-mail já cadastrado?", "erro");
    }
  });
});

// Botão de sair
document.getElementById("btn-sair").addEventListener("click", function () {
  fetch("/logout", { method: "POST" }).then(() => {
    mostrarTelaLogin();
  });
});