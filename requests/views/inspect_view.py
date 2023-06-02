from flask import jsonify, request
from flask_restx import Resource, Namespace, marshal
from injector import inject
from dataclasses import dataclass
from app import api, app, limiter
from data_access import ParsedRequestsProvider
from services import RequestParser
from werkzeug.exceptions import RequestEntityTooLarge
from . import ParsedRequestIdDto, GenericContentDto


ns = Namespace('Inspect', path='/inspect/<string:grouping_key>')
api.add_namespace(ns)


methods=['GET','POST','DELETE','PUT','PATCH','OPTIONS']

@dataclass(frozen=True)
class InspectViewConfig:
    max_payload_size_bytes: int

@ns.route('', defaults={'path': ''}, strict_slashes=False, methods=methods)
@ns.route('/<path:path>', methods=methods)
class InspectView(Resource):
    @inject
    def __init__(self, config: InspectViewConfig, parser: RequestParser, provider: ParsedRequestsProvider, api):
        self.api = api
        self.__provider = provider
        self.__parser = parser
        self.__config = config
    
    @ns.response(201, 'OK', ParsedRequestIdDto)
    @ns.doc(
        description = 'Inspect Request',
        params = { 'parameter': {'in': 'query', 'required': False, 'default': 'value' } },
        body = GenericContentDto
    )
    def dispatch_request(self, grouping_key: str, path: str):
        if not request.content_length is None and request.content_length > self.__config.max_payload_size_bytes:
            raise RequestEntityTooLarge()
        
        is_multi = request.mimetype.startswith('multipart')
        boundary = request.mimetype_params.get('boundary', '').encode(request.charset) if is_multi else None

        if path=='':
            if request.path.endswith('/'):
                path='/'
        else:
            path = f'/{path}'

        query = [
            (x[0], x[1] if len(x) > 1 else '')
            for x in [x.split('=') for x in request.query_string.decode().split('&')]
        ] if len(request.query_string) > 0 else []
        headers = [(k, v) for k,v in request.headers]

        parsed = self.__parser.parse(grouping_key, request.method, path, query, headers, request.stream, request.charset, is_multi, boundary)
        parsed_request_id = self.__provider.insert(parsed)
        
        return marshal({ 'parsed_request_id': parsed_request_id }, ParsedRequestIdDto), 201