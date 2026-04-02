import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  IndianRupee,
  Pencil,
  PlusCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { TransactionRecord } from "../hooks/useLocalStore";
import { downloadTransactionReceipt } from "../utils/excelExport";

interface Props {
  transactions: TransactionRecord[];
  onAdd: (record: Omit<TransactionRecord, "id">) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (
    id: string,
    status: TransactionRecord["transactionStatus"],
  ) => void;
}

const TRANSACTION_TYPES: TransactionRecord["transactionType"][] = [
  "NEFT",
  "IMPS",
  "DMT",
  "Credit",
  "Debit",
  "New CASA",
  "MISC Payment",
  "AEPS",
];

const FREQUENCY_TYPES = ["One Time", "Recurring", "Standing Instruction"];

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const STATUS_CONFIG: Record<
  TransactionRecord["transactionStatus"],
  { label: string; className: string; icon: React.ReactNode }
> = {
  Success: {
    label: "Success",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  Pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  Failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

const TYPE_COLORS: Record<TransactionRecord["transactionType"], string> = {
  NEFT: "bg-blue-100 text-blue-800",
  IMPS: "bg-purple-100 text-purple-800",
  DMT: "bg-indigo-100 text-indigo-800",
  Credit: "bg-green-100 text-green-800",
  Debit: "bg-orange-100 text-orange-800",
  "New CASA": "bg-teal-100 text-teal-800",
  "MISC Payment": "bg-gray-100 text-gray-800",
  AEPS: "bg-cyan-100 text-cyan-800",
};

const EMPTY_FORM = {
  referenceId: "",
  transactionType: "NEFT" as TransactionRecord["transactionType"],
  accountNumber: "",
  accountHolderName: "",
  bankName: "",
  ifscCode: "",
  amount: "",
  transactionDate: new Date().toISOString().slice(0, 10),
  frequencyType: "One Time",
  remark: "",
  transactionStatus: "Success" as TransactionRecord["transactionStatus"],
};

export function TransactionHistory({
  transactions,
  onAdd,
  onDelete,
  onUpdateStatus,
}: Props) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "All" | TransactionRecord["transactionStatus"]
  >("All");
  const [typeFilter, setTypeFilter] = useState<
    "All" | TransactionRecord["transactionType"]
  >("All");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Status update dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<TransactionRecord | null>(
    null,
  );
  const [newStatus, setNewStatus] =
    useState<TransactionRecord["transactionStatus"]>("Success");

  const kpi = {
    total: transactions.length,
    totalAmount: transactions.reduce((s, t) => s + t.amount, 0),
    success: transactions.filter((t) => t.transactionStatus === "Success")
      .length,
    pending: transactions.filter((t) => t.transactionStatus === "Pending")
      .length,
    failed: transactions.filter((t) => t.transactionStatus === "Failed").length,
  };

  const filtered = transactions
    .filter(
      (t) => statusFilter === "All" || t.transactionStatus === statusFilter,
    )
    .filter((t) => typeFilter === "All" || t.transactionType === typeFilter);

  function generateRefId() {
    const now = Date.now().toString().slice(-10);
    setForm((f) => ({ ...f, referenceId: `TXN${now}` }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.referenceId.trim()) e.referenceId = "Required";
    if (!form.accountNumber.trim()) e.accountNumber = "Required";
    if (!form.accountHolderName.trim()) e.accountHolderName = "Required";
    if (!form.bankName.trim()) e.bankName = "Required";
    if (!form.ifscCode.trim()) e.ifscCode = "Required";
    if (!form.amount || Number(form.amount) <= 0)
      e.amount = "Enter valid amount";
    if (!form.transactionDate) e.transactionDate = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onAdd({
      referenceId: form.referenceId.trim(),
      transactionType: form.transactionType,
      accountNumber: form.accountNumber.trim(),
      accountHolderName: form.accountHolderName.trim(),
      bankName: form.bankName.trim(),
      ifscCode: form.ifscCode.trim().toUpperCase(),
      amount: Number(form.amount),
      transactionDate: form.transactionDate,
      frequencyType: form.frequencyType,
      remark: form.remark.trim(),
      transactionStatus: form.transactionStatus,
    });
    setForm({ ...EMPTY_FORM });
    setFormOpen(false);
  }

  function openStatusDialog(txn: TransactionRecord) {
    setSelectedTxn(txn);
    setNewStatus(txn.transactionStatus);
    setStatusDialogOpen(true);
  }

  function handleStatusSave() {
    if (!selectedTxn) return;
    onUpdateStatus(selectedTxn.id, newStatus);
    toast.success(`Status updated to ${newStatus}`);
    setStatusDialogOpen(false);
    setSelectedTxn(null);
  }

  function handleDownloadReceipt(txn: TransactionRecord) {
    downloadTransactionReceipt(txn);
    toast.success(`Receipt downloaded for ${txn.referenceId}`);
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-navy/20 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total
            </p>
            <p className="text-2xl font-bold text-navy mt-1">{kpi.total}</p>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>
        <Card className="border-navy/20 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Volume
            </p>
            <p className="text-xl font-bold text-navy mt-1">
              ₹{kpi.totalAmount.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground">Total Amount</p>
          </CardContent>
        </Card>
        <Card className="border-green-600/20 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-green-700 uppercase tracking-wide">
              Success
            </p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {kpi.success}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-amber-700 uppercase tracking-wide">
              Pending
            </p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {kpi.pending}
            </p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-red-700 uppercase tracking-wide">
              Failed
            </p>
            <p className="text-2xl font-bold text-red-700 mt-1">{kpi.failed}</p>
            <p className="text-xs text-muted-foreground">Unsuccessful</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction form */}
      <Card className="border-navy/20 shadow-sm">
        <CardHeader
          className="cursor-pointer select-none py-3 px-4"
          onClick={() => setFormOpen((o) => !o)}
          data-ocid="transaction.open_modal_button"
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Add New Transaction
            </CardTitle>
            {formOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        {formOpen && (
          <CardContent className="px-4 pb-4 pt-0">
            <form
              onSubmit={handleSubmit}
              noValidate
              data-ocid="transaction.modal"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Reference ID */}
                <div className="space-y-1">
                  <Label htmlFor="refId" className="text-xs">
                    Reference ID *
                  </Label>
                  <div className="flex gap-1">
                    <Input
                      id="refId"
                      data-ocid="transaction.input"
                      value={form.referenceId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, referenceId: e.target.value }))
                      }
                      placeholder="TXN..."
                      className="text-xs h-8"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={generateRefId}
                      title="Auto-generate"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                  {errors.referenceId && (
                    <p
                      className="text-[10px] text-red-600"
                      data-ocid="transaction.error_state"
                    >
                      {errors.referenceId}
                    </p>
                  )}
                </div>

                {/* Transaction Type */}
                <div className="space-y-1">
                  <Label className="text-xs">Transaction Type *</Label>
                  <Select
                    value={form.transactionType}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        transactionType:
                          v as TransactionRecord["transactionType"],
                      }))
                    }
                  >
                    <SelectTrigger
                      className="h-8 text-xs"
                      data-ocid="transaction.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Account Number */}
                <div className="space-y-1">
                  <Label htmlFor="accNo" className="text-xs">
                    Account Number *
                  </Label>
                  <Input
                    id="accNo"
                    data-ocid="transaction.input"
                    value={form.accountNumber}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, accountNumber: e.target.value }))
                    }
                    placeholder="34200012345"
                    className="text-xs h-8"
                  />
                  {errors.accountNumber && (
                    <p className="text-[10px] text-red-600">
                      {errors.accountNumber}
                    </p>
                  )}
                </div>

                {/* Account Holder Name */}
                <div className="space-y-1">
                  <Label htmlFor="accName" className="text-xs">
                    Account Holder Name *
                  </Label>
                  <Input
                    id="accName"
                    data-ocid="transaction.input"
                    value={form.accountHolderName}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        accountHolderName: e.target.value,
                      }))
                    }
                    placeholder="Full Name"
                    className="text-xs h-8"
                  />
                  {errors.accountHolderName && (
                    <p className="text-[10px] text-red-600">
                      {errors.accountHolderName}
                    </p>
                  )}
                </div>

                {/* Bank Name */}
                <div className="space-y-1">
                  <Label htmlFor="bankName" className="text-xs">
                    Bank Name *
                  </Label>
                  <Input
                    id="bankName"
                    data-ocid="transaction.input"
                    value={form.bankName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bankName: e.target.value }))
                    }
                    placeholder="Bank Name"
                    className="text-xs h-8"
                  />
                  {errors.bankName && (
                    <p className="text-[10px] text-red-600">
                      {errors.bankName}
                    </p>
                  )}
                </div>

                {/* IFSC Code */}
                <div className="space-y-1">
                  <Label htmlFor="ifsc" className="text-xs">
                    IFSC Code *
                  </Label>
                  <Input
                    id="ifsc"
                    data-ocid="transaction.input"
                    value={form.ifscCode}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        ifscCode: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="FINO0001599"
                    className="text-xs h-8 uppercase"
                  />
                  {errors.ifscCode && (
                    <p className="text-[10px] text-red-600">
                      {errors.ifscCode}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <Label htmlFor="amt" className="text-xs">
                    Amount (INR) *
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      id="amt"
                      type="number"
                      min="0"
                      data-ocid="transaction.input"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      placeholder="0.00"
                      className="text-xs h-8 pl-6"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-[10px] text-red-600">{errors.amount}</p>
                  )}
                </div>

                {/* Transaction Date */}
                <div className="space-y-1">
                  <Label htmlFor="txnDate" className="text-xs">
                    Transaction Date *
                  </Label>
                  <Input
                    id="txnDate"
                    type="date"
                    data-ocid="transaction.input"
                    value={form.transactionDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        transactionDate: e.target.value,
                      }))
                    }
                    className="text-xs h-8"
                  />
                  {errors.transactionDate && (
                    <p className="text-[10px] text-red-600">
                      {errors.transactionDate}
                    </p>
                  )}
                </div>

                {/* Frequency Type */}
                <div className="space-y-1">
                  <Label className="text-xs">Frequency Type</Label>
                  <Select
                    value={form.frequencyType}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, frequencyType: v }))
                    }
                  >
                    <SelectTrigger
                      className="h-8 text-xs"
                      data-ocid="transaction.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <Label className="text-xs">Transaction Status *</Label>
                  <Select
                    value={form.transactionStatus}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        transactionStatus:
                          v as TransactionRecord["transactionStatus"],
                      }))
                    }
                  >
                    <SelectTrigger
                      className="h-8 text-xs"
                      data-ocid="transaction.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Success" className="text-xs">
                        Success
                      </SelectItem>
                      <SelectItem value="Pending" className="text-xs">
                        Pending
                      </SelectItem>
                      <SelectItem value="Failed" className="text-xs">
                        Failed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Remark */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="remark" className="text-xs">
                    Remark
                  </Label>
                  <Textarea
                    id="remark"
                    data-ocid="transaction.textarea"
                    value={form.remark}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, remark: e.target.value }))
                    }
                    placeholder="Additional notes..."
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormOpen(false);
                    setForm({ ...EMPTY_FORM });
                    setErrors({});
                  }}
                  data-ocid="transaction.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-navy hover:bg-navy-dark text-white"
                  data-ocid="transaction.submit_button"
                >
                  Save Transaction
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            Status:
          </span>
          {(["All", "Success", "Pending", "Failed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              data-ocid="transaction.tab"
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === s
                  ? "bg-navy text-white border-navy"
                  : "border-gray-300 text-gray-600 hover:border-navy/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            Type:
          </span>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
          >
            <SelectTrigger
              className="h-7 text-xs w-40"
              data-ocid="transaction.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All" className="text-xs">
                All Types
              </SelectItem>
              {TRANSACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          Showing {filtered.length} of {transactions.length}
        </span>
      </div>

      {/* Transactions Table */}
      <Card className="border-navy/20 shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div
              className="py-12 text-center"
              data-ocid="transaction.empty_state"
            >
              <p className="text-muted-foreground text-sm">
                No transactions found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="transaction.table">
                <TableHeader>
                  <TableRow className="bg-navy/5">
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap">
                      Ref ID
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap">
                      Type
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap">
                      Account No.
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap">
                      Account Holder
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap">
                      Bank
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap">
                      IFSC
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap text-right">
                      Amount (₹)
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap">
                      Date
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap">
                      Frequency
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap">
                      Remark
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-navy whitespace-nowrap">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((txn, idx) => (
                    <TableRow
                      key={txn.id}
                      className="hover:bg-navy/5 transition-colors"
                      data-ocid={`transaction.item.${idx + 1}`}
                    >
                      <TableCell className="text-[11px] font-mono text-navy/80 whitespace-nowrap">
                        {txn.referenceId}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] px-1.5 py-0.5 font-medium ${TYPE_COLORS[txn.transactionType]}`}
                        >
                          {txn.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] font-mono whitespace-nowrap">
                        {txn.accountNumber}
                      </TableCell>
                      <TableCell className="text-[11px] whitespace-nowrap">
                        {txn.accountHolderName}
                      </TableCell>
                      <TableCell className="text-[11px] whitespace-nowrap">
                        {txn.bankName}
                      </TableCell>
                      <TableCell className="text-[11px] font-mono whitespace-nowrap">
                        {txn.ifscCode}
                      </TableCell>
                      <TableCell className="text-[11px] text-right font-semibold whitespace-nowrap">
                        ₹{txn.amount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-[11px] whitespace-nowrap">
                        {formatDate(txn.transactionDate)}
                      </TableCell>
                      <TableCell className="text-[11px] whitespace-nowrap">
                        {txn.frequencyType}
                      </TableCell>
                      <TableCell
                        className="text-[11px] max-w-[120px] truncate"
                        title={txn.remark}
                      >
                        {txn.remark || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_CONFIG[txn.transactionStatus].className}`}
                        >
                          {STATUS_CONFIG[txn.transactionStatus].icon}
                          {STATUS_CONFIG[txn.transactionStatus].label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* Update Status */}
                          <button
                            type="button"
                            onClick={() => openStatusDialog(txn)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-50"
                            title="Update Status"
                            data-ocid={`transaction.update_status_button.${idx + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {/* Download Receipt */}
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(txn)}
                            className="text-green-600 hover:text-green-800 transition-colors p-1 rounded hover:bg-green-50"
                            title="Download Receipt"
                            data-ocid={`transaction.receipt_button.${idx + 1}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => onDelete(txn.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                            title="Delete"
                            data-ocid={`transaction.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-navy">
              Update Transaction Status
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {selectedTxn && (
              <p className="text-xs text-muted-foreground">
                Ref:{" "}
                <span className="font-mono font-medium">
                  {selectedTxn.referenceId}
                </span>
              </p>
            )}
            <div className="space-y-1">
              <Label className="text-xs">New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(v) =>
                  setNewStatus(v as TransactionRecord["transactionStatus"])
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-navy text-white hover:bg-navy/90"
              onClick={handleStatusSave}
            >
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
