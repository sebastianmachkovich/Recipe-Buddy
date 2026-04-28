from pydantic import BaseModel, Field


class PreferencePayload(BaseModel):
    value: str = Field(default="", max_length=2000)


class PreferenceResponse(BaseModel):
    value: str
