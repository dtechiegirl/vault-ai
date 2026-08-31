from fastapi import APIRouter

from backend.app.schemas.studio import StudioRequest, StudioResponse
from backend.app.services.studio_service import run_studio_action

router = APIRouter(tags=["studio"])


@router.post(
    "/summary",
    response_model=StudioResponse,
)
def summary(request: StudioRequest) -> StudioResponse:
    return run_studio_action(
        action="summary",
        document_ids=request.document_ids,
    )


@router.post(
    "/entities",
    response_model=StudioResponse,
)
def entities(request: StudioRequest) -> StudioResponse:
    return run_studio_action(
        action="entities",
        document_ids=request.document_ids,
    )


@router.post(
    "/faq",
    response_model=StudioResponse,
)
def faq(request: StudioRequest) -> StudioResponse:
    return run_studio_action(
        action="faq",
        document_ids=request.document_ids,
    )