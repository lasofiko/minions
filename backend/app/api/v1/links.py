from fastapi import APIRouter, status

from app.api.deps import CurrentUserDep, LinksServiceDep
from app.schemas.links import Link as LinkSchema
from app.schemas.links import LinkCreate, LinkUpdate

router = APIRouter(prefix="/links", tags=["Links"])


@router.post("/create", response_model=LinkSchema, status_code=status.HTTP_201_CREATED)
async def create_link(
    link_in: LinkCreate,
    current_user: CurrentUserDep,
    links: LinksServiceDep,
):
    return await links.create(link_in, owner_id=current_user.id)


@router.get("/my", response_model=list[LinkSchema])
async def get_my_links(current_user: CurrentUserDep, links: LinksServiceDep):
    return await links.list_my(owner_id=current_user.id)


@router.put("/{short_code}", response_model=LinkSchema)
async def update_link(
    short_code: str,
    link_in: LinkUpdate,
    current_user: CurrentUserDep,
    links: LinksServiceDep,
):
    return await links.update_description(short_code, current_user.id, link_in)


@router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(
    short_code: str,
    current_user: CurrentUserDep,
    links: LinksServiceDep,
):
    await links.delete(short_code, current_user.id)
    return None
