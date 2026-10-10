async function carregarPerfil() {
  const resposta = await fetch("/sessao");
  const dados = await resposta.json();

  if (!dados.logado) {
    window.location.href = "/index.html";
    return;
  }

  document.getElementById("perfil-email").textContent = dados.email;
}

document.getElementById("form-senha").addEventListener("submit", async (e) => {
  e.preventDefault();

  const senhaAtual = document.getElementById("senha-atual").value;
  const novaSenha = document.getElementById("nova-senha").value;
  const mensagem = document.getElementById("mensagem-senha");

  const resposta = await fetch("/perfil/senha", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });

  mensagem.textContent = await resposta.text();
  mensagem.style.color = resposta.ok ? "green" : "red";

  if (resposta.ok) {
    e.target.reset();
  }
});

carregarPerfil();