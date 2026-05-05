const modules = {
  socios: {
    label: 'Sócios',
    fields: [
      { name: 'nome', placeholder: 'Nome' },
      { name: 'email', placeholder: 'E-mail' },
      { name: 'telefone', placeholder: 'Telefone' }
    ]
  },
  espacos: {
    label: 'Espaços',
    fields: [
      { name: 'nome', placeholder: 'Nome do espaço' },
      { name: 'capacidade', placeholder: 'Capacidade' },
      { name: 'status', placeholder: 'Status (Livre/Ocupado)' }
    ]
  },
  aulas: {
    label: 'Aulas',
    fields: [
      { name: 'nome', placeholder: 'Nome da aula' },
      { name: 'instrutor', placeholder: 'Instrutor' },
      { name: 'horario', placeholder: 'Horário' }
    ]
  },
  consumo: {
    label: 'Consumo',
    fields: [
      { name: 'socio_nome', placeholder: 'Nome do sócio' },
      { name: 'item', placeholder: 'Item consumido' },
      { name: 'valor', placeholder: 'Valor' }
    ]
  }
};

let currentModule = 'socios';
let currentItems = [];

const pageTitle = document.getElementById('page-title');
const formTitle = document.getElementById('form-title');
const form = document.getElementById('dynamic-form');
const list = document.getElementById('dynamic-list');
const searchInput = document.getElementById('search-input');

init();

function init() {
  bindMenu();
  searchInput.addEventListener('input', renderTable);
  setupModule('socios');
}

function bindMenu() {
  document.querySelectorAll('.menu-item').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.menu-item').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      setupModule(button.dataset.module);
    });
  });
}

function setupModule(moduleName) {
  currentModule = moduleName;
  const config = modules[moduleName];

  pageTitle.textContent = config.label;
  formTitle.textContent = `Cadastro de ${config.label}`;
  document.getElementById('col-1').textContent = config.fields[0].placeholder;
  document.getElementById('col-2').textContent = config.fields[1].placeholder;
  document.getElementById('col-3').textContent = config.fields[2].placeholder;

  renderForm();
  fetchList();
}

function renderForm() {
  const config = modules[currentModule];

  form.innerHTML = `
    <input type="hidden" name="id" />
    ${config.fields.map((f) => `<input name="${f.name}" placeholder="${f.placeholder}" required />`).join('')}
    <button class="btn btn-primary" type="submit">Salvar</button>
    <button class="btn btn-secondary" id="cancel-btn" type="button">Cancelar</button>
  `;

  form.onsubmit = async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const id = data.get('id');
    const payload = {};

    config.fields.forEach((field) => {
      payload[field.name] = data.get(field.name);
    });

    if (id) {
      await fetch(`/api/${currentModule}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch(`/api/${currentModule}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    form.reset();
    form.querySelector('input[name="id"]').value = '';
    fetchList();
  };

  document.getElementById('cancel-btn').onclick = () => {
    form.reset();
    form.querySelector('input[name="id"]').value = '';
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
    const text = fields.map((field) => String(item[field] ?? '')).join(' ').toLowerCase();
    return text.includes(query) || String(item.id).includes(query);
  });

  list.innerHTML = filtered.map((item) => `
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
  `).join('');
}

function editItem(item) {
  form.querySelector('input[name="id"]').value = item.id;
  modules[currentModule].fields.forEach((field) => {
    form.querySelector(`input[name="${field.name}"]`).value = item[field.name];
  });
}

async function deleteItem(id) {
  await fetch(`/api/${currentModule}/${id}`, { method: 'DELETE' });
  fetchList();
}
