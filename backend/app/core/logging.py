import logging
import sys
from pathlib import Path
from typing import Any
import json
from datetime import datetime
from app.core.config import settings

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)


class JSONFormatter(logging.Formatter):
    
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        
        if hasattr(record, "extra_fields"):
            log_obj.update(record.extra_fields)
        
        return json.dumps(log_obj)


def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    if settings.DEBUG:
        console_format = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    else:
        console_format = JSONFormatter()
    
    console_handler.setFormatter(console_format)
    root_logger.addHandler(console_handler)
    
    file_handler = logging.FileHandler(
        LOG_DIR / f"app_{datetime.now().strftime('%Y%m%d')}.log"
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(file_handler)
    
    error_handler = logging.FileHandler(
        LOG_DIR / f"errors_{datetime.now().strftime('%Y%m%d')}.log"
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(error_handler)
    
    
    if settings.DEBUG:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
    else:
        logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    
    return root_logger


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


class LoggerMixin:
    
    @property
    def logger(self) -> logging.Logger:
        if not hasattr(self, "_logger"):
            self._logger = get_logger(self.__class__.__module__)
        return self._logger
    
    def log_info(self, message: str, **kwargs):
        self.logger.info(message, extra={"extra_fields": kwargs})
    
    def log_error(self, message: str, **kwargs):
        self.logger.error(message, extra={"extra_fields": kwargs})
    
    def log_warning(self, message: str, **kwargs):
        self.logger.warning(message, extra={"extra_fields": kwargs})
    
    def log_debug(self, message: str, **kwargs):
        self.logger.debug(message, extra={"extra_fields": kwargs})


from fastapi import Request, Response
from typing import Callable
import time
import uuid


async def log_requests(request: Request, call_next: Callable) -> Response:
    request_id = str(uuid.uuid4())
    
    start_time = time.time()
    
    logger = get_logger("app.requests")
    
    logger.info(
        "Request started",
        extra={
            "extra_fields": {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "client_host": request.client.host if request.client else None,
            }
        }
    )
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    logger.info(
        "Request completed",
        extra={
            "extra_fields": {
                "request_id": request_id,
                "status_code": response.status_code,
                "duration_seconds": round(duration, 3),
            }
        }
    )
    
    response.headers["X-Request-ID"] = request_id
    
    return response