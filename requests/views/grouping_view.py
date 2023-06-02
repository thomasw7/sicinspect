from flask_restx import Resource, Namespace, marshal
from injector import inject
from data_access import ParsedRequestsProvider
from app import api
from . import GroupingKeyDto

ns = Namespace('GroupingKey', path='/grouping_key')
api.add_namespace(ns)

@ns.route('')
class GroupingKeyView(Resource):
    @inject
    def __init__(self, provider: ParsedRequestsProvider, api):
        self.api = api
        self.__provider = provider

    @ns.response(201, 'Created', GroupingKeyDto)
    @ns.doc(
        description = 'Generate new requests grouping key'
    )
    def post(self):
        grouping_key = self.__provider.generate_grouping_key()
        return marshal({'grouping_key': grouping_key}, GroupingKeyDto), 201