const modules = {
  socios: {
    label: "Sócios",
    fields: [
      { name: "nome", placeholder: "Nome Completo", type: "text" },
      { name: "cpf", placeholder: "CPF", type: "text" }, // Pode ser melhorado com máscara no futuro
      { name: "email", placeholder: "E-mail", type: "email" },
      { name: "telefone", placeholder: "Telefone", type: "tel" },
    ],
  },
  espacos: {
    label: "Espaços",
    fields: [
      { name: "nome", placeholder: "Nome do espaço", type: "text" },
      { name: "capacidade", placeholder: "Capacidade", type: "number" },
      { name: "status", placeholder: "Status (Livre/Ocupado)", type: "text" }, // Pode ser um dropdown no futuro
    ],
  },
  aulas: {
    label: "Aulas",
    fields: [
      { name: "nome", placeholder: "Nome da aula", type: "text" },
      { name: "instrutor", placeholder: "Instrutor", type: "text" },
      { name: "espaco", placeholder: "Espaço", type: "text" }, // Pode ser um dropdown no futuro
      { name: "horario", placeholder: "Horário", type: "text" },
    ],
  },
  // O modulo de consumo pode ser melhorado para ter itens já cadastrados
  consumo: {
    label: "Consumo",
    fields: [
      { name: "socio_cpf", placeholder: "CPF do sócio", type: "text" },
      { name: "item", placeholder: "Item consumido", type: "text" },
      { name: "valor", placeholder: "Valor", type: "number" }, // Pode ser melhorado com máscara no futuro
    ],
  },
};

let currentModule = "socios";
let currentItems = [];

const pageTitle = document.getElementById("page-title");
const formTitle = document.getElementById("form-title");
const form = document.getElementById("dynamic-form");
const list = document.getElementById("dynamic-list");
const searchInput = document.getElementById("search-input");

init();

function init() {
  bindMenu();
  searchInput.addEventListener("input", renderTable);
  setupModule("socios");
}

function bindMenu() {
  document.querySelectorAll(".menu-item").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".menu-item")
        .forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      setupModule(button.dataset.module);
    });
  });
}

function setupModule(moduleName) {
  currentModule = moduleName;
  const config = modules[moduleName];

  pageTitle.textContent = config.label;
  formTitle.textContent = `Cadastro de ${config.label}`;
  document.getElementById("col-1").textContent = config.fields[0].placeholder;
  document.getElementById("col-2").textContent = config.fields[1].placeholder;
  document.getElementById("col-3").textContent = config.fields[2].placeholder;

  renderForm();
  fetchList();
}

function renderForm() {
  const config = modules[currentModule];

  form.innerHTML = `
    <input type="hidden" name="id" />
    ${config.fields.map((f) => {
      
      let extraAttributes = '';
        if (f.type === 'tel') {
            extraAttributes = 'oninput="maskTel(this)"';
        }
      
        return `<input type="${f.type || "text"}" name="${f.name}" placeholder="${f.placeholder}" required ${extraAttributes} />`;
    }).join("")}
    
    <button class="btn btn-primary" type="submit">Salvar</button>
    <button class="btn btn-secondary" id="cancel-btn" type="button">Cancelar</button>
  `;

  form.onsubmit = async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const id = data.get("id");
    const payload = {};

    config.fields.forEach((field) => {
      payload[field.name] = data.get(field.name);
    });

    if (id) {
      await fetch(`/api/${currentModule}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`/api/${currentModule}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    form.reset();
    form.querySelector('input[name="id"]').value = "";
    fetchList();
  };

  document.getElementById("cancel-btn").onclick = () => {
    form.reset();
    form.querySelector('input[name="id"]').value = "";
  };
}

async function fetchList() {
  const response = await fetch(`/api/${currentModule}`);
  currentItems = await response.json();
  renderTable();
}

function renderTable() {
  const query = searchInput.value.trim().toLowerCase();
  const fields = modules[currentModule].fields.map((field) => field.name);

  const filtered = currentItems.filter((item) => {
    const text = fields
      .map((field) => String(item[field] ?? ""))
      .join(" ")
      .toLowerCase();
    return text.includes(query) || String(item.id).includes(query);
  });

  list.innerHTML = filtered
    .map(
      (item) => `
    <tr>
      <td>${item.id}</td>
      <td>${item[fields[0]]}</td>
      <td>${item[fields[1]]}</td>
      <td>${item[fields[2]]}</td>
      <td>
        <button class="btn btn-edit" onclick='editItem(${JSON.stringify(item)})'>Editar</button>
        <button class="btn btn-delete" onclick='deleteItem(${item.id})'>Excluir</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

function editItem(item) {
  form.querySelector('input[name="id"]').value = item.id;
  modules[currentModule].fields.forEach((field) => {
    form.querySelector(`input[name="${field.name}"]`).value = item[field.name];
  });
}

async function deleteItem(id) {
  await fetch(`/api/${currentModule}/${id}`, { method: "DELETE" });
  fetchList();
}

function maskTel(input) {
    // 1. Apaga tudo que NÃO for número
    let valor = input.value.replace(/\D/g, '');
    
    // 2. Coloca os parênteses (XX)
    if (valor.length > 2) {
        valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
    }
    
    // 3. Coloca o tracinho do número XXXXX-XXXX
    if (valor.length > 9) {
        valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    // 4. Trava o tamanho máximo para não digitarem números infinitos (ex: (11) 99999-9999 tem 15 caracteres)
    input.value = valor.substring(0, 15);
}