import os
from flask import jsonify, request, send_file
from flask_restx import Resource, Namespace, marshal
from injector import inject
from datetime import datetime
from app import api, app, limiter
from services import RequestParser
from data_access import ParsedRequestsProvider
from werkzeug.exceptions import NotFound
from . import ParsedRequestDto, ParsedRequestsDto


ns = Namespace('Requests', path='/requests')
api.add_namespace(ns)
    

@ns.route('', strict_slashes=False)
class ParsedRequestsView(Resource):
    @inject
    def __init__(self, provider: ParsedRequestsProvider, api):
        self.api = api
        self.__provider = provider

    @ns.response(200, 'OK', ParsedRequestsDto)
    @ns.doc(
        description = 'Get parsed requests',
        params = { 
            'grouping_key': {'in': 'query', 'required': True, 'example': '6268756de1223b48674deh94ab1cee99' },
            'creation_time_start': { 'in': 'query', 'required': False, 'example': '2020-01-01T00:00:00.000000-05:00' },
            'creation_time_end': { 'in': 'query', 'required': False, 'example': '2023-12-31T12:00:00.000000-05:00' }
        }
    )
    def get(self):
        grouping_key = request.args.get('grouping_key', None)
        if grouping_key is None:
            raise NotFound('no grouping key provided')
        
        try:
            creation_time_start_str = request.args.get('creation_time_start', '')
            if creation_time_start_str.endswith('Z'):
                creation_time_start_str = f'{creation_time_start_str[:-1]}-00:00'
            creation_time_start = datetime.fromisoformat(creation_time_start_str)
        except ValueError:
            creation_time_start = None

        try:
            creation_time_end_str = request.args.get('creation_time_end', '')
            if creation_time_end_str.endswith('Z'):
                creation_time_end_str = f'{creation_time_end_str[:-1]}-00:00'
            creation_time_end = datetime.fromisoformat(creation_time_end_str)
        except ValueError:
            creation_time_end = None
    
        reqs = self.__provider.get_many(grouping_key, creation_time_start, creation_time_end)
        return marshal({'requests': reqs}, ParsedRequestsDto), 200

@ns.route('/<string:parsed_request_id>')
class ParsedRequestView(Resource):
    @inject
    def __init__(self, provider: ParsedRequestsProvider, api):
        self.api = api
        self.__provider = provider

    @ns.response(200, 'OK', ParsedRequestDto)
    @ns.doc(
        description = 'Get parsed request'
    )
    def get(self, parsed_request_id: str):
        req = self.__provider.get(parsed_request_id)
        return marshal(req, ParsedRequestDto), 200
 
@ns.route('/<string:parsed_request_id>/contents/<string:content_id>')
class ContentsView(Resource):
    @inject
    def __init__(self, provider: ParsedRequestsProvider, parser: RequestParser, api):
        self.api = api
        self.__provider = provider
        self.__parser = parser

    @ns.response(200, 'OK')
    @ns.doc(
        description = 'Get contents'
    )
    def get(self, parsed_request_id: str, content_id: str):
        req = self.__provider.get(parsed_request_id)
        content_path = self.__parser.get_content_path(content_id)
        
        if not os.path.exists(content_path):
            raise NotFound(f'{content_id} not found')
    
        parts = [p for p in req.parts if p.content_id == content_id]
        if len(parts) < 1:
            raise NotFound(f'{content_id} not found')
        
        part = parts[0]

        if req.is_multi:
            headers = {h.name.lower():h.value for h in part.headers}
        else:
            headers = {h.name.lower():h.value for h in req.headers}

        return send_file(content_path, mimetype=headers.get('content-type', ''))
