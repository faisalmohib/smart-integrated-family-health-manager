from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import json

from database import get_db
from chat_history import ChatHistory
from ai.rag import HealthcareRAG


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/symptoms",
    tags=["Symptom Checker"]
)


# =========================================================
# REQUEST MODEL
# =========================================================

class SymptomRequest(BaseModel):

    symptoms: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="Symptoms provided by the user"
    )


# =========================================================
# INITIALIZE RAG
# =========================================================

rag = HealthcareRAG()


# =========================================================
# SYMPTOM CHECKER
# =========================================================

@router.post("/check")
def check_symptoms(
    request: SymptomRequest,
    db: Session = Depends(get_db)
):

    try:

        # -------------------------------------------------
        # Generate AI response
        # -------------------------------------------------

        result = rag.generate_response(
            symptoms=request.symptoms,
            top_k=5
        )

        # -------------------------------------------------
        # Convert AI response to text
        # -------------------------------------------------

        answer_text = json.dumps(
            result,
            ensure_ascii=False,
            indent=2
        )

        # -------------------------------------------------
        # Save chat history
        # -------------------------------------------------

        chat = ChatHistory(
            question=request.symptoms,
            answer=answer_text
        )

        db.add(chat)

        db.commit()

        db.refresh(chat)

        # -------------------------------------------------
        # Return response
        # -------------------------------------------------

        return {
            "success": True,
            "symptoms": request.symptoms,
            "response": result,
            "chat_id": chat.id
        }

    except Exception as error:

        db.rollback()

        print(
            f"Symptom checker error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to process symptoms at this time."
        )


# =========================================================
# DEBUG SYMPTOMS
# =========================================================

@router.post("/debug")
def debug_symptoms(
    request: SymptomRequest
):

    try:

        # -------------------------------------------------
        # Retrieve RAG context
        # -------------------------------------------------

        context, documents = rag.retrieve_context(
            symptoms=request.symptoms,
            top_k=8
        )

        return {
            "success": True,
            "symptoms": request.symptoms,
            "retrieved_documents": documents,
            "context": context
        }

    except Exception as error:

        print(
            f"Debug error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve medical information."
        )