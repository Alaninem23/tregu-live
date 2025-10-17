import os
from cryptography.fernet import Fernet

def get_cipher():
    key = os.getenv("EXPORT_ENC_KEY", "")
    if not key:
        raise RuntimeError("EXPORT_ENC_KEY missing")
    return Fernet(key.encode("utf-8"))

def encrypt_bytes(data: bytes) -> bytes:
    f = get_cipher()
    return f.encrypt(data)
