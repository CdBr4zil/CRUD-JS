# 🏊 Sistema CRUD — Clube Recreativo

Sistema web administrativo para gerenciamento de um clube recreativo, desenvolvido com JavaScript no frontend e Node.js com Express no backend. Permite cadastrar, editar, buscar e excluir registros de sócios, espaços, aulas e consumo.

---

## 🚀 Tecnologias

- **Node.js** + **Express.js** — servidor e API REST
- **SQLite3** — banco de dados local (gerado automaticamente)
- **HTML5**, **CSS3** e **JavaScript** — interface do painel administrativo

---

## 📋 Funcionalidades

- Painel com 4 módulos: **Sócios**, **Espaços**, **Aulas** e **Consumo**
- CRUD completo (criar, listar, editar e excluir registros)
- Busca em tempo real na tabela de listagem
- Interface responsiva com sidebar de navegação
- Banco de dados SQLite gerado automaticamente na primeira execução

---

## ⚙️ Como rodar localmente

**Pré-requisitos:** Node.js instalado

```bash
# 1. Clone o repositório
git clone https://github.com/CdBr4zil/CRUD-JS.git
cd CRUD-JS

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm start
```

Acesse em: [http://localhost:3000](http://localhost:3000)

> O arquivo `database.db` será criado automaticamente na raiz do projeto.

---

## 🔌 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/:modulo` | Lista todos os registros |
| `POST` | `/api/:modulo` | Cria um novo registro |
| `PUT` | `/api/:modulo/:id` | Atualiza um registro |
| `DELETE` | `/api/:modulo/:id` | Remove um registro |

> `:modulo` pode ser `socios`, `espacos`, `aulas` ou `consumo`.

---
