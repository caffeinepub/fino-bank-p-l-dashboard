import { useCallback, useEffect, useState } from "react";
import type { FDRecord, PLEntry } from "../utils/excelExport";

export interface PaymentHead {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface PLRecord {
  id: string;
  date: string; // YYYY-MM-DD
  openingCash: number;
  finoR: number;
  finoS: number;
  dpl: number;
  closing: number;
  profitLoss: number; // closing - openingCash + finoR + finoS + dpl
}

export interface TransactionRecord {
  id: string;
  referenceId: string;
  transactionType:
    | "NEFT"
    | "IMPS"
    | "DMT"
    | "Credit"
    | "Debit"
    | "New CASA"
    | "MISC Payment"
    | "AEPS";
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  amount: number;
  transactionDate: string; // stored as YYYY-MM-DD, displayed as dd/MM/yyyy
  frequencyType: string;
  remark: string;
  transactionStatus: "Success" | "Pending" | "Failed";
}

const DEFAULT_PAYMENT_HEADS: PaymentHead[] = [
  { id: "ph1", name: "Opening Cash Balance", isDefault: true },
  { id: "ph2", name: "Fino(R) Balance", isDefault: true },
  { id: "ph3", name: "Fino(S) Balance", isDefault: true },
  { id: "ph4", name: "DPL Balance", isDefault: true },
  { id: "ph5", name: "Total New Account Opening", isDefault: true },
];

const SAMPLE_PL: PLEntry[] = [
  {
    id: "pl1",
    date: "2026-03-28",
    paymentHead: "Opening Cash Balance",
    amount: 125000,
    type: "cashin",
    notes: "Morning opening balance",
  },
  {
    id: "pl2",
    date: "2026-03-28",
    paymentHead: "Fino(R) Balance",
    amount: 48500,
    type: "cashin",
    notes: "Fino R collection",
  },
  {
    id: "pl3",
    date: "2026-03-28",
    paymentHead: "Fino(S) Balance",
    amount: 32000,
    type: "cashin",
    notes: "Savings balances",
  },
  {
    id: "pl4",
    date: "2026-03-28",
    paymentHead: "DPL Balance",
    amount: 8200,
    type: "cashout",
    notes: "Daily payment",
  },
  {
    id: "pl5",
    date: "2026-03-29",
    paymentHead: "Total New Account Opening",
    amount: 15000,
    type: "cashin",
    notes: "5 new accounts today",
  },
  {
    id: "pl6",
    date: "2026-03-29",
    paymentHead: "Opening Cash Balance",
    amount: 142000,
    type: "cashin",
    notes: "Morning opening",
  },
  {
    id: "pl7",
    date: "2026-03-29",
    paymentHead: "DPL Balance",
    amount: 5600,
    type: "cashout",
    notes: "DPL write-off",
  },
  {
    id: "pl8",
    date: "2026-04-01",
    paymentHead: "Fino(R) Balance",
    amount: 52000,
    type: "cashin",
    notes: "April start",
  },
  {
    id: "pl9",
    date: "2026-04-01",
    paymentHead: "Fino(S) Balance",
    amount: 11000,
    type: "cashout",
    notes: "Withdrawal adjustment",
  },
  {
    id: "pl10",
    date: "2026-04-02",
    paymentHead: "Opening Cash Balance",
    amount: 138500,
    type: "cashin",
    notes: "Today's opening",
  },
  {
    id: "pl11",
    date: "2026-04-02",
    paymentHead: "Closing Balance",
    amount: 180000,
    type: "closing",
    notes: "End of day closing",
  },
];

const SAMPLE_PL_RECORDS: PLRecord[] = [
  {
    id: "plr1",
    date: "2026-03-28",
    openingCash: 125000,
    finoR: 48500,
    finoS: 32000,
    dpl: 8200,
    closing: 180000,
    profitLoss: 180000 - 125000 + 48500 + 32000 + 8200,
  },
  {
    id: "plr2",
    date: "2026-03-29",
    openingCash: 142000,
    finoR: 18000,
    finoS: 12000,
    dpl: 5600,
    closing: 165000,
    profitLoss: 165000 - 142000 + 18000 + 12000 + 5600,
  },
  {
    id: "plr3",
    date: "2026-04-01",
    openingCash: 138000,
    finoR: 52000,
    finoS: 11000,
    dpl: 7500,
    closing: 190000,
    profitLoss: 190000 - 138000 + 52000 + 11000 + 7500,
  },
  {
    id: "plr4",
    date: "2026-04-02",
    openingCash: 138500,
    finoR: 44000,
    finoS: 9500,
    dpl: 6200,
    closing: 175000,
    profitLoss: 175000 - 138500 + 44000 + 9500 + 6200,
  },
];

const SAMPLE_FD: FDRecord[] = [
  {
    id: "fd1",
    customerName: "Ratan Kumar Mondal",
    accountNo: "34200012345",
    cifNo: "CIF001234",
    contactNo: "9876543210",
    openingDate: "2025-10-15",
    fdAmount: 50000,
    tenure: 1,
    interestRate: 5,
    interestAmount: 2500,
    maturityAmount: 52500,
    closureDate: "2026-10-23",
  },
  {
    id: "fd2",
    customerName: "Purnima Devi",
    accountNo: "34200023456",
    cifNo: "CIF002345",
    contactNo: "9765432109",
    openingDate: "2025-08-20",
    fdAmount: 100000,
    tenure: 2,
    interestRate: 7,
    interestAmount: 14000,
    maturityAmount: 114000,
    closureDate: "2027-08-28",
  },
  {
    id: "fd3",
    customerName: "Suresh Biswas",
    accountNo: "34200034567",
    cifNo: "CIF003456",
    contactNo: "9654321098",
    openingDate: "2024-06-01",
    fdAmount: 200000,
    tenure: 3,
    interestRate: 10,
    interestAmount: 60000,
    maturityAmount: 260000,
    closureDate: "2027-06-09",
  },
  {
    id: "fd4",
    customerName: "Anjali Bose",
    accountNo: "34200045678",
    cifNo: "CIF004567",
    contactNo: "9543210987",
    openingDate: "2026-01-10",
    fdAmount: 75000,
    tenure: 1,
    interestRate: 5,
    interestAmount: 3750,
    maturityAmount: 78750,
    closureDate: "2027-01-18",
  },
  {
    id: "fd5",
    customerName: "Mohan Sarkar",
    accountNo: "34200056789",
    cifNo: "CIF005678",
    contactNo: "9432109876",
    openingDate: "2025-03-05",
    fdAmount: 150000,
    tenure: 2,
    interestRate: 7,
    interestAmount: 21000,
    maturityAmount: 171000,
    closureDate: "2027-03-13",
  },
];

const SAMPLE_TRANSACTIONS: TransactionRecord[] = [
  {
    id: "txn1",
    referenceId: "TXN202603281001",
    transactionType: "NEFT",
    accountNumber: "34200012345",
    accountHolderName: "Ratan Kumar Mondal",
    bankName: "Fino Small Finance Bank",
    ifscCode: "FINO0001599",
    amount: 25000,
    transactionDate: "2026-03-28",
    frequencyType: "One Time",
    remark: "Salary credit",
    transactionStatus: "Success",
  },
  {
    id: "txn2",
    referenceId: "TXN202603281002",
    transactionType: "IMPS",
    accountNumber: "34200023456",
    accountHolderName: "Purnima Devi",
    bankName: "State Bank of India",
    ifscCode: "SBIN0001234",
    amount: 8500,
    transactionDate: "2026-03-28",
    frequencyType: "One Time",
    remark: "Personal transfer",
    transactionStatus: "Success",
  },
  {
    id: "txn3",
    referenceId: "TXN202603291003",
    transactionType: "DMT",
    accountNumber: "34200034567",
    accountHolderName: "Suresh Biswas",
    bankName: "Punjab National Bank",
    ifscCode: "PUNB0012345",
    amount: 15000,
    transactionDate: "2026-03-29",
    frequencyType: "One Time",
    remark: "Domestic money transfer",
    transactionStatus: "Pending",
  },
  {
    id: "txn4",
    referenceId: "TXN202604011004",
    transactionType: "New CASA",
    accountNumber: "34200067890",
    accountHolderName: "Rekha Sharma",
    bankName: "Fino Small Finance Bank",
    ifscCode: "FINO0001599",
    amount: 5000,
    transactionDate: "2026-04-01",
    frequencyType: "One Time",
    remark: "New account opening deposit",
    transactionStatus: "Success",
  },
  {
    id: "txn5",
    referenceId: "TXN202604021005",
    transactionType: "Credit",
    accountNumber: "34200045678",
    accountHolderName: "Anjali Bose",
    bankName: "HDFC Bank",
    ifscCode: "HDFC0001234",
    amount: 50000,
    transactionDate: "2026-04-02",
    frequencyType: "One Time",
    remark: "Loan disbursement",
    transactionStatus: "Failed",
  },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function useLocalStore() {
  const [paymentHeads, setPaymentHeads] = useState<PaymentHead[]>(() =>
    loadFromStorage("fino_payment_heads", DEFAULT_PAYMENT_HEADS),
  );
  const [plEntries, setPLEntries] = useState<PLEntry[]>(() =>
    loadFromStorage("fino_pl_entries", SAMPLE_PL),
  );
  const [plRecords, setPLRecords] = useState<PLRecord[]>(() =>
    loadFromStorage("fino_pl_records", SAMPLE_PL_RECORDS),
  );
  const [fdRecords, setFDRecords] = useState<FDRecord[]>(() =>
    loadFromStorage("fino_fd_records", SAMPLE_FD),
  );
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() =>
    loadFromStorage("fino_transactions", SAMPLE_TRANSACTIONS),
  );

  useEffect(
    () => saveToStorage("fino_payment_heads", paymentHeads),
    [paymentHeads],
  );
  useEffect(() => saveToStorage("fino_pl_entries", plEntries), [plEntries]);
  useEffect(() => saveToStorage("fino_pl_records", plRecords), [plRecords]);
  useEffect(() => saveToStorage("fino_fd_records", fdRecords), [fdRecords]);
  useEffect(
    () => saveToStorage("fino_transactions", transactions),
    [transactions],
  );

  const addPaymentHead = useCallback((name: string) => {
    setPaymentHeads((prev) => [
      ...prev,
      { id: `ph_${Date.now()}`, name, isDefault: false },
    ]);
  }, []);

  const editPaymentHead = useCallback(
    (id: string, name: string) => {
      setPaymentHeads((prev) =>
        prev.map((h) => (h.id === id ? { ...h, name } : h)),
      );
      setPLEntries((prev) => {
        const head = paymentHeads.find((h) => h.id === id);
        if (!head) return prev;
        return prev.map((e) =>
          e.paymentHead === head.name ? { ...e, paymentHead: name } : e,
        );
      });
    },
    [paymentHeads],
  );

  const deletePaymentHead = useCallback((id: string) => {
    setPaymentHeads((prev) => prev.filter((h) => h.id !== id || h.isDefault));
  }, []);

  const addPLEntry = useCallback((entry: Omit<PLEntry, "id">) => {
    setPLEntries((prev) => [{ ...entry, id: `pl_${Date.now()}` }, ...prev]);
  }, []);

  const deletePLEntry = useCallback((id: string) => {
    setPLEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addPLRecord = useCallback((record: Omit<PLRecord, "id">) => {
    setPLRecords((prev) => [{ ...record, id: `plr_${Date.now()}` }, ...prev]);
  }, []);

  const deletePLRecord = useCallback((id: string) => {
    setPLRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addFDRecord = useCallback((record: Omit<FDRecord, "id">) => {
    setFDRecords((prev) => [{ ...record, id: `fd_${Date.now()}` }, ...prev]);
  }, []);

  const deleteFDRecord = useCallback((id: string) => {
    setFDRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addTransaction = useCallback(
    (record: Omit<TransactionRecord, "id">) => {
      setTransactions((prev) => [
        { ...record, id: `txn_${Date.now()}` },
        ...prev,
      ]);
    },
    [],
  );

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTransactionStatus = useCallback(
    (id: string, status: TransactionRecord["transactionStatus"]) => {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, transactionStatus: status } : t,
        ),
      );
    },
    [],
  );

  return {
    paymentHeads,
    plEntries,
    plRecords,
    fdRecords,
    transactions,
    addPaymentHead,
    editPaymentHead,
    deletePaymentHead,
    addPLEntry,
    deletePLEntry,
    addPLRecord,
    deletePLRecord,
    addFDRecord,
    deleteFDRecord,
    addTransaction,
    deleteTransaction,
    updateTransactionStatus,
  };
}
