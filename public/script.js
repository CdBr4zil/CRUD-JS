const modules = {
  socios: {
    label: "Sócios",
    fields: [
      { name: "nome", placeholder: "Nome completo", type: "text" },
      { name: "cpf", placeholder: "CPF", type: "text" },
      { name: "email", placeholder: "E-mail", type: "email" },
      { name: "telefone", placeholder: "Telefone", type: "tel" },
    ],
  },
  instrutores: {
    label: "Instrutores",
    fields: [
      { name: "nome", placeholder: "Nome do instrutor", type: "text" },
      { name: "cpf", placeholder: "CPF do instrutor", type: "text" },
      { name: "telefone", placeholder: "Telefone", type: "tel" },
    ],
  },
  espacos: {
    label: "Espaços",
    fields: [
      { name: "nome", placeholder: "Nome do espaço", type: "text" },
      { name: "capacidade", placeholder: "Capacidade", type: "number" },
      { name: "status", placeholder: "Status", type: "select-status" },
    ],
  },
  itens_consumo: {
    label: "Itens de consumo",
    fields: [
      { name: "nome", placeholder: "Nome do item", type: "text" },
      { name: "valor", placeholder: "Valor", type: "number", step: "0.01" },
          ],
  },
  aulas: {
    label: "Aulas",
    fields: [
      { name: "nome", placeholder: "Nome da aula", type: "text" },
      { name: "instrutor", placeholder: "Instrutor", type: "select-instrutor" },
      { name: "espaco", placeholder: "Espaço", type: "select-espaco" },
      { name: "horario", placeholder: "Horário", type: "text" },
    ],
  },
  consumo: {
    label: "Consumo",
    fields: [
      { name: "socio_cpf", placeholder: "CPF do sócio", type: "select-socio" },
      { name: "item", placeholder: "Item consumido", type: "select-item" },
      { name: "valor", placeholder: "Valor", type: "number", step: "0.01" },
    ],
  },
};
let currentModule = "socios";
let currentItems = [];
let espacosOptions = [];
let instrutoresOptions = [];
let sociosOptions = [];
let itensConsumoOptions = [];

const pageTitle = document.getElementById("page-title");
const formTitle = document.getElementById("form-title");
const form = document.getElementById("dynamic-form");
const list = document.getElementById("dynamic-list");
const searchInput = document.getElementById("search-input");

init();
function init() { bindMenu(); searchInput.addEventListener("input", renderTable); setupModule("socios"); }
function bindMenu() { document.querySelectorAll(".menu-item").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll(".menu-item").forEach((b) => b.classList.remove("active")); button.classList.add("active"); setupModule(button.dataset.module); })); }

async function setupModule(moduleName) {
  currentModule = moduleName;
  const config = modules[moduleName];
  pageTitle.textContent = config.label;
  formTitle.textContent = `Cadastro de ${config.label}`;
  document.getElementById("col-1").textContent = config.fields[0].placeholder;
  document.getElementById("col-2").textContent = config.fields[1].placeholder;
  document.getElementById("col-3").textContent = config.fields[2]?.placeholder || "";

  if (currentModule === "aulas") await Promise.all([fetchEspacosOptions(), fetchInstrutoresOptions()]);
  if (currentModule === "consumo") await Promise.all([fetchSociosOptions(), fetchItensConsumoOptions()]);

  renderForm();
  fetchList();
}
const fetchEspacosOptions = async () => espacosOptions = await (await fetch('/api/espacos')).json();
const fetchInstrutoresOptions = async () => instrutoresOptions = await (await fetch('/api/instrutores')).json();
const fetchSociosOptions = async () => sociosOptions = await (await fetch('/api/socios')).json();
const fetchItensConsumoOptions = async () => itensConsumoOptions = await (await fetch('/api/itens_consumo')).json();

