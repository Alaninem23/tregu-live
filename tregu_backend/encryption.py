# tregu_backend/encryption.py
import base64
import secrets
from typing import Dict

from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Scrypt KDF parameters - tune for your server if needed.
SCRYPT_N = 2 ** 15
SCRYPT_R = 8
SCRYPT_P = 1
KEY_LEN = 32        # 256-bit key
SALT_LEN = 16
NONCE_LEN = 12      # recommended for AES-GCM


def derive_key_from_passphrase(passphrase: str, salt: bytes) -> bytes:
    """
    Derive a symmetric key from a passphrase and salt using scrypt.
    Returns KEY_LEN bytes.
    """
    kdf = Scrypt(salt=salt, length=KEY_LEN, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P)
    return kdf.derive(passphrase.encode("utf-8"))


def encrypt_bytes(plaintext: bytes, master_passphrase: str) -> Dict[str, str]:
    """
    Encrypt bytes using AES-GCM with a key derived from the master_passphrase.
    Returns a dict with base64-encoded salt, nonce, ciphertext.
    """
    salt = secrets.token_bytes(SALT_LEN)
    key = derive_key_from_passphrase(master_passphrase, salt)
    aesgcm = AESGCM(key)
    nonce = secrets.token_bytes(NONCE_LEN)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    return {
        "salt": base64.b64encode(salt).decode("utf-8"),
        "nonce": base64.b64encode(nonce).decode("utf-8"),
        "ciphertext": base64.b64encode(ciphertext).decode("utf-8"),
    }


def decrypt_bytes(enc_dict: Dict[str, str], passphrase_candidate: str) -> bytes:
    """
    Decrypt using passphrase_candidate. Raises an exception on auth failure.
    """
    salt = base64.b64decode(enc_dict["salt"])
    nonce = base64.b64decode(enc_dict["nonce"])
    ciphertext = base64.b64decode(enc_dict["ciphertext"])
    key = derive_key_from_passphrase(passphrase_candidate, salt)
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext
