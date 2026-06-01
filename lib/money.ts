import "server-only";

export const cents = (amount: number): number => {
  if (!Number.isInteger(amount)) {
    throw new Error("Money must be stored as integer cents.");
  }
  return amount;
};

export const formatCents = (amountCents: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
};

export const formatRoas = (roasBps: number): string => {
  return `${(roasBps / 10000).toFixed(2)}x`;
};
