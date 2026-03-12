from dataclasses import dataclass
from uuid import uuid4
from datetime import datetime, timedelta
from pymongo import MongoClient
from pymongo.collection import Collection, ObjectId
from injector import inject
from werkzeug.exceptions import NotFound
from pymongo.errors import InvalidId
from . import RefDateTimeProvider
from .data_models import ParsedRequest, ParsedRequestPart, ParsedRequestParameter

@dataclass(frozen=True)
class ParsedRequestsProviderConfig:
    expire_seconds: int
    max_requests: int
    mongo_connection_string: str
    mongo_collection: str

class ParsedRequestsProvider:
    @inject
    def __init__(self, config: ParsedRequestsProviderConfig, ref_date: RefDateTimeProvider):
        self.__config = config
        self.__ref_date = ref_date
        self.__config = config
        self.__mongo = MongoClient(config.mongo_connection_string, tz_aware=True)

    def __collection(self) -> Collection:
        return self.__mongo.sicinspect[self.__config.mongo_collection]
    
    def __map_parameter(self, dic: dict):
        return ParsedRequestParameter(
            dic['name'],
            dic['value']
        )
    
    def __map_part(self, dic: dict):
        return ParsedRequestPart(
            headers = [self.__map_parameter(x) for x in dic['headers']],
            content_id = dic['content_id']
        )
    
    def __map(self, dic: dict):
        return ParsedRequest(
            parsed_request_id = str(dic['_id']),
            grouping_key = dic['grouping_key'],
            creation_time = dic['creation_time'],
            is_multi = dic['is_multi'],
            method = dic['method'],
            path = dic['path'],
            query = [self.__map_parameter(x) for x in dic['query']],
            headers = [self.__map_parameter(x) for x in dic['headers']],
            parts = [self.__map_part(x) for x in dic['parts']]
        )

    def generate_grouping_key(self):
        return str(uuid4()).replace('-','')
    
    def get_many(self, grouping_key: str, creation_time_start: datetime = None, creation_time_end: datetime = None):
        self.purge_expired()
        coll = self.__collection()

        if creation_time_start is None:
            creation_time_start = datetime.min
        
        if creation_time_end is None:
            creation_time_end = datetime.max

        parsed_requests = coll.find({
            '$and': [
                { 'grouping_key': grouping_key }, 
                { 'creation_time': { '$gte': creation_time_start } },
                { 'creation_time': { '$lte': creation_time_end } }
            ]
        }).sort('creation_time', -1).limit(self.__config.max_requests)
        
        return [self.__map(x) for x in parsed_requests]

    def get(self, parsed_request_id: str):        
        coll = self.__collection()

        try:
            parsed_request = coll.find_one({'_id': ObjectId(parsed_request_id)})
        except InvalidId:
            raise NotFound(f'{parsed_request_id} not found')
        
        if parsed_request is None:
            raise NotFound(f'{parsed_request_id} not found')

        return self.__map(parsed_request)
        
    def insert(self, parsed_request: ParsedRequest):
        coll = self.__collection()

        dic = {
            'grouping_key': parsed_request.grouping_key,
            'creation_time': self.__ref_date.get(),
            'is_multi': parsed_request.is_multi,
            'method': parsed_request.method,
            'path': parsed_request.path,
            'query': [
                {
                    'name': q.name,
                    'value': q.value
                } 
                for q in parsed_request.query
            ],
            'headers': [
                {
                    'name': h.name,
                    'value': h.value
                } 
                for h in parsed_request.headers
            ],
            'parts': [
                {
                    'headers': [
                        {
                            'name': ph.name,
                            'value': ph.value
                        } 
                        for ph in p.headers
                    ],
                    'content_id': p.content_id
                } 
                for p in parsed_request.parts
            ]
        }
        request_with_id = coll.insert_one(dic).inserted_id

        return str(request_with_id)

    def purge_expired(self):
        coll = self.__collection()
        expire_time = self.__ref_date.get() - timedelta(seconds = self.__config.expire_seconds)
        coll.delete_many({'creation_time': {'$lte': expire_time}})
