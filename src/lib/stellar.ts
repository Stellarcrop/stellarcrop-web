export type ReceiptStatus = "Active" | "Redeemed";

export interface Receipt {
  receipt_id: number;
  issuer: string;
  owner: string;
  commodity: string;
  quantity_kg: string;
  grade: string;
  warehouse_name: string;
  location: string;
  metadata_hash: string;
  issued_at: number;
  expires_at: number;
  status: ReceiptStatus;
}

const network = import.meta.env.VITE_NETWORK ?? "testnet";
const networkPassphrase =
  import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE ??
  (network === "pubnet"
    ? "Public Global Stellar Network ; September 2015"
    : "Test SDF Network ; September 2015");

const rpcUrl = import.meta.env.VITE_RPC_URL ?? "https://soroban-testnet.stellar.org";
const horizonUrl =
  import.meta.env.VITE_HORIZON_URL ??
  (network === "pubnet" ? "https://horizon.stellar.org" : "https://horizon-testnet.stellar.org");

export const stellarConfig = {
  network,
  networkPassphrase,
  rpcUrl,
  horizonUrl,
};

export function toDateTime(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) {
    return "-";
  }
  return new Date(unixSeconds * 1000).toLocaleString();
}
