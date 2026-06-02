import "server-only";
import crypto from "node:crypto";

const algorithm = "aes-256-gcm";

export type SecretEncryptionReadiness = {
  algorithm: "aes-256-gcm";
  encryptionKeyConfigured: boolean;
  encryptionKeyValid: boolean;
  serverSideOnly: true;
  plaintextReturned: false;
  realCredentialSaveAllowed: false;
  statusLabelZh: string;
  warningZh: string;
};

const readEncryptionKey = (): string | null => {
  const raw = process.env.SECRETS_ENCRYPTION_KEY?.trim();
  return raw || null;
};

const getKey = (): Buffer => {
  const raw = readEncryptionKey();
  if (!raw) {
    throw new Error("SECRETS_ENCRYPTION_KEY is required before storing provider secrets.");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("SECRETS_ENCRYPTION_KEY must decode to 32 bytes.");
  }
  return key;
};

export const getSecretEncryptionReadiness = (): SecretEncryptionReadiness => {
  const raw = readEncryptionKey();
  if (!raw) {
    return {
      algorithm,
      encryptionKeyConfigured: false,
      encryptionKeyValid: false,
      serverSideOnly: true,
      plaintextReturned: false,
      realCredentialSaveAllowed: false,
      statusLabelZh: "未配置",
      warningZh: "当前不能保存真实平台访问凭证。请先在服务端环境变量中配置 32 字节 base64 加密密钥。",
    };
  }

  let keyLength = 0;
  try {
    keyLength = Buffer.from(raw, "base64").length;
  } catch {
    keyLength = 0;
  }

  const encryptionKeyValid = keyLength === 32;
  return {
    algorithm,
    encryptionKeyConfigured: true,
    encryptionKeyValid,
    serverSideOnly: true,
    plaintextReturned: false,
    realCredentialSaveAllowed: false,
    statusLabelZh: encryptionKeyValid ? "配置格式有效" : "配置格式无效",
    warningZh: encryptionKeyValid
      ? "加密配置格式有效，但当前仍处于 Demo/沙箱阶段，不允许保存真实平台访问凭证。"
      : "加密配置格式无效。真实接入前必须改为 32 字节 base64 加密密钥。",
  };
};

export const encryptSecret = (plainText: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

export const decryptSecret = (payload: string): string => {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv(algorithm, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};
