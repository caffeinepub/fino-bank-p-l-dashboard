import * as XLSX from "xlsx";

export interface PLEntry {
  id: string;
  date: string;
  paymentHead: string;
  amount: number;
  type: "profit" | "loss" | "cashin" | "cashout" | "closing";
  notes: string;
}

export interface FDRecord {
  id: string;
  customerName: string;
  accountNo: string;
  cifNo: string;
  contactNo: string;
  openingDate: string;
  fdAmount: number;
  tenure: number;
  interestRate: number;
  interestAmount: number;
  maturityAmount: number;
  closureDate: string;
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
  transactionDate: string;
  frequencyType: string;
  remark: string;
  transactionStatus: "Success" | "Pending" | "Failed";
}

export interface PLRecord {
  id: string;
  date: string;
  openingCash: number;
  finoR: number;
  finoS: number;
  dpl: number;
  closing: number;
  profitLoss: number;
}

const BANK_NAME = "Fino Small Finance Bank";
const BRANCH_NAME = "Doolahat Branch";
const BRANCH_IFSC = "IFSC Code: FINO0001599";

function addBankHeader(
  ws: XLSX.WorkSheet,
  title: string,
  startRow: number,
): number {
  const headerData = [
    [BANK_NAME],
    [BRANCH_NAME],
    [BRANCH_IFSC],
    [title],
    [
      `Generated on: ${new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}`,
    ],
    [],
  ];
  XLSX.utils.sheet_add_aoa(ws, headerData, { origin: { r: startRow, c: 0 } });
  return startRow + headerData.length;
}

function getTypeLabel(type: PLEntry["type"]): string {
  if (type === "cashin" || type === "profit") return "Cash In";
  if (type === "cashout" || type === "loss") return "Cash Out";
  if (type === "closing") return "Closing Balance";
  return type;
}

