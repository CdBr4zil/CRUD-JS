// Configuração dos módulos e campos
const modules = {
  socios: ['nome', 'email', 'telefone'],
  aulas: ['nome', 'instrutor', 'horario'],
  consumo: ['socio_nome', 'item', 'valor'],
  espacos: ['nome', 'capacidade', 'status']
};

// Inicializa formulários e listas
Object.keys(modules).forEach((moduleName) => {
  const form = document.getElementById(`form-${moduleName}`);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const id = formData.get('id');
    const payload = {};

    modules[moduleName].forEach((field) => {
      payload[field] = formData.get(field);
    });

    if (id) {
      await updateItem(moduleName, id, payload);
    } else {
      await createItem(moduleName, payload);
    }

    form.reset();
    renderList(moduleName);
  });

  renderList(moduleName);
});

// CREATE
async function createItem(moduleName, data) {
  await fetch(`/api/${moduleName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// READ + montagem da lista
async function renderList(moduleName) {
  const response = await fetch(`/api/${moduleName}`);
  const items = await response.json();
  const list = document.getElementById(`lista-${moduleName}`);

  list.innerHTML = '';

  items.forEach((item) => {
    const li = document.createElement('li');

    const texto = document.createElement('span');
    texto.textContent = formatItem(moduleName, item);

    const acoes = document.createElement('div');
    acoes.className = 'acoes';

    const btnEditar = document.createElement('button');
    btnEditar.textContent = 'Editar';
    btnEditar.onclick = () => fillForm(moduleName, item);

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = 'Excluir';
    btnExcluir.onclick = async () => {
      await deleteItem(moduleName, item.id);
      renderList(moduleName);
    };

    acoes.appendChild(btnEditar);
    acoes.appendChild(btnExcluir);

    li.appendChild(texto);
    li.appendChild(acoes);
    list.appendChild(li);
  });
}

// UPDATE
async function updateItem(moduleName, id, data) {
  await fetch(`/api/${moduleName}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

function fillForm(moduleName, item) {
  const form = document.getElementById(`form-${moduleName}`);
  form.querySelector('input[name="id"]').value = item.id;

  modules[moduleName].forEach((field) => {
    form.querySelector(`input[name="${field}"]`).value = item[field];
  });
}

function cancelEdit(moduleName) {
  const form = document.getElementById(`form-${moduleName}`);
  form.reset();
  form.querySelector('input[name="id"]').value = '';
}

// DELETE
async function deleteItem(moduleName, id) {
  await fetch(`/api/${moduleName}/${id}`, {
    method: 'DELETE'
  });
}

// Apenas para mostrar os dados de cada módulo de forma simples
function formatItem(moduleName, item) {
  if (moduleName === 'socios') return `#${item.id} | ${item.nome} | ${item.email} | ${item.telefone}`;
  if (moduleName === 'aulas') return `#${item.id} | ${item.nome} | ${item.instrutor} | ${item.horario}`;
  if (moduleName === 'consumo') return `#${item.id} | ${item.socio_nome} | ${item.item} | R$ ${item.valor}`;
  if (moduleName === 'espacos') return `#${item.id} | ${item.nome} | Capacidade: ${item.capacidade} | ${item.status}`;
  return '';
}
