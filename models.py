from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    cpf = Column(String, index=True)
    name = Column(String)
    birth_date = Column(String, nullable=True)
    score = Column(Integer)
    status = Column(String)  # APROVADO, NEGADO, EM ANÁLISE
    venda_status = Column(String, default="Em processo")
    restriction = Column(String)  # NADA CONSTA, RESTRIÇÃO ATIVA
    credit_limit = Column(String)
    interest_rate = Column(String)
    debt_amount = Column(Integer, nullable=True)
    debt_class = Column(String, nullable=True)
    debt_location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
