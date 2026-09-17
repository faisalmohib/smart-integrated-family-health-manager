from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from chat_history import ChatHistory

router = APIRouter(
    prefix="/api/chat-history",
    tags=["Chat History"]
)


@router.get("/")
def get_chat_history(
    db: Session = Depends(get_db)
):

    chats = (
        db.query(ChatHistory)
        .order_by(ChatHistory.date.desc())
        .all()
    )

    return {
        "success": True,
        "history": [
            {
                "id": chat.id,
                "question": chat.question,
                "answer": chat.answer,
                "date": (
                    chat.date.isoformat()
                    if chat.date
                    else None
                )
            }
            for chat in chats
        ]
    }


@router.delete("/{chat_id}")
def delete_chat(
    chat_id: int,
    db: Session = Depends(get_db)
):

    chat = (
        db.query(ChatHistory)
        .filter(ChatHistory.id == chat_id)
        .first()
    )

    if not chat:
        raise HTTPException(
            status_code=404,
            detail="Chat history not found."
        )

    db.delete(chat)
    db.commit()

    return {
        "success": True,
        "message": "Chat history deleted successfully."
    }