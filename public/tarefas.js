let todasTarefas = [];
let filtroAtual = "todas";

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
  todasTarefas = await resposta.json();
  renderizarTarefas();
}

function renderizarTarefas() {
  const lista = document.getElementById("lista-tarefas");
  lista.innerHTML = "";

  const pendentes = todasTarefas.filter((t) => t.concluida === 0).length;
  const concluidas = todasTarefas.length - pendentes;
  document.getElementById("contador").textContent =
    `${pendentes} pendente(s) • ${concluidas} concluída(s)`;

  let visiveis = todasTarefas;
  if (filtroAtual === "pendentes") {
    visiveis = todasTarefas.filter((t) => t.concluida === 0);
  } else if (filtroAtual === "concluidas") {
    visiveis = todasTarefas.filter((t) => t.concluida === 1);
  }

  if (visiveis.length === 0) {
    const vazio = document.createElement("li");
    vazio.textContent = "Nenhuma tarefa por aqui.";
    lista.appendChild(vazio);
    return;
  }

  visiveis.forEach((tarefa) => {
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

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.addEventListener("click", () => {
      iniciarEdicao(tarefa, texto);
    });

    const botaoDeletar = document.createElement("button");
    botaoDeletar.textContent = "Deletar";
    botaoDeletar.addEventListener("click", () => {
      deletarTarefa(tarefa.id);
    });

    li.append(checkbox, texto, botaoEditar, botaoDeletar);
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

function iniciarEdicao(tarefa, texto) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = tarefa.titulo;
  texto.replaceWith(input);
  input.focus();

  let finalizado = false;

  async function salvar() {
    if (finalizado) return;
    finalizado = true;

    const novoTitulo = input.value.trim();
    if (novoTitulo && novoTitulo !== tarefa.titulo) {
      await fetch(`/tarefas/${tarefa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: novoTitulo,
          concluida: tarefa.concluida === 1,
        }),
      });
    }
    carregarTarefas();
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") salvar();
    if (e.key === "Escape") {
      finalizado = true;
      carregarTarefas();
    }
  });

  input.addEventListener("blur", salvar);
}

function iniciarEdicao(tarefa, texto) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = tarefa.titulo;
  texto.replaceWith(input);
  input.focus();

  let finalizado = false;

  async function salvar() {
    if (finalizado) return;
    finalizado = true;

    const novoTitulo = input.value.trim();
    if (novoTitulo && novoTitulo !== tarefa.titulo) {
      await fetch(`/tarefas/${tarefa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: novoTitulo,
          concluida: tarefa.concluida === 1,
        }),
      });
    }
    carregarTarefas();
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") salvar();
    if (e.key === "Escape") {
      finalizado = true;
      carregarTarefas();
    }
  });

  input.addEventListener("blur", salvar);
}

// Botões de filtro
document.querySelectorAll(".filtro").forEach((botao) => {
  botao.addEventListener("click", () => {
    filtroAtual = botao.dataset.filtro;

    document.querySelectorAll(".filtro").forEach((b) => b.classList.remove("ativo"));
    botao.classList.add("ativo");

    renderizarTarefas();
  });
});

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