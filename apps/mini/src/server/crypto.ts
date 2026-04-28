const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function aesKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function randomId(prefix: string): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `${prefix}_${toBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}`;
}

export function randomNonce(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function encryptString(plaintext: string, secret: string): Promise<string> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const key = await aesKey(secret);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: arrayBuffer(iv) }, key, textEncoder.encode(plaintext));
  return JSON.stringify({
    v: 1,
    alg: "AES-GCM-SHA256",
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext)),
  });
}

export async function decryptString(payload: string, secret: string): Promise<string> {
  const parsed = JSON.parse(payload) as { v: number; iv: string; data: string };
  if (parsed.v !== 1) throw new Error("Unsupported encrypted payload version");
  const key = await aesKey(secret);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: arrayBuffer(fromBase64(parsed.iv)) },
    key,
    arrayBuffer(fromBase64(parsed.data)),
  );
  return textDecoder.decode(plaintext);
}
