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

def perform_credit_analysis(cpf: str):
    """
    Performs credit analysis by fetching the real registration details (name and birth date)
    from CPFhub, and then deterministically simulating the credit score and restriction data.
    """
    clean_cpf = "".join(filter(str.isdigit, cpf))
    
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
        
    return {
        "cpf": cpf,
        "name": real_name,
        "birth_date": birth_date,
        "score": score,
        "status": status,
        "restriction": "RESTRIÇÃO ATIVA" if has_restriction else "NADA CONSTA",
        "credit_limit": limit,
        "interest_rate": rate,
        "venda_status": "Em processo"
    }
