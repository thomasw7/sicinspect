from datetime import datetime, timezone

class RefDateTimeProvider:
    def get(self):
        return datetime.now(timezone.utc)