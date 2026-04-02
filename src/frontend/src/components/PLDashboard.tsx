import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { PaymentHead } from "../hooks/useLocalStore";
import type { PLEntry } from "../utils/excelExport";
import { PaymentHeadManager } from "./PaymentHeadManager";

const PIE_COLORS = [
  "#1E2E6E",
  "#5B6DAA",
  "#3B5299",
  "#7B8EC8",
  "#A8B4DC",
  "#293880",
  "#4A5C9A",
];

interface Props {
  paymentHeads: PaymentHead[];
  plEntries: PLEntry[];
  onAddEntry: (entry: Omit<PLEntry, "id">) => void;
  onDeleteEntry: (id: string) => void;
  onAddHead: (name: string) => void;
  onEditHead: (id: string, name: string) => void;
  onDeleteHead: (id: string) => void;
}

type EntryMode = "cashin" | "cashout" | "closing";

export function PLDashboard({
  paymentHeads,
  plEntries,
  onAddEntry,
  onDeleteEntry,
  onAddHead,
  onEditHead,
  onDeleteHead,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [entryMode, setEntryMode] = useState<EntryMode>("cashin");
  const [form, setForm] = useState({
    date: today,
    paymentHead: "",
    amount: "",
    notes: "",
  });
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [filterMode, setFilterMode] = useState<"today" | "range">("today");

  const filteredEntries = useMemo(() => {
    if (filterMode === "today") {
      return plEntries.filter((e) => e.date === today);
    }
    return plEntries.filter((e) => e.date >= fromDate && e.date <= toDate);
  }, [plEntries, filterMode, fromDate, toDate, today]);

  const totalCashIn = filteredEntries
    .filter((e) => e.type === "cashin" || e.type === "profit")
    .reduce((s, e) => s + e.amount, 0);
  const totalCashOut = filteredEntries
    .filter((e) => e.type === "cashout" || e.type === "loss")
    .reduce((s, e) => s + e.amount, 0);
  const closingBalance = filteredEntries
    .filter((e) => e.type === "closing")
    .reduce((s, e) => s + e.amount, 0);
  const netPL = totalCashIn - totalCashOut;

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filteredEntries) {
      map.set(e.paymentHead, (map.get(e.paymentHead) || 0) + e.amount);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredEntries]);

  const cashInBarData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filteredEntries.filter(
      (x) => x.type === "cashin" || x.type === "profit",
    )) {
      map.set(e.paymentHead, (map.get(e.paymentHead) || 0) + e.amount);
    }
    return Array.from(map.entries()).map(([name, amount]) => ({
      name,
      amount,
    }));
  }, [filteredEntries]);

  const cashOutBarData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filteredEntries.filter(
      (x) => x.type === "cashout" || x.type === "loss",
    )) {
      map.set(e.paymentHead, (map.get(e.paymentHead) || 0) + e.amount);
    }
    return Array.from(map.entries()).map(([name, amount]) => ({
      name,
      amount,
    }));
  }, [filteredEntries]);

  const handleSubmit = () => {
    if (!form.paymentHead || !form.amount || !form.date) {
      toast.error("Please fill in all required fields");
      return;
    }
    onAddEntry({
      date: form.date,
      paymentHead: form.paymentHead,
      amount: Number(form.amount),
      type: entryMode,
      notes: form.notes,
    });
    setForm({ date: today, paymentHead: "", amount: "", notes: "" });
    toast.success(
      entryMode === "cashin"
        ? "Cash In entry saved"
        : entryMode === "cashout"
          ? "Cash Out entry saved"
          : "Closing Balance saved",
    );
  };

  const getTypeLabel = (type: PLEntry["type"]) => {
    if (type === "cashin" || type === "profit") return "Cash In";
    if (type === "cashout" || type === "loss") return "Cash Out";
    if (type === "closing") return "Closing Balance";
    return type;
  };

  const getTypeBadgeClass = (type: PLEntry["type"]) => {
    if (type === "cashin" || type === "profit")
      return "bg-green-100 text-green-800";
    if (type === "cashout" || type === "loss") return "bg-red-100 text-red-800";
    if (type === "closing") return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total Cash In
                </p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {fmt(totalCashIn)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total Cash Out
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {fmt(totalCashOut)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Closing Balance
                </p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {fmt(closingBalance)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Net Profit / Loss
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    netPL >= 0 ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {fmt(netPL)}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  netPL >= 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {netPL >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-700" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <Card className="lg:col-span-1 border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Entry type selector */}
            <div>
              <Label className="text-xs font-medium">Entry Type *</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  data-ocid="pl.toggle"
                  type="button"
                  size="sm"
                  className={`flex-1 h-9 text-xs font-semibold ${
                    entryMode === "cashin"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-white border border-green-300 text-green-700 hover:bg-green-50"
                  }`}
                  onClick={() => setEntryMode("cashin")}
                >
                  <ArrowUpCircle className="w-3.5 h-3.5 mr-1" />
                  Cash In
                </Button>
                <Button
                  data-ocid="pl.toggle"
                  type="button"
                  size="sm"
                  className={`flex-1 h-9 text-xs font-semibold ${
                    entryMode === "cashout"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-white border border-red-300 text-red-700 hover:bg-red-50"
                  }`}
                  onClick={() => setEntryMode("cashout")}
                >
                  <ArrowDownCircle className="w-3.5 h-3.5 mr-1" />
                  Cash Out
                </Button>
              </div>
              <Button
                data-ocid="pl.toggle"
                type="button"
                size="sm"
                className={`w-full mt-1 h-9 text-xs font-semibold ${
                  entryMode === "closing"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-white border border-blue-300 text-blue-700 hover:bg-blue-50"
                }`}
                onClick={() => setEntryMode("closing")}
              >
                <Wallet className="w-3.5 h-3.5 mr-1" />
                Closing Balance
              </Button>
            </div>

            <div>
              <Label className="text-xs font-medium">Date *</Label>
              <Input
                data-ocid="pl.input"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Payment Head *</Label>
              <Select
                value={form.paymentHead}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, paymentHead: v }))
                }
              >
                <SelectTrigger
                  data-ocid="pl.select"
                  className="mt-1 h-8 text-sm"
                >
                  <SelectValue placeholder="Select head" />
                </SelectTrigger>
                <SelectContent>
                  {paymentHeads.map((h) => (
                    <SelectItem key={h.id} value={h.name}>
                      {h.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="Closing Balance">
                    Closing Balance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Amount (₹) *</Label>
              <Input
                data-ocid="pl.input"
                type="number"
                placeholder="Enter amount"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Notes</Label>
              <Textarea
                data-ocid="pl.textarea"
                placeholder="Optional notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="mt-1 text-sm resize-none"
                rows={2}
              />
            </div>
            <Button
              data-ocid="pl.submit_button"
              className={`w-full h-9 text-sm font-semibold text-white ${
                entryMode === "cashin"
                  ? "bg-green-600 hover:bg-green-700"
                  : entryMode === "cashout"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={handleSubmit}
            >
              {entryMode === "cashin"
                ? "Save Cash In"
                : entryMode === "cashout"
                  ? "Save Cash Out"
                  : "Save Closing Balance"}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Heads Manager */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-navy">
              Payment Heads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentHeadManager
              paymentHeads={paymentHeads}
              onAdd={onAddHead}
              onEdit={onEditHead}
              onDelete={onDeleteHead}
            />
          </CardContent>
        </Card>
      </div>

      {/* Date filter */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">View period:</span>
            <Button
              data-ocid="pl.tab"
              size="sm"
              variant={filterMode === "today" ? "default" : "outline"}
              className={
                filterMode === "today"
                  ? "h-7 text-xs bg-navy text-white"
                  : "h-7 text-xs"
              }
              onClick={() => setFilterMode("today")}
            >
              Today
            </Button>
            <Button
              data-ocid="pl.tab"
              size="sm"
              variant={filterMode === "range" ? "default" : "outline"}
              className={
                filterMode === "range"
                  ? "h-7 text-xs bg-navy text-white"
                  : "h-7 text-xs"
              }
              onClick={() => setFilterMode("range")}
            >
              Date Range
            </Button>
            {filterMode === "range" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-7 text-xs w-36"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-7 text-xs w-36"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {filteredEntries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-navy">
                Distribution by Payment Head
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ReTooltip
                    formatter={(v: number) => [
                      `₹${v.toLocaleString("en-IN")}`,
                      "Amount",
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cash In Bar */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-green-700">
                Cash In Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cashInBarData.length === 0 ? (
                <div
                  data-ocid="pl.empty_state"
                  className="h-[220px] flex items-center justify-center text-muted-foreground text-sm"
                >
                  No Cash In entries
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={cashInBarData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6EBF1" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <ReTooltip
                      formatter={(v: number) => [
                        `₹${v.toLocaleString("en-IN")}`,
                        "Cash In",
                      ]}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#22c55e"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cash Out Bar */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-red-600">
                Cash Out Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cashOutBarData.length === 0 ? (
                <div
                  data-ocid="pl.empty_state"
                  className="h-[220px] flex items-center justify-center text-muted-foreground text-sm"
                >
                  No Cash Out entries
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={cashOutBarData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6EBF1" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <ReTooltip
                      formatter={(v: number) => [
                        `₹${v.toLocaleString("en-IN")}`,
                        "Cash Out",
                      ]}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#ef4444"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-navy">
            Cash In / Out Report
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredEntries.length === 0 ? (
            <div
              data-ocid="pl.empty_state"
              className="py-12 text-center text-muted-foreground text-sm"
            >
              No entries for this period. Add one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase">
                      Date
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase">
                      Payment Head
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase">
                      Amount
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase">
                      Type
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase">
                      Notes
                    </th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      data-ocid={`pl.item.${idx + 1}`}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {entry.date}
                      </td>
                      <td className="px-4 py-2.5 font-medium">
                        {entry.paymentHead}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">{`₹${entry.amount.toLocaleString("en-IN")}`}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge
                          className={`text-xs ${getTypeBadgeClass(entry.type)}`}
                        >
                          {getTypeLabel(entry.type)}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {entry.notes || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <Button
                          data-ocid={`pl.delete_button.${idx + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => {
                            onDeleteEntry(entry.id);
                            toast.success("Entry deleted");
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
