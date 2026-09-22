import random
import hashlib
import urllib.request
import json
import os

# Carrega variáveis do arquivo .env se disponível
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv não instalado, usa variáveis do sistema

API_KEY = os.getenv("CPFHUB_API_KEY", "")

def is_valid_cpf(cpf: str) -> bool:
    cpf = ''.join(filter(str.isdigit, str(cpf)))
    if len(cpf) != 11 or len(set(cpf)) == 1:
        return False
    
    for i in range(9, 11):
        value = sum((int(cpf[num]) * ((i + 1) - num) for num in range(0, i)))
        digit = ((value * 10) % 11) % 10
        if digit != int(cpf[i]):
            return False
    return True


def get_serasa_token() -> str:
    """
    Obtém o token OAuth 2.0 da Serasa Experian.
    Suporta Client Credentials (Basic Auth no header) de forma segura.
    """
    client_id = os.getenv("SERASA_CLIENT_ID", "").strip()
    client_secret = os.getenv("SERASA_CLIENT_SECRET", "").strip()
    auth_url = os.getenv("SERASA_AUTH_URL", "https://api.serasaexperian.com.br/security/iam/v1/user-identities").strip()
    
    if not client_id or not client_secret:
        return None
        
    try:
        import base64
        # Codifica client ID e Secret no formato Basic Auth para o header
        credentials = f"{client_id}:{client_secret}"
        encoded_creds = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
        
        # Envia como application/x-www-form-urlencoded
        data = b"grant_type=client_credentials"
        
        req = urllib.request.Request(
            auth_url,
            data=data,
            headers={
                "Authorization": f"Basic {encoded_creds}",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            # Trata múltiplos retornos possíveis (accessToken ou access_token)
            return res_data.get("accessToken") or res_data.get("access_token")
    except Exception as e:
        print(f"Erro de Autenticação Serasa: {e}")
        return None


def query_serasa_relatorio_pf(clean_cpf: str, token: str) -> dict:
    """
    Realiza a requisição ao produto Relatório Avançado PF da Serasa Experian.
    """
    api_url = os.getenv("SERASA_API_URL", "https://api.serasaexperian.com.br/rfe/v1/relatorio-avancado-pf").strip()
    
    # Payload padrão flexível recomendado para a API REST da Serasa PF
    payload = {
        "document": clean_cpf,
        "documentType": "CPF"
    }
    
    try:
        req = urllib.request.Request(
            api_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"Erro na consulta à API Serasa Relatório PF: {e}")
        return None


def parse_serasa_response(res: dict) -> dict:
    """
    Filtra e formata a resposta técnica da Serasa Experian
    para o formato compatível com o banco e o Front-end.
    """
    if not res:
        return None
        
    # Extrai o nome de possíveis caminhos estruturais (visando compatibilidade)
    name = (
        res.get("nome") or 
        res.get("nomePessoaFisica") or 
        res.get("nome_completo") or
        res.get("dados_cadastrais", {}).get("nome") or
        res.get("identificacao", {}).get("nome")
    )
    
    # Extrai data de nascimento
    birth_date = (
        res.get("dataNascimento") or 
        res.get("data_nascimento") or 
        res.get("dados_cadastrais", {}).get("data_nascimento") or
        res.get("identificacao", {}).get("data_nascimento") or
        res.get("dados_cadastrais", {}).get("nascimento")
    )
    
    # Extrai pontuação de Score
    score = 0
    score_val = (
        res.get("score") or 
        res.get("scoreCredito") or 
        res.get("score_credito") or
        res.get("dados_score", {}).get("valor") or
        res.get("dados_score", {}).get("pontuacao")
    )
    if isinstance(score_val, dict):
        score = score_val.get("valor") or score_val.get("pontuacao") or 0
    elif score_val is not None:
        try:
            score = int(score_val)
        except ValueError:
            pass
            
    # Extrai dívidas/restrições (Pefin, Protestos, Cheques, etc.)
    debt_amount = 0.0
    has_restriction = False
    creditors = []
    
    # 1. Total direto se fornecido pela Serasa
    total_db = res.get("valor_total_pendencias") or res.get("valorTotalPendencias") or res.get("total_dividas")
    if total_db:
        try:
            debt_amount = float(total_db)
        except ValueError:
            pass
            
    # 2. Varreduras em arrays comuns de anotações
    # PEFIN / REFIN
    pefin = res.get("pefin") or res.get("pendencias_financeiras") or res.get("refin")
    if isinstance(pefin, list):
        for item in pefin:
            val = item.get("valor") or item.get("valor_pendencia") or 0
            try:
                debt_amount += float(val)
            except ValueError:
                pass
            creditor = item.get("credor") or item.get("nome_credor") or item.get("origem")
            if creditor:
                creditors.append(creditor)
                
    # Protestos em Cartórios
    protests = res.get("protestos")
    if isinstance(protests, list):
        for item in protests:
            val = item.get("valor") or 0
            try:
                debt_amount += float(val)
            except ValueError:
                pass
            cartorio = item.get("cartorio") or item.get("origem") or "Cartório de Protestos"
            if cartorio:
                creditors.append(cartorio)
                
    # Valida restrição
    if debt_amount > 0 or len(creditors) > 0 or res.get("indicador_restricao") or res.get("tem_restricao"):
        has_restriction = True
        
    debt_location = "NADA CONSTA"
    if len(creditors) > 0:
        debt_location = ", ".join(list(dict.fromkeys(creditors))[:2]) # Remove duplicados e limita em 2
        
    return {
        "name": name,
        "birth_date": birth_date,
        "score": score,
        "debt_amount": int(debt_amount),
        "has_restriction": has_restriction,
        "debt_location": debt_location
    }


def perform_credit_analysis(cpf: str):
    """
    Performs credit analysis by trying to query Serasa Experian Advanced Report API first.
    If Serasa credentials are missing or call fails, falls back gracefully to CPFhub API
    and deterministic mock values.
    """
    clean_cpf = "".join(filter(str.isdigit, cpf))
    
    # 1. Tenta consulta ao Serasa Experian
    client_id = os.getenv("SERASA_CLIENT_ID", "").strip()
    client_secret = os.getenv("SERASA_CLIENT_SECRET", "").strip()
    
    if client_id and client_secret:
        print("[Serasa API] Credenciais detectadas. Iniciando consulta real...")
        token = get_serasa_token()
        if token:
            serasa_res = query_serasa_relatorio_pf(clean_cpf, token)
            parsed_data = parse_serasa_response(serasa_res)
            if parsed_data and parsed_data.get("name"):
                print("[Serasa API] Consulta realizada com sucesso!")
                
                # Adapta status e limites com base nos dados obtidos da Serasa
                score = parsed_data.get("score", 700)
                has_restriction = parsed_data.get("has_restriction", False)
                
                if score > 750 and not has_restriction:
                    status = "APROVADO"
                    # Determina um limite proporcional ao score
                    limit_rnd = score * 50
                    limit = f"R$ {limit_rnd:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    rate = "9.2% a.a."
                elif score > 500 and not has_restriction:
                    status = "EM ANÁLISE"
                    limit = "SOB CONSULTA"
                    rate = "11.8% a.a."
                else:
                    status = "NEGADO"
                    limit = "R$ 0,00"
                    rate = "N/A"
                    
                debt_amt = parsed_data.get("debt_amount", 0)
                debt_class = "SEM RESTRIÇÃO"
                if has_restriction:
                    debt_class = "ACIMA DE MIL" if debt_amt > 1000 else "ABAIXO DE MIL"
                
                # Suporta formatação de data
                birth_date = parsed_data.get("birth_date")
                if birth_date and len(birth_date) >= 10:
                    # Garantir formato DD/MM/AAAA se retornado no formato AAAA-MM-DD
                    if "-" in birth_date:
                        try:
                            parts = birth_date.split("T")[0].split("-")
                            birth_date = f"{parts[2]}/{parts[1]}/{parts[0]}"
                        except:
                            pass
                
                return {
                    "cpf": cpf,
                    "name": parsed_data.get("name"),
                    "birth_date": birth_date,
                    "score": score,
                    "status": status,
                    "restriction": "RESTRIÇÃO ATIVA" if has_restriction else "NADA CONSTA",
                    "debt_amount": debt_amt,
                    "debt_class": debt_class,
                    "debt_location": parsed_data.get("debt_location") or "NADA CONSTA",
                    "credit_limit": limit,
                    "interest_rate": rate,
                    "venda_status": "Em processo"
                }
            else:
                print("[Serasa API] Dados não puderam ser extraídos ou vazios. Iniciando fallback...")
        else:
            print("[Serasa API] Falha ao obter token OAuth 2.0. Iniciando fallback...")
    
    # FALLBACK ATIVO: CPFhub + Simulador (atual comportamento do sistema)
    print("[Fallback API] Usando dados CPFhub e simulação local.")
    real_name = None
    birth_date = None
    
    # Try calling CPFhub API
    try:
        url = f"https://api.cpfhub.io/cpf/{clean_cpf}"
        req = urllib.request.Request(
            url,
            headers={
                "x-api-key": API_KEY,
                "Accept": "application/json"
            }
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode())
            if res_data.get("success") and "data" in res_data:
                real_name = res_data["data"].get("name")
                birth_date = res_data["data"].get("birthDate")
    except Exception as e:
        print(f"CPFhub API error: {e}. Falling back to deterministic simulation.")
    
    # Generate seed based on clean CPF
    seed = int(hashlib.md5(clean_cpf.encode()).hexdigest(), 16)
    random.seed(seed)
    
    score = random.randint(300, 990)
    
    # If CPFhub fell back or failed, generate a mock but realistic name
    if not real_name:
        names = ["Carlos", "Mariana", "Roberto", "Patrícia", "Eduardo", "Cláudia", "Vinícius", "Letícia", "Felipe", "Monique"]
        surnames = ["Andrade", "Melo", "Fonseca", "Teixeira", "Gomes", "Vieira", "Cavalcanti", "Xavier"]
        real_name = f"{random.choice(names)} {random.choice(surnames)}"
        
    # If CPFhub fell back or failed, generate a mock birth date
    if not birth_date:
        day = random.randint(1, 28)
        month = random.randint(1, 12)
        year = random.randint(1950, 2003)
        birth_date = f"{day:02d}/{month:02d}/{year}"
        
    has_restriction = score < 500 or (score < 650 and random.random() > 0.8)
    
    if score > 750 and not has_restriction:
        status = "APROVADO"
        limit = f"R$ {random.randint(80, 450) * 1000:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        rate = "9.2% a.a."
    elif score > 500 and not has_restriction:
        status = "EM ANÁLISE"
        limit = "SOB CONSULTA"
        rate = "11.8% a.a."
    else:
        status = "NEGADO"
        limit = "R$ 0,00"
        rate = "N/A"
        
    # Generate deterministic debt
    debt_amount = 0
    debt_class = "SEM RESTRIÇÃO"
    debt_location = "NADA CONSTA"
    if has_restriction:
        debt_amount = random.randint(100, 5000)
        debt_class = "ACIMA DE MIL" if debt_amount > 1000 else "ABAIXO DE MIL"
        locations = ["SERASA", "SPC BRASIL", "CENTRAL DE PROTESTOS", "BANCO ITAÚ", "CAIXA ECONÔMICA", "BANCO SANTANDER"]
        debt_location = random.choice(locations)
        
    return {
        "cpf": cpf,
        "name": real_name,
        "birth_date": birth_date,
        "score": score,
        "status": status,
        "restriction": "RESTRIÇÃO ATIVA" if has_restriction else "NADA CONSTA",
        "debt_amount": debt_amount,
        "debt_class": debt_class,
        "debt_location": debt_location,
        "credit_limit": limit,
        "interest_rate": rate,
        "venda_status": "Em processo"
    }

