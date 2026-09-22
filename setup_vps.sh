#!/bin/bash

# Script de Configuração Automatizada da VPS para FastAPI Mundo+
# Funciona em Ubuntu 20.04/22.04/24.04 e Debian

# Garantir que o script seja executado como root
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, execute este script como root (Use sudo bash setup_vps.sh)."
  exit 1
fi

echo "========================================="
echo "  Iniciando Configuração do Mundo+ VPS   "
echo "========================================="

# 1. Atualizar Pacotes do Sistema
echo "--> Atualizando pacotes do sistema..."
apt update && apt upgrade -y
apt install python3-pip python3-venv git nginx curl ufw -y

# 2. Configurar Firewall (UFW)
echo "--> Configurando portas de rede (Firewall)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

# 3. Criar pasta e configurar permissões se necessário
WORKDIR="/var/www/projeto-mundo"
echo "--> Configurando diretório de trabalho em $WORKDIR..."
mkdir -p $WORKDIR
# Copiar arquivos do build de onde o script rodar para o diretório de destino
cp -r . $WORKDIR/
cd $WORKDIR

# 4. Criar ambiente virtual do Python e instalar dependências
echo "--> Configurando ambiente virtual Python..."
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# 5. Criar arquivo .env de Produção se não existir
if [ ! -f .env ]; then
  echo "--> Criando arquivo .env padrão..."
  cat <<EOT > .env
CPFHUB_API_KEY=d5ee4f23e9209757dc6f40acee606d70899291abf16c8fa1954b9a33d264f656
# Preencha suas credenciais do Serasa abaixo quando contratar
SERASA_CLIENT_ID=
SERASA_CLIENT_SECRET=
SERASA_AUTH_URL=https://api.serasaexperian.com.br/security/iam/v1/user-identities
SERASA_API_URL=https://api.serasaexperian.com.br/rfe/v1/relatorio-avancado-pf
EOT
fi

# 6. Criar serviço no Systemd (para rodar a aplicação em segundo plano)
echo "--> Criando serviço em segundo plano (Systemd)..."
cat <<EOT > /etc/systemd/system/mundo-mais.service
[Unit]
Description=FastAPI Mundo Mais Application
After=network.target

[Service]
User=root
WorkingDirectory=$WORKDIR
ExecStart=$WORKDIR/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOT

# Reiniciar e ativar o serviço
systemctl daemon-reload
systemctl enable mundo-mais
systemctl restart mundo-mais

# 7. Configurar Nginx como Proxy Reverso
echo "--> Configurando servidor web Nginx..."
cat <<EOT > /etc/nginx/sites-available/mundo-mais
server {
    listen 80;
    server_name localhost; # Pode alterar depois para seu domínio (ex: seusite.com)

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    client_max_body_size 20M; # Permite uploads maiores para consultas em lote
}
EOT

# Ativar configuração no Nginx e recarregar
if [ -f /etc/nginx/sites-enabled/default ]; then
  rm /etc/nginx/sites-enabled/default
fi

ln -sf /etc/nginx/sites-available/mundo-mais /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo "========================================="
echo " Configuração finalizada com sucesso!    "
echo " A aplicação está rodando em segundo plano. "
echo " Acesse o IP público da sua VPS no navegador."
echo "========================================="
