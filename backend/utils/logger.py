"""
backend/utils/logger.py
=======================
Centralized logging configuration with structured logging support.

Provides:
- JSON-formatted logs for production
- Human-readable format for development
- Request-scoped logging with trace_id and request_id
- Contextual logging for agent execution
"""

import logging
import sys
import json
import os
from typing import Dict, Any, Optional
from datetime import datetime
from contextvars import ContextVar

# Context variables for request-scoped logging
trace_id_ctx: ContextVar[Optional[str]] = ContextVar('trace_id', default=None)
request_id_ctx: ContextVar[Optional[str]] = ContextVar('request_id', default=None)

# Determine environment (production vs development)
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()


class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging in production."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add request context if available
        trace_id = trace_id_ctx.get()
        request_id = request_id_ctx.get()
        if trace_id:
            log_data["trace_id"] = trace_id
        if request_id:
            log_data["request_id"] = request_id

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add any extra fields
        if hasattr(record, 'extra'):
            log_data.update(record.extra)

        return json.dumps(log_data)


class HumanReadableFormatter(logging.Formatter):
    """Human-readable formatter for development."""

    # Color codes for different log levels
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
    }
    RESET = '\033[0m'

    def format(self, record: logging.LogRecord) -> str:
        # Build context string
        context_parts = []

        trace_id = trace_id_ctx.get()
        request_id = request_id_ctx.get()
        if trace_id:
            context_parts.append(f"trace={trace_id[:8]}")
        if request_id:
            context_parts.append(f"req={request_id[:8]}")

        context_str = f"[{' '.join(context_parts)}]" if context_parts else ""

        # Color the level name
        level_color = self.COLORS.get(record.levelname, '')
        level_str = f"{level_color}{record.levelname:8s}{self.RESET}"

        # Build the log message
        timestamp = datetime.utcnow().strftime('%H:%M:%S.%f')[:-3]
        message = f"{timestamp} {level_str} {context_str:20s} {record.name:30s} | {record.getMessage()}"

        # Add exception info if present
        if record.exc_info:
            message += "\n" + self.formatException(record.exc_info)

        return message


def setup_logging(
    level: str = LOG_LEVEL,
    use_json: bool = (ENVIRONMENT == "production")
) -> None:
    """
    Configure logging for the application.

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        use_json: Use JSON formatter (True) or human-readable (False)
    """
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level))

    # Remove existing handlers
    root_logger.handlers.clear()

    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, level))

    # Set formatter based on environment
    if use_json:
        formatter = StructuredFormatter()
    else:
        formatter = HumanReadableFormatter()

    handler.setFormatter(formatter)
    root_logger.addHandler(handler)

    # Reduce noise from third-party libraries
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def set_request_context(trace_id: str, request_id: str) -> None:
    """Set request context for logging."""
    trace_id_ctx.set(trace_id)
    request_id_ctx.set(request_id)


def clear_request_context() -> None:
    """Clear request context."""
    trace_id_ctx.set(None)
    request_id_ctx.set(None)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the given name.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)


# Initialize logging on module import
setup_logging()


# Usage example:
if __name__ == "__main__":
    # Test logging
    logger = get_logger(__name__)

    logger.debug("This is a debug message")
    logger.info("This is an info message")
    logger.warning("This is a warning message")
    logger.error("This is an error message")

    # Test with context
    set_request_context("trace-123", "req-456")
    logger.info("This message has request context")
    clear_request_context()

    logger.info("This message has no context")
