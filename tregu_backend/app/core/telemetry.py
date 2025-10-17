from __future__ import annotations
import time
from typing import DefaultDict, Dict, Any
from collections import defaultdict

class _Metrics:
    def __init__(self):
        self.counters: DefaultDict[str, float] = defaultdict(float)
        self.hist: DefaultDict[str, list[float]] = defaultdict(list)

    def count(self, name: str, value: float = 1.0, tags: Dict[str, Any] | None = None):
        self.counters[name] += value

    def observe(self, name: str, value: float, tags: Dict[str, Any] | None = None):
        self.hist[name].append(value)

metrics = _Metrics()
