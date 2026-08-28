from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    storage_path: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)