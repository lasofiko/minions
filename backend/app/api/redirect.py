from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from app.api.deps import LinksServiceDep

router = APIRouter()


@router.get("/{short_code}", tags=["redirect"])
async def redirect_to_original(short_code: str, links: LinksServiceDep):
    original_url = await links.resolve_and_track(short_code)
    return RedirectResponse(url=original_url)
