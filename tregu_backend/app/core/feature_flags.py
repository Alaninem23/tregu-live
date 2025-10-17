from __future__ import annotations
import os

class FeatureFlags:
    def __init__(self):
        self.overrides: dict[str, bool] = {}

    def enabled(self, name: str) -> bool:
        if name in self.overrides:
            return self.overrides[name]
        env = os.getenv(f"FF_{name.upper()}")
        if env is None:
            return False
        return env.lower() in ("1","true","yes","on")

    def set(self, name: str, val: bool):
        self.overrides[name] = val

flags = FeatureFlags()
