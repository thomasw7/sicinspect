from dataclasses import dataclass
from datetime import datetime

@dataclass(frozen=True)
class ParsedRequestParameter:
   name: str
   value: str

@dataclass(frozen=True)
class ParsedRequestPart:
  headers: list[ParsedRequestParameter]
  content_id: str

@dataclass(frozen=True)
class ParsedRequest:
  parsed_request_id: str
  grouping_key: str
  creation_time: datetime
  is_multi: bool
  method: str
  path: str
  query: list[ParsedRequestParameter]
  headers: list[ParsedRequestParameter]
  parts: list[ParsedRequestPart]
