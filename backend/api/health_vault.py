from pathlib import Path
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form
)

from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from database import SessionLocal

from models import (
    HealthProfile,
    HealthRecord
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/health-vault",
    tags=["Health Vault"]
)


# =========================================================
# PATHS
# =========================================================

BACKEND_DIR = Path(__file__).resolve().parents[1]

UPLOAD_DIR = BACKEND_DIR / "uploads"

PRESCRIPTION_DIR = UPLOAD_DIR / "prescriptions"
LAB_REPORT_DIR = UPLOAD_DIR / "lab_reports"
XRAY_DIR = UPLOAD_DIR / "xray"
OTHER_DIR = UPLOAD_DIR / "other"


# Create directories

PRESCRIPTION_DIR.mkdir(
    parents=True,
    exist_ok=True
)

LAB_REPORT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

XRAY_DIR.mkdir(
    parents=True,
    exist_ok=True
)

OTHER_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# =========================================================
# DATABASE DEPENDENCY
# =========================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()


# =========================================================
# ALLOWED FILE TYPES
# =========================================================

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png"
}


MAX_FILE_SIZE = 10 * 1024 * 1024


# =========================================================
# GET HEALTH PROFILE
# =========================================================

@router.get("/profile")
def get_health_profile(
    db: Session = Depends(get_db)
):

    profile = (
        db.query(HealthProfile)
        .first()
    )

    if not profile:

        return {
            "success": True,
            "profile": None
        }

    return {
        "success": True,
        "profile": {
            "id": profile.id,
            "blood_group": profile.blood_group,
            "allergies": profile.allergies,
            "medical_history": profile.medical_history,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at
        }
    }


# =========================================================
# CREATE / UPDATE HEALTH PROFILE
# =========================================================

@router.post("/profile")
def save_health_profile(

    blood_group: str = Form(""),

    allergies: str = Form(""),

    medical_history: str = Form(""),

    db: Session = Depends(get_db)
):

    profile = (
        db.query(HealthProfile)
        .first()
    )

    # -----------------------------------------------------
    # Create profile
    # -----------------------------------------------------

    if not profile:

        profile = HealthProfile(

            blood_group=blood_group.strip(),

            allergies=allergies.strip(),

            medical_history=medical_history.strip()
        )

        db.add(profile)

    # -----------------------------------------------------
    # Update profile
    # -----------------------------------------------------

    else:

        profile.blood_group = (
            blood_group.strip()
        )

        profile.allergies = (
            allergies.strip()
        )

        profile.medical_history = (
            medical_history.strip()
        )

        profile.updated_at = datetime.utcnow()

    db.commit()

    db.refresh(profile)

    return {
        "success": True,
        "message": "Health profile saved successfully.",
        "profile": {
            "id": profile.id,
            "blood_group": profile.blood_group,
            "allergies": profile.allergies,
            "medical_history": profile.medical_history
        }
    }


# =========================================================
# UPLOAD HEALTH RECORD
# =========================================================

@router.post("/records")
async def upload_health_record(

    record_type: str = Form(...),

    file: UploadFile = File(...),

    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Validate record type
    # -----------------------------------------------------

    allowed_record_types = {
        "prescription",
        "lab_report",
        "xray",
        "other"
    }

    if record_type not in allowed_record_types:

        raise HTTPException(
            status_code=400,
            detail="Invalid record type."
        )


    # -----------------------------------------------------
    # Validate filename
    # -----------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )


    # -----------------------------------------------------
    # Validate extension
    # -----------------------------------------------------

    extension = (
        Path(file.filename)
        .suffix
        .lower()
    )

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF, JPG, JPEG and PNG "
                "files are allowed."
            )
        )


    # -----------------------------------------------------
    # Select upload directory
    # -----------------------------------------------------

    if record_type == "prescription":

        directory = PRESCRIPTION_DIR

    elif record_type == "lab_report":

        directory = LAB_REPORT_DIR

    elif record_type == "xray":

        directory = XRAY_DIR

    else:

        directory = OTHER_DIR


    # -----------------------------------------------------
    # Generate unique filename
    # -----------------------------------------------------

    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S_%f"
    )

    safe_filename = (
        f"{timestamp}{extension}"
    )

    file_path = directory / safe_filename


    # -----------------------------------------------------
    # Read file
    # -----------------------------------------------------

    file_content = await file.read()


    # -----------------------------------------------------
    # Validate size
    # -----------------------------------------------------

    if len(file_content) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=400,
            detail="File size must be less than 10 MB."
        )


    # -----------------------------------------------------
    # Save file
    # -----------------------------------------------------

    with open(
        file_path,
        "wb"
    ) as output_file:

        output_file.write(
            file_content
        )


    # -----------------------------------------------------
    # Save database record
    # -----------------------------------------------------

    record = HealthRecord(

        record_type=record_type,

        file_name=file.filename,

        file_path=str(file_path)
    )

    db.add(record)

    db.commit()

    db.refresh(record)


    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "success": True,

        "message": "Health record uploaded successfully.",

        "record": {

            "id": record.id,

            "record_type": record.record_type,

            "file_name": record.file_name,

            "uploaded_at": record.uploaded_at
        }
    }


# =========================================================
# GET ALL RECORDS
# =========================================================

@router.get("/records")
def get_health_records(

    db: Session = Depends(get_db)
):

    records = (
        db.query(HealthRecord)
        .order_by(
            HealthRecord.uploaded_at.desc()
        )
        .all()
    )

    return {

        "success": True,

        "records": [

            {
                "id": record.id,

                "record_type": record.record_type,

                "file_name": record.file_name,

                "uploaded_at": record.uploaded_at
            }

            for record in records
        ]
    }


# =========================================================
# VIEW / DOWNLOAD RECORD
# =========================================================

@router.get("/records/{record_id}/file")
def get_health_record_file(

    record_id: int,

    db: Session = Depends(get_db)
):

    record = (
        db.query(HealthRecord)
        .filter(
            HealthRecord.id == record_id
        )
        .first()
    )

    if not record:

        raise HTTPException(
            status_code=404,
            detail="Health record not found."
        )


    file_path = Path(
        record.file_path
    )


    if not file_path.exists():

        raise HTTPException(
            status_code=404,
            detail="File not found."
        )


    return FileResponse(
        path=file_path,
        filename=record.file_name
    )


# =========================================================
# DELETE RECORD
# =========================================================

@router.delete("/records/{record_id}")
def delete_health_record(

    record_id: int,

    db: Session = Depends(get_db)
):

    record = (
        db.query(HealthRecord)
        .filter(
            HealthRecord.id == record_id
        )
        .first()
    )

    if not record:

        raise HTTPException(
            status_code=404,
            detail="Health record not found."
        )


    # -----------------------------------------------------
    # Delete physical file
    # -----------------------------------------------------

    file_path = Path(
        record.file_path
    )

    if file_path.exists():

        file_path.unlink()


    # -----------------------------------------------------
    # Delete database record
    # -----------------------------------------------------

    db.delete(record)

    db.commit()


    return {

        "success": True,

        "message": "Health record deleted successfully."
    }

