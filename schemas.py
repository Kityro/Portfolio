from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ConsultationBase(BaseModel):
    cpf: str
    name: str
    birth_date: Optional[str] = None
    score: int
    status: str
    venda_status: Optional[str] = "Em processo"
    restriction: str
    credit_limit: str
    interest_rate: str
    debt_amount: Optional[int] = 0
    debt_class: Optional[str] = ""
    debt_location: Optional[str] = ""
    notes: Optional[str] = ""

class ConsultationCreate(ConsultationBase):
    pass

class ConsultationUpdate(BaseModel):
    venda_status: Optional[str] = None
    notes: Optional[str] = None

class ConsultationResponse(ConsultationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CPFRequest(BaseModel):
    cpf: str
