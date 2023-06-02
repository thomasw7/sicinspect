from flask import Flask, Blueprint
from flask_restx import Api
from flask_injector import FlaskInjector
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from requests.exceptions import HTTPError
from werkzeug.exceptions import HTTPException
import json, os
from custom_json_encoder import CustomJsonEncoder


with open(f'{os.path.dirname(__file__)}/configs/config.{os.environ.get("APP_CONFIG","default")}.json', 'r') as f:
    config = json.load(f)

app = Flask(config['app_name'])
app.json_encoder = CustomJsonEncoder
CORS(app)
blueprint = Blueprint("api", config['app_name'], url_prefix=config['base_path']) 
limiter = Limiter(
    app=app, 
    key_func=get_remote_address,
    storage_uri=config['limiter']['storage_uri'],
    default_limits=config['limiter']['api_limits'])
api = Api(blueprint, doc=f'/swagger')
app.register_blueprint(blueprint)

from services import *
from data_access import *
from views import *

def inject_configure(binder):
    binder.bind(ParsedRequestsProviderConfig, to=ParsedRequestsProviderConfig(**config['parsed_requests_provider']))
    binder.bind(InspectViewConfig, to=InspectViewConfig(**config['inspect_view']))
    binder.bind(RequestParserConfig, to=RequestParserConfig(**config['request_parser']))
    
FlaskInjector(app=app, modules=[inject_configure])

@app.errorhandler(Exception)
def handle_exception(ex):
    if isinstance(ex, HTTPError):
        response = ex.response
        return response.content, response.status_code
    if isinstance(ex, HTTPException):
        return ex.description, ex.code
    
    print(ex)
    return 'Internal Server Error', 500