function renderField(field) {
  if (field.type === "select-espaco") return `<select name="espaco" required><option value="">Selecione um espaço</option>${espacosOptions.map((e) => `<option value="${e.nome}">${e.nome}</option>`).join("")}</select>`;
  if (field.type === "select-instrutor") return `<select name="instrutor" required><option value="">Selecione um instrutor</option>${instrutoresOptions.map((i) => `<option value="${i.nome}">${i.nome}</option>`).join("")}</select>`;
  if (field.type === "select-socio") return `<select name="socio_cpf" required><option value="">Selecione um sócio (CPF)</option>${sociosOptions.map((s) => `<option value="${s.cpf}">${s.nome} - ${s.cpf}</option>`).join("")}</select>`;
  if (field.type === "select-item") return `<select name="item" required><option value="">Selecione um item</option>${itensConsumoOptions.map((i) => `<option value="${i.nome}">${i.nome} - R$ ${Number(i.valor).toFixed(2)}</option>`).join("")}</select>`;
  if (field.type === "select-status") return `<select name="status" required><option value="">Selecione o status</option><option value="livre">livre</option><option value="ocupado">ocupado</option></select>`;

  const extra = field.name.includes("cpf") ? 'oninput="maskCpf(this)"' : field.name === "telefone" ? 'oninput="maskTel(this)"' : "";
  const step = field.step ? `step="${field.step}"` : "";
  return `<input type="${field.type}" name="${field.name}" placeholder="${field.placeholder}" ${step} required ${extra} />`;
}

function renderForm() {
  const config = modules[currentModule];
  form.innerHTML = `<input type="hidden" name="id"/>${config.fields.map(renderField).join("")}<button class="btn btn-primary" type="submit">Salvar</button><button class="btn btn-secondary" id="cancel-btn" type="button">Cancelar</button>`;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const id = data.get('id');
    const payload = {};
    config.fields.forEach((f) => { if (f.type !== 'hidden') payload[f.name] = data.get(f.name); });
    const response = await fetch(id ? `/api/${currentModule}/${id}` : `/api/${currentModule}`, { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) { const err = await response.json(); alert(err.error || 'Erro ao salvar registro.'); return; }
    form.reset(); form.querySelector('input[name="id"]').value = ''; fetchList();
  };
  document.getElementById('cancel-btn').onclick = () => { form.reset(); form.querySelector('input[name="id"]').value = ''; };
}

async function fetchList() { currentItems = await (await fetch(`/api/${currentModule}`)).json(); renderTable(); }
function renderTable() {
  const fields = modules[currentModule].fields.map((f) => f.name);
  const q = searchInput.value.trim().toLowerCase();
  const filtered = currentItems.filter((item) => fields.map((f) => String(item[f] ?? '')).join(' ').toLowerCase().includes(q) || String(item.id).includes(q));
  list.innerHTML = filtered.map((item) => `<tr><td>${item.id}</td><td>${item[fields[0]] ?? ''}</td><td>${item[fields[1]] ?? ''}</td><td>${item[fields[2]] ?? ''}</td><td><button class="btn btn-edit" onclick='editItem(${JSON.stringify(item)})'>Editar</button><button class="btn btn-delete" onclick='deleteItem(${item.id})'>Excluir</button></td></tr>`).join('');
}
function editItem(item) { form.querySelector('input[name="id"]').value = item.id; modules[currentModule].fields.forEach((f) => { const el = form.querySelector(`[name="${f.name}"]`); if (el) el.value = item[f.name] ?? ''; }); }
async function deleteItem(id) { if (!confirm('Deseja realmente excluir este registro?')) return; const r = await fetch(`/api/${currentModule}/${id}`, { method: 'DELETE' }); if (!r.ok) { const e = await r.json(); alert(e.error || 'Erro ao excluir registro.'); return; } fetchList(); }
function maskTel(input) { let v = input.value.replace(/\D/g,''); if (v.length>2) v=v.replace(/^(\d{2})(\d)/,'($1) $2'); if(v.length>9) v=v.replace(/(\d{5})(\d)/,'$1-$2'); input.value=v.substring(0,15); }
function maskCpf(input) { let v=input.value.replace(/\D/g,''); if(v.length>3) v=v.replace(/^(\d{3})(\d)/,'$1.$2'); if(v.length>7) v=v.replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3'); if(v.length>11) v=v.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/,'$1.$2.$3-$4'); input.value=v.substring(0,14); }
