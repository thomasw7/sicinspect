from flask_restx import fields
from app import api


ParsedRequestIdDto = api.model('ParsedRequestId', {
    'parsed_request_id': fields.String(example='49829971d0884b38874cdf94cb1cee26'),
})

ParsedRequestParameterDto = api.model('ParsedRequestParameter', {
    'name': fields.String(example='parameter_name'),
    'value': fields.String(example='parameter_value')
})

ParsedRequestPartDto = api.model('ParsedRequestPart', {
    'headers': fields.List(fields.Nested(ParsedRequestParameterDto)),
    'content_id': fields.String(example='aa5f86de3d0343d089e09fc8d617d7fa')
})

ParsedRequestDto = api.model('ParsedRequest', {
    'parsed_request_id': fields.String(example='49829971d0884b38874cdf94cb1cee26'),
    'grouping_key': fields.String(example='6268756de1223b48674deh94ab1cee99'),
    'creation_time': fields.DateTime(),
    'is_multi': fields.Boolean(example=True),
    'method': fields.String(example='GET'),
    'path': fields.String(example='/'),
    'query': fields.List(fields.Nested(ParsedRequestParameterDto)),
    'headers': fields.List(fields.Nested(ParsedRequestParameterDto)),
    'parts': fields.List(fields.Nested(ParsedRequestPartDto))
})

ParsedRequestsDto = api.model('ParsedRequests', {
    'requests': fields.List(fields.Nested(ParsedRequestDto))
})


GroupingKeyDto = api.model('GroupingKey', {
    'grouping_key': fields.String(example='6268756de1223b48674deh94ab1cee99')
})

GenericContentDto = api.model('GenericPayload', {})