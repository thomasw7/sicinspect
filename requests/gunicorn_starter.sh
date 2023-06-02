#!/bin/sh
gunicorn app:app -w 2 --threads 2 -b 0.0.0.0:80 --error-logfile gunicorn_error.log