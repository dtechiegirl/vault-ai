from pydantic import BaseModel, Field


class StudioRequest(BaseModel):
    document_ids: list[str] = Field(default_factory=list)


class StudioResponse(BaseModel):
    content: str