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

const pageTitle = document.getElementById('page-title');
const panelTitle = document.getElementById('panel-title');
const form = document.getElementById('dynamic-form');
const list = document.getElementById('dynamic-list');

const col1 = document.getElementById('col-1');
const col2 = document.getElementById('col-2');
const col3 = document.getElementById('col-3');

init();

function init() {
  bindMenu();
  setupModule(currentModule);
}

function bindMenu() {
  document.querySelectorAll('.menu-btn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.menu-btn').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      setupModule(button.dataset.module);
    });
  });
}

function setupModule(moduleName) {
  currentModule = moduleName;
  const config = modules[moduleName];

  pageTitle.textContent = config.label;
  panelTitle.textContent = `Cadastro de ${config.label}`;
  col1.textContent = config.fields[0].placeholder;
  col2.textContent = config.fields[1].placeholder;
  col3.textContent = config.fields[2].placeholder;

  renderForm();
  renderList();
}

function renderForm() {
  const config = modules[currentModule];

  form.innerHTML = `
    <input type="hidden" name="id" />
    ${config.fields.map((f) => `<input name="${f.name}" placeholder="${f.placeholder}" required />`).join('')}
    <button class="btn btn-primary" type="submit">Salvar</button>
    <button class="btn btn-secondary" type="button" id="btn-cancel">Cancelar edição</button>
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
    renderList();
  };

  document.getElementById('btn-cancel').onclick = () => {
    form.reset();
    form.querySelector('input[name="id"]').value = '';
  };
}

async function renderList() {
  const response = await fetch(`/api/${currentModule}`);
  const items = await response.json();
  const config = modules[currentModule];

  list.innerHTML = items.map((item) => `
    <tr>
      <td>${item.id}</td>
      <td>${item[config.fields[0].name]}</td>
      <td>${item[config.fields[1].name]}</td>
      <td>${item[config.fields[2].name]}</td>
      <td>
        <button class="btn btn-edit" onclick='editItem(${JSON.stringify(item)})'>Editar</button>
        <button class="btn btn-delete" onclick='deleteItem(${item.id})'>Excluir</button>
      </td>
    </tr>
  `).join('');
}

function editItem(item) {
  const config = modules[currentModule];
  form.querySelector('input[name="id"]').value = item.id;

  config.fields.forEach((field) => {
    form.querySelector(`input[name="${field.name}"]`).value = item[field.name];
  });
}

async function deleteItem(id) {
  await fetch(`/api/${currentModule}/${id}`, { method: 'DELETE' });
  renderList();
}
