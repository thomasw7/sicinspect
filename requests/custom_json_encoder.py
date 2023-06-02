from flask.json import JSONEncoder
from datetime import datetime

class CustomJsonEncoder(JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat(timespec='milliseconds')

        return super().default(o)
