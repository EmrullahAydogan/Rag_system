from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any


class ActivityLogBase(BaseModel):
    action_type: str
    resource_type: str
    resource_id: Optional[int] = None
    description: str
    status: str = "success"


class ActivityLogCreate(ActivityLogBase):
    user_id: str = "anonymous"
    log_metadata: Optional[Dict[str, Any]] = {}


class ActivityLogResponse(ActivityLogBase):
    id: int
    user_id: str
    log_metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
