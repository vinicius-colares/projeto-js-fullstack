function mostrarToast(mensagem, tipo = "sucesso") {
  const toast = document.getElementById("toast");
  toast.textContent = mensagem;
  toast.className = tipo === "erro" ? "mostrar erro" : "mostrar";
  setTimeout(() => {
    toast.className = "";
  }, 2500);
}

function confirmarAcao(mensagem) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("overlay-confirmar");
    const texto = document.getElementById("texto-confirmar");
    const btnSim = document.getElementById("btn-confirmar-sim");
    const btnNao = document.getElementById("btn-confirmar-nao");

    texto.textContent = mensagem;
    overlay.classList.add("mostrar");

    function limpar(resultado) {
      overlay.classList.remove("mostrar");
      btnSim.removeEventListener("click", simClick);
      btnNao.removeEventListener("click", naoClick);
      resolve(resultado);
    }

    function simClick() { limpar(true); }
    function naoClick() { limpar(false); }

    btnSim.addEventListener("click", simClick);
    btnNao.addEventListener("click", naoClick);
  });
}

function abrirModalEditar(usuario) {
  const overlay = document.getElementById("overlay-editar");
  const inputNome = document.getElementById("editar-nome");
  const inputCurso = document.getElementById("editar-curso");
  const inputEmail = document.getElementById("editar-email");
  const btnSalvar = document.getElementById("btn-editar-salvar");
  const btnCancelar = document.getElementById("btn-editar-cancelar");

  inputNome.value = usuario.nome;
  inputCurso.value = usuario.curso;
  inputEmail.value = usuario.email;
  overlay.classList.add("mostrar");

  function fechar() {
    overlay.classList.remove("mostrar");
    btnSalvar.removeEventListener("click", salvar);
    btnCancelar.removeEventListener("click", fechar);
  }

  async function salvar() {
    const novoNome = inputNome.value.trim();
    const novoCurso = inputCurso.value.trim();
    const novoEmail = inputEmail.value.trim();

    if (novoNome === "" || novoCurso === "" || novoEmail === "") {
      mostrarToast("Preencha todos os campos corretamente!", "erro");
      return;
    }

    const resposta = await fetch(`/usuarios/${usuario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novoNome, curso: novoCurso, email: novoEmail })
    });

    if (!resposta.ok) {
      mostrarToast(await resposta.text(), "erro");
      return;
    }

    mostrarToast("Usuário atualizado!");
    carregarUsuarios();
    fechar();
  }

  btnSalvar.addEventListener("click", salvar);
  btnCancelar.addEventListener("click", fechar);
}

let todosUsuarios = [];

function carregarUsuarios() {
  const carregando = document.getElementById("carregando");
  carregando.textContent = "Carregando...";
  carregando.style.display = "block";

  fetch("/usuarios")
    .then(resposta => {
      if (!resposta.ok) {
        throw new Error("Não foi possível carregar");
      }
      return resposta.json();
    })
    .then(usuarios => {
      carregando.style.display = "none";
      todosUsuarios = usuarios;
      aplicarFiltroEOrdenacao();
    })
    .catch(() => {
      carregando.textContent = "Erro ao carregar. Tente recarregar a página.";
    });
}

function ordenarLista(usuarios, campo) {
  return [...usuarios].sort((a, b) => a[campo].localeCompare(b[campo]));
}

function aplicarFiltroEOrdenacao() {
  const termo = document.getElementById("input-busca").value.toLowerCase();
  const campoOrdenar = document.getElementById("select-ordenar").value;

  const filtrados = todosUsuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(termo)
  );
  const ordenados = ordenarLista(filtrados, campoOrdenar);
  renderizarLista(ordenados);
}

function renderizarLista(usuarios) {
  const lista = document.getElementById("lista-usuarios");
  lista.innerHTML = "";

  if (usuarios.length === 0) {
    lista.innerHTML = "<p style='color:#888;'>Nenhum usuário encontrado.</p>";
    return;
  }

  usuarios.forEach(usuario => {
    const item = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = `${usuario.nome} - ${usuario.curso} - ${usuario.email}`;

    const botaoEditar = document.createElement("button");
    botaoEditar.innerHTML = '<i class="fa-solid fa-pen"></i>';
    botaoEditar.onclick = function () {
      abrirModalEditar(usuario);
    };

    const botaoDeletar = document.createElement("button");
    botaoDeletar.innerHTML = '<i class="fa-solid fa-trash"></i>';
    botaoDeletar.onclick = async function () {
      const confirmou = await confirmarAcao(`Tem certeza que quer deletar ${usuario.nome}?`);
      if (confirmou) {
        fetch(`/usuarios/${usuario.id}`, {
          method: "DELETE"
        }).then(() => {
          mostrarToast("Usuário deletado!");
          carregarUsuarios();
        });
      }
    };

    item.appendChild(span);
    item.appendChild(botaoEditar);
    item.appendChild(botaoDeletar);
    lista.appendChild(item);
  });
}

document.getElementById("input-busca").addEventListener("input", aplicarFiltroEOrdenacao);
document.getElementById("select-ordenar").addEventListener("change", aplicarFiltroEOrdenacao);

const form = document.getElementById("form-usuario");
form.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const nome = document.getElementById("input-nome").value.trim();
  const curso = document.getElementById("input-curso").value.trim();
  const email = document.getElementById("input-email").value.trim();

  if (nome === "" || curso === "" || email === "") {
    mostrarToast("Preencha todos os campos corretamente!", "erro");
    return;
  }

  const resposta = await fetch("/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, curso, email })
  });

  if (!resposta.ok) {
    mostrarToast(await resposta.text(), "erro");
    return;
  }

  mostrarToast("Usuário adicionado!");
  carregarUsuarios();
  form.reset();
});