// Se não estiver logado, volta para a tela de login
async function verificarSessao() {
  const resposta = await fetch("/sessao");
  const dados = await resposta.json();
  if (!dados.logado) {
    window.location.href = "/index.html";
  }
}

async function carregarTarefas() {
  const resposta = await fetch("/tarefas");
  const tarefas = await resposta.json();
  renderizarTarefas(tarefas);
}

function renderizarTarefas(tarefas) {
  const lista = document.getElementById("lista-tarefas");
  lista.innerHTML = "";

  tarefas.forEach((tarefa) => {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = tarefa.concluida === 1;
    checkbox.addEventListener("change", () => {
      alternarConcluida(tarefa, checkbox.checked);
    });

    const texto = document.createElement("span");
    texto.textContent = tarefa.titulo;
    if (tarefa.concluida === 1) {
      texto.style.textDecoration = "line-through";
    }

    const botaoDeletar = document.createElement("button");
    botaoDeletar.textContent = "Deletar";
    botaoDeletar.addEventListener("click", () => {
      deletarTarefa(tarefa.id);
    });

    li.append(checkbox, texto, botaoDeletar);
    lista.appendChild(li);
  });
}

async function alternarConcluida(tarefa, concluida) {
  await fetch(`/tarefas/${tarefa.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titulo: tarefa.titulo, concluida }),
  });
  carregarTarefas();
}

async function deletarTarefa(id) {
  await fetch(`/tarefas/${id}`, { method: "DELETE" });
  carregarTarefas();
}

document.getElementById("form-tarefa").addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = document.getElementById("titulo");
  const titulo = input.value.trim();
  if (!titulo) return;

  await fetch("/tarefas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titulo }),
  });

  input.value = "";
  carregarTarefas();
});

verificarSessao().then(carregarTarefas);