export function downloadPLReport(
  entries: PLEntry[],
  fromDate?: string,
  toDate?: string,
) {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  let row = 0;
  const title =
    fromDate && toDate
      ? `Cash In/Out Report (${fromDate} to ${toDate})`
      : "Daily Cash In/Out Report";

  row = addBankHeader(ws, title, row);

  const headers = ["Date", "Payment Head", "Amount (₹)", "Type", "Notes"];
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: { r: row, c: 0 } });
  row++;

  const rows = entries.map((e) => [
    e.date,
    e.paymentHead,
    e.amount,
    getTypeLabel(e.type),
    e.notes,
  ]);
  XLSX.utils.sheet_add_aoa(ws, rows, { origin: { r: row, c: 0 } });
  row += rows.length;

  const totalCashIn = entries
    .filter((e) => e.type === "cashin" || e.type === "profit")
    .reduce((s, e) => s + e.amount, 0);
  const totalCashOut = entries
    .filter((e) => e.type === "cashout" || e.type === "loss")
    .reduce((s, e) => s + e.amount, 0);
  const closingBalance = entries
    .filter((e) => e.type === "closing")
    .reduce((s, e) => s + e.amount, 0);
  const netPL = totalCashIn - totalCashOut;
  XLSX.utils.sheet_add_aoa(
    ws,
    [
      [],
      ["Summary"],
      ["Total Cash In", totalCashIn],
      ["Total Cash Out", totalCashOut],
      ["Closing Balance", closingBalance],
      ["Net Profit / Loss", netPL],
    ],
    { origin: { r: row, c: 0 } },
  );

  ws["!cols"] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Cash In/Out Report");
  XLSX.writeFile(
    wb,
    `CashInOut_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export function downloadFDReport(records: FDRecord[]) {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  let row = 0;
  row = addBankHeader(ws, "Fixed Deposit History Report", row);

  const headers = [
    "Customer Name",
    "Account No",
    "CIF No",
    "Contact",
    "Opening Date",
    "FD Amount (₹)",
    "Tenure (yrs)",
    "Rate (%)",
    "Interest (₹)",
    "Maturity Amount (₹)",
    "Closure Date",
  ];
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: { r: row, c: 0 } });
  row++;

  const rows = records.map((r) => [
    r.customerName,
    r.accountNo,
    r.cifNo,
    r.contactNo,
    r.openingDate,
    r.fdAmount,
    r.tenure,
    r.interestRate,
    r.interestAmount,
    r.maturityAmount,
    r.closureDate,
  ]);
  XLSX.utils.sheet_add_aoa(ws, rows, { origin: { r: row, c: 0 } });

  ws["!cols"] = Array(11).fill({ wch: 16 });
  XLSX.utils.book_append_sheet(wb, ws, "FD History");
  XLSX.writeFile(wb, `FD_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadAllTransactions(
  plEntries: PLEntry[],
  fdRecords: FDRecord[],
  transactions: TransactionRecord[] = [],
) {
  const wb = XLSX.utils.book_new();

  // Cash In/Out Sheet
  const plWs: XLSX.WorkSheet = {};
  let row = 0;
  row = addBankHeader(plWs, "Cash In/Out Entries", row);
  const plHeaders = ["Date", "Payment Head", "Amount (₹)", "Type", "Notes"];
  XLSX.utils.sheet_add_aoa(plWs, [plHeaders], { origin: { r: row, c: 0 } });
  row++;
  const plRows = plEntries.map((e) => [
    e.date,
    e.paymentHead,
    e.amount,
    getTypeLabel(e.type),
    e.notes,
  ]);
  XLSX.utils.sheet_add_aoa(plWs, plRows, { origin: { r: row, c: 0 } });
  plWs["!cols"] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, plWs, "Cash In/Out");

  // FD Sheet
  const fdWs: XLSX.WorkSheet = {};
  row = 0;
  row = addBankHeader(fdWs, "Fixed Deposit Records", row);
  const fdHeaders = [
    "Customer Name",
    "Account No",
    "CIF No",
    "Contact",
    "Opening Date",
    "FD Amount (₹)",
    "Tenure (yrs)",
    "Rate (%)",
    "Interest (₹)",
    "Maturity Amount (₹)",
    "Closure Date",
  ];
  XLSX.utils.sheet_add_aoa(fdWs, [fdHeaders], { origin: { r: row, c: 0 } });
  row++;
  const fdRows = fdRecords.map((r) => [
    r.customerName,
    r.accountNo,
    r.cifNo,
    r.contactNo,
    r.openingDate,
    r.fdAmount,
    r.tenure,
    r.interestRate,
    r.interestAmount,
    r.maturityAmount,
    r.closureDate,
  ]);
  XLSX.utils.sheet_add_aoa(fdWs, fdRows, { origin: { r: row, c: 0 } });
  fdWs["!cols"] = Array(11).fill({ wch: 16 });
  XLSX.utils.book_append_sheet(wb, fdWs, "FD Records");

  // Transactions Sheet
  const txnWs: XLSX.WorkSheet = {};
  let txnRow = 0;
  txnRow = addBankHeader(txnWs, "Transaction History", txnRow);
  const txnHeaders = [
    "Reference ID",
    "Type",
    "Account Number",
    "Account Holder",
    "Bank Name",
    "IFSC Code",
    "Amount (₹)",
    "Date",
    "Frequency",
    "Remark",
    "Status",
  ];
  XLSX.utils.sheet_add_aoa(txnWs, [txnHeaders], {
    origin: { r: txnRow, c: 0 },
  });
  txnRow++;
  const txnRows = transactions.map((t) => {
    const [y, m, d] = t.transactionDate.split("-");
    return [
      t.referenceId,
      t.transactionType,
      t.accountNumber,
      t.accountHolderName,
      t.bankName,
      t.ifscCode,
      t.amount,
      `${d}/${m}/${y}`,
      t.frequencyType,
      t.remark || "—",
      t.transactionStatus,
    ];
  });
  if (txnRows.length > 0) {
    XLSX.utils.sheet_add_aoa(txnWs, txnRows, { origin: { r: txnRow, c: 0 } });
  }
  txnWs["!cols"] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 24 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, txnWs, "Transactions");

  XLSX.writeFile(
    wb,
    `All_Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export function downloadPnLReport(
  plRecords: PLRecord[],
  fromDate?: string,
  toDate?: string,
) {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  let row = 0;
  const title =
    fromDate && toDate
      ? `Profit & Loss Report (${fromDate} to ${toDate})`
      : "Profit & Loss Report";

  row = addBankHeader(ws, title, row);

  const headers = [
    "Date",
    "Opening Cash Balance (₹)",
    "Fino(R) Balance (₹)",
    "Fino(S) Balance (₹)",
    "DPL Balance (₹)",
    "Closing Balance (₹)",
    "Profit / Loss (₹)",
    "Result",
  ];
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: { r: row, c: 0 } });
  row++;

  const rows = plRecords.map((r) => [
    r.date,
    r.openingCash,
    r.finoR,
    r.finoS,
    r.dpl,
    r.closing,
    r.profitLoss,
    r.profitLoss >= 0 ? "Profit" : "Loss",
  ]);
  XLSX.utils.sheet_add_aoa(ws, rows, { origin: { r: row, c: 0 } });
  row += rows.length;

  const totalPL = plRecords.reduce((s, r) => s + r.profitLoss, 0);
  XLSX.utils.sheet_add_aoa(
    ws,
    [
      [],
      [
        "Formula: P/L = Closing Balance - Opening Cash Balance + Fino(R) Balance + Fino(S) Balance + DPL Balance",
      ],
      [],
      ["Summary"],
      ["Total Records", plRecords.length],
      ["Total Profit / Loss (₹)", totalPL],
      ["Overall Result", totalPL >= 0 ? "Net Profit" : "Net Loss"],
    ],
    { origin: { r: row, c: 0 } },
  );

  ws["!cols"] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "P&L Report");
  XLSX.writeFile(
    wb,
    `PnL_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export function downloadFDReceipt(record: FDRecord) {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  const data = [
    [BANK_NAME],
    [BRANCH_NAME],
    [BRANCH_IFSC],
    ["FIXED DEPOSIT RECEIPT"],
    [],
    ["Receipt Date:", new Date().toLocaleDateString("en-IN")],
    [],
    ["CUSTOMER DETAILS"],
    ["Customer Name:", record.customerName],
    ["Account No:", record.accountNo],
    ["CIF No:", record.cifNo],
    ["Contact No:", record.contactNo],
    [],
    ["FD DETAILS"],
    ["Date of Opening:", record.openingDate],
    ["FD Amount (₹):", record.fdAmount],
    ["Tenure:", `${record.tenure} Year(s)`],
    ["Interest Rate:", `${record.interestRate}% per annum (flat rate)`],
    [],
    ["INTEREST CALCULATION"],
    ["Principal Amount (₹):", record.fdAmount],
    ["Rate of Interest:", `${record.interestRate}%`],
    ["Tenure:", `${record.tenure} Year(s)`],
    ["Interest Amount (₹):", record.interestAmount],
    [],
    ["MATURITY DETAILS"],
    ["Maturity Amount (₹):", record.maturityAmount],
    ["Date of Closure:", record.closureDate],
    [],
    [],
    ["Authorised Signatory", "", "", "Branch Manager"],
    [
      "Signature: ___________________",
      "",
      "",
      "Signature: ___________________",
    ],
    [],
    ["Stamp: ___________________", "", "", "Stamp: ___________________"],
    [],
    ["Note: This is a computer generated receipt."],
    ["For queries contact: Fino Small Finance Bank, Doolahat Branch"],
  ];

  XLSX.utils.sheet_add_aoa(ws, data, { origin: 0 });
  ws["!cols"] = [{ wch: 28 }, { wch: 24 }, { wch: 10 }, { wch: 28 }];

  XLSX.utils.book_append_sheet(wb, ws, "FD Receipt");
  XLSX.writeFile(
    wb,
    `FD_Receipt_${record.accountNo}_${record.openingDate}.xlsx`,
  );
}

export function downloadTransactionReceipt(record: TransactionRecord) {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  function fmt(dateStr: string): string {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  const data = [
    [BANK_NAME],
    [BRANCH_NAME],
    [BRANCH_IFSC],
    ["TRANSACTION RECEIPT"],
    [],
    ["Receipt No:", record.referenceId],
    ["Generated on:", new Date().toLocaleDateString("en-IN")],
    [],
    ["TRANSACTION DETAILS"],
    ["Reference ID:", record.referenceId],
    ["Transaction Type:", record.transactionType],
    ["Transaction Date:", fmt(record.transactionDate)],
    ["Frequency:", record.frequencyType],
    [],
    ["ACCOUNT DETAILS"],
    ["Account Number:", record.accountNumber],
    ["Account Holder Name:", record.accountHolderName],
    ["Bank Name:", record.bankName],
    ["IFSC Code:", record.ifscCode],
    [],
    ["AMOUNT DETAILS"],
    ["Amount (INR):", record.amount],
    ["Transaction Status:", record.transactionStatus],
    [],
    ["Remark:", record.remark || "—"],
    [],
    [],
    ["Authorised Signatory", "", "", "Branch Manager"],
    [
      "Signature: ___________________",
      "",
      "",
      "Signature: ___________________",
    ],
    [],
    ["Stamp: ___________________", "", "", "Stamp: ___________________"],
    [],
    ["Thank you for banking with us."],
    ["Note: This is a computer generated receipt."],
    [`${BANK_NAME} – ${BRANCH_NAME}`],
  ];

  XLSX.utils.sheet_add_aoa(ws, data, { origin: 0 });
  ws["!cols"] = [{ wch: 28 }, { wch: 30 }, { wch: 10 }, { wch: 28 }];

  XLSX.utils.book_append_sheet(wb, ws, "Transaction Receipt");
  XLSX.writeFile(
    wb,
    `Receipt_${record.referenceId}_${record.transactionDate}.xlsx`,
  );
}
