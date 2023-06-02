import os
import re
from dataclasses import dataclass
from injector import inject
from data_access import RefDateTimeProvider
from data_access.data_models import ParsedRequest, ParsedRequestPart, ParsedRequestParameter
from datetime import datetime, timezone
from werkzeug.exceptions import NotFound
from uuid import uuid4
from typing import Dict, List, Tuple


@dataclass(frozen=True)
class RequestParserConfig:
    buffer_size: int
    dir_path: str
    file_expire_seconds: int

class RequestParser:
    @inject
    def __init__(self, config: RequestParserConfig, ref_date: RefDateTimeProvider):
        self.__config = config
        self.__ref_date = ref_date
        os.makedirs(self.__config.dir_path, exist_ok=True)

    def get_content_path(self, content_id: str):
        dir_path = self.__config.dir_path
        #os.makedirs(dir_path, exist_ok=True)

        content_path = f'{dir_path}/{content_id}'
        return content_path

    def purge_expired(self):
        expire_seconds = self.__config.file_expire_seconds
        dir_path = self.__config.dir_path

        paths = [self.get_content_path(content_id) for content_id in os.listdir(dir_path)]
        mtimes = [(path, os.path.getmtime(path)) for path in paths]
        now = self.__ref_date.get().timestamp()
        _ = [self.__delete_file(path) for path, mtime in mtimes if now - mtime >= expire_seconds]

    def parse(self, grouping_key: str, method: str, path: str, query: List[Tuple[str, str]], headers: List[Tuple[str, str]], stream, encoding='utf8', is_multi = False, boundary: bytes = None):
        self.purge_expired()
        buffer_size = self.__config.buffer_size

        buffer = stream.read(buffer_size)
        if is_multi or len(buffer)<1:
            file_path = ''
            file = None
        else:
            content_id = str(uuid4()).replace('-','')
            file_path = self.get_content_path(content_id)
            file = open(file_path, 'wb')

        part_headers:List[ParsedRequestParameter] = []
        parts:List[ParsedRequestPart] = []
        parse_state = 'content'

        header_separator = b'\r\n\r\n'
        while True:
            next_buff = stream.read(buffer_size)

            if len(buffer)<1 and len(next_buff)<1:
                break

            if parse_state == 'headers':        
                if header_separator in (buffer + next_buff):
                    splitted = (buffer + next_buff).split(header_separator)

                    part_headers = [
                        ParsedRequestParameter(kv[0].strip().lower(), kv[1].strip())
                        for kv in [
                            h.split(':')
                            for h in splitted[0].decode(encoding).split('\r\n') 
                            if len(h) > 0
                        ]
                    ]

                    content_id = str(uuid4()).replace('-','')
                    file_path = self.get_content_path(content_id)
                    file = open(file_path,'wb')

                    buffer = header_separator.join(splitted[1:])
                    parse_state = 'content'
                
                else:
                    buffer += next_buff
                
            elif parse_state == 'content':
                if boundary and boundary in (buffer + next_buff):
                    splitted = (buffer + next_buff).split(boundary)

                    if file:
                        if splitted[0].endswith(b'\r\n--'):
                            splitted[0] = splitted[0][0: -4]

                        file.write(splitted[0])

                        parts.append(ParsedRequestPart(part_headers, content_id))
                        
                        file.close()
                        file = None
                        file_path = ''

                    buffer = boundary.join(splitted[1:])
                    if buffer == b'--\r\n':
                        buffer = b''

                    parse_state = 'headers'

                else:
                    if file:
                        file.write(buffer)
                    
                    buffer = next_buff

        if not is_multi and file:
            parts.append(ParsedRequestPart({}, content_id))

        parsed_query = [
            ParsedRequestParameter(n, s)
            for n, s in query
        ]

        parsed_headers = [
            ParsedRequestParameter(n, s)
            for n, s in headers
        ]

        return ParsedRequest(
            None, 
            grouping_key,
            self.__ref_date.get(), 
            is_multi, 
            method, 
            path, 
            parsed_query, 
            parsed_headers, 
            parts
        )

    def __delete_file(self, file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass
        