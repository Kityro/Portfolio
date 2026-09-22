# Portfólio Otávio | Sistema de Gestão de Crédito

**Feito com IA, Lógica de programação, Boas Práticas e Automação de Desenvolvimento.**

Portal de gestão para consulta de dados cadastrais via CPF, exibindo nome completo, data de nascimento e situação de restrições no nome do cliente.

## Tecnologias

- **Backend**: Python + FastAPI + SQLAlchemy
- **Banco de Dados**: SQLite (local) com fallback automático para PostgreSQL
- **Frontend**: HTML, CSS, JavaScript puro
- **API Externa**: [CPFhub.io](https://cpfhub.io) para dados cadastrais reais

## Como rodar localmente

### 1. Pré-requisitos
- Python 3.10 ou superior instalado

### 2. Clone o repositório
```bash
git clone https://github.com/seu-usuario/projeto-mundo-mais.git
cd projeto-mundo-mais
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

### 4. Execute o servidor
```bash
python main.py
```

O terminal exibirá a URL local, por exemplo:
```
SERVER RUNNING ON: http://localhost:56013
```

Abra esse endereço no navegador para acessar o sistema.

## Estrutura do Projeto

```
projeto-mundo-mais/
├── main.py          # FastAPI - rotas da API
├── services.py      # Lógica de consulta CPFhub
├── models.py        # Modelos do banco de dados
├── schemas.py       # Schemas Pydantic
├── database.py      # Configuração SQLite/PostgreSQL
├── script.js        # Lógica do frontend
├── dashboard.html   # Painel principal
├── index.html       # Tela de login
├── notes.html       # Anotações de clientes
├── style.css        # Estilos globais
└── requirements.txt # Dependências Python
```

## Observações

- O banco de dados SQLite (`mundo_mais.db`) é criado automaticamente na primeira execução.
- Se houver PostgreSQL disponível, o sistema se conecta automaticamente a ele.
