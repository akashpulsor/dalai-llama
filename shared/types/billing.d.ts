// shared/types/billing.d.ts

export interface WalletBalance {
  balance: number;
  currency: string;
  lastUpdated: number;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  periodStart: number;
  periodEnd: number;
  status: "paid" | "unpaid" | "overdue";
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  ts: number;
  type: "debit" | "credit";
  description: string;
}

export interface BillingSummary {
  wallet: WalletBalance;
  invoices: Invoice[];
  transactions: Transaction[];
}
