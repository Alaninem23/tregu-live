from __future__ import annotations
from typing import Callable, Dict

# Lightweight plugin registry so subsystems can register capabilities
_registry: Dict[str, Callable[..., dict]] = {}

def register(name: str, handler: Callable[..., dict]):
    _registry[name] = handler

def get(name: str) -> Callable[..., dict] | None:
    return _registry.get(name)

def list_plugins() -> list[str]:
    return sorted(_registry.keys())
