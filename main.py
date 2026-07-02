from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, services
import socket
import uvicorn

# Initialize Database
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Mundo+ API", description="Backend para Consulta de CPF e Crédito")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return FileResponse("index.html")

@app.post("/consult", response_model=schemas.ConsultationResponse)
def create_consultation(request: schemas.CPFRequest, db: Session = Depends(database.get_db)):
    analysis_data = services.perform_credit_analysis(request.cpf)
    db_consultation = models.Consultation(**analysis_data)
    db.add(db_consultation)
    db.commit()
    db.refresh(db_consultation)
    return db_consultation

@app.get("/history", response_model=List[schemas.ConsultationResponse])
def get_history(db: Session = Depends(database.get_db)):
    return db.query(models.Consultation).order_by(models.Consultation.created_at.desc()).all()

@app.patch("/consult/{consult_id}", response_model=schemas.ConsultationResponse)
def update_consultation(consult_id: int, update_data: schemas.ConsultationUpdate, db: Session = Depends(database.get_db)):
    db_item = db.query(models.Consultation).filter(models.Consultation.id == consult_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/consult/{consult_id}")
def delete_consultation(consult_id: int, db: Session = Depends(database.get_db)):
    db_item = db.query(models.Consultation).filter(models.Consultation.id == consult_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted successfully"}

# Mount static files last
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import os
    def get_free_port():
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.bind(('', 0))
        port = s.getsockname()[1]
        s.close()
        return port

    port = int(os.environ.get("PORT", get_free_port()))
    # No emoji in print to avoid Windows console errors
    print(f"\n\nSERVER RUNNING ON: http://localhost:{port}\n\n")
    uvicorn.run(app, host="0.0.0.0", port=port)
