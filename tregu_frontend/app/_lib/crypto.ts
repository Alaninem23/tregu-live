// tregu_frontend/app/_lib/crypto.ts
// Browser-side: derive key from passphrase and AES-GCM encrypt/decrypt.

const ENC = new TextEncoder();
const DEC = new TextDecoder();

async function sha256(data: ArrayBuffer) {
  const h = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(h);
}

async function pbkdf2Key(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    ENC.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 310000, // OWASP recommended range
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptClientSide(
  data: ArrayBuffer,
  passphrase: string,
  filename: string,
  contentType: string
) {
  // Use random 16B salt for PBKDF2 and random 12B nonce for AES-GCM
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await pbkdf2Key(passphrase, salt);
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, data)
  );

  const file_id = crypto.randomUUID();
  const meta = {
    version: 1,
    algorithm: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    salt_b64: btoa(String.fromCharCode(...salt)),
    nonce_b64: btoa(String.fromCharCode(...nonce)),
    filename,
    content_type: contentType || "application/octet-stream",
    size: (data as ArrayBuffer).byteLength,
    file_id,
  };

  return { ciphertext, meta };
}

export async function decryptClientSide(
  ciphertext_b64: string,
  meta: any,
  passphrase: string
): Promise<{ bytes: Uint8Array; filename: string; contentType: string }> {
  const salt = Uint8Array.from(atob(meta.salt_b64), c => c.charCodeAt(0));
  const nonce = Uint8Array.from(atob(meta.nonce_b64), c => c.charCodeAt(0));
  const key = await pbkdf2Key(passphrase, salt);

  const ciphertext = Uint8Array.from(atob(ciphertext_b64), c => c.charCodeAt(0));
  const bytes = new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, ciphertext)
  );

  return {
    bytes,
    filename: meta.filename || "file",
    contentType: meta.content_type || "application/octet-stream",
  };
}
