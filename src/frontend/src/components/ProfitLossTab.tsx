import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  Info,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as ReTooltip,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { PLEntry, PLRecord } from "../utils/excelExport";

interface Props {
  plRecords: PLRecord[];
  plEntries: PLEntry[];
  onAdd: (record: Omit<PLRecord, "id">) => void;
  onDelete: (id: string) => void;
}

type Period = "daily" | "weekly" | "monthly";

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - day + 1);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmtDate = (x: Date) =>
    x.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  return `${fmtDate(mon)} \u2013 ${fmtDate(sun)}`;
}

function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function getWeekKey(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - day + 1);
  return mon.toISOString().slice(0, 10);
}

function getMonthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

const fmtAmount = (n: number) => `\u20b9${Math.abs(n).toLocaleString("en-IN")}`;

// Derive P&L records from plEntries (Cash In/Out tab data)
function deriveFromEntries(plEntries: PLEntry[]): PLRecord[] {
  const byDate = new Map<
    string,
    {
      openingCash: number;
      finoR: number;
      finoS: number;
      dpl: number;
      closing: number;
    }
  >();

  for (const e of plEntries) {
    if (!byDate.has(e.date)) {
      byDate.set(e.date, {
        openingCash: 0,
        finoR: 0,
        finoS: 0,
        dpl: 0,
        closing: 0,
      });
    }
    const rec = byDate.get(e.date)!;
    const head = e.paymentHead.toLowerCase();
    if (head.includes("opening cash")) rec.openingCash += e.amount;
    else if (head.includes("fino(r)") || head === "fino r balance")
      rec.finoR += e.amount;
    else if (head.includes("fino(s)") || head === "fino s balance")
      rec.finoS += e.amount;
    else if (head.includes("dpl")) rec.dpl += e.amount;
    if (e.type === "closing") rec.closing += e.amount;
  }

  return Array.from(byDate.entries())
    .map(([date, vals]) => ({
      id: `auto_${date}`,
      date,
      openingCash: vals.openingCash,
      finoR: vals.finoR,
      finoS: vals.finoS,
      dpl: vals.dpl,
      closing: vals.closing,
      profitLoss:
        vals.closing - vals.openingCash + vals.finoR + vals.finoS + vals.dpl,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function ProfitLossTab({
  plRecords,
  plEntries,
  onAdd,
  onDelete,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState<Period>("daily");
  const [form, setForm] = useState({
    date: today,
    openingCash: "",
    finoR: "",
    finoS: "",
    dpl: "",
    closing: "",
  });

  // Auto-derive from Cash In/Out entries
  const autoRecords = useMemo(() => deriveFromEntries(plEntries), [plEntries]);

  // When date changes in form, auto-fill from plEntries
  useEffect(() => {
    const match = autoRecords.find((r) => r.date === form.date);
    if (match) {
      setForm((p) => ({
        ...p,
        openingCash:
          match.openingCash > 0 ? String(match.openingCash) : p.openingCash,
        finoR: match.finoR > 0 ? String(match.finoR) : p.finoR,
        finoS: match.finoS > 0 ? String(match.finoS) : p.finoS,
        dpl: match.dpl > 0 ? String(match.dpl) : p.dpl,
        closing: match.closing > 0 ? String(match.closing) : p.closing,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, autoRecords]);

  // Combine auto-derived records with manual plRecords (manual ones override auto for same date)
  const combinedRecords = useMemo(() => {
    const manualDates = new Set(plRecords.map((r) => r.date));
    const autoOnly = autoRecords.filter((r) => !manualDates.has(r.date));
    return [...autoOnly, ...plRecords].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [autoRecords, plRecords]);

  const handleSubmit = () => {
    if (!form.date || !form.closing) {
      toast.error("Date and Closing Balance are required");
      return;
    }
    const openingCash = Number(form.openingCash) || 0;
    const finoR = Number(form.finoR) || 0;
    const finoS = Number(form.finoS) || 0;
    const dpl = Number(form.dpl) || 0;
    const closing = Number(form.closing) || 0;
    const profitLoss = closing - openingCash + finoR + finoS + dpl;
    onAdd({
      date: form.date,
      openingCash,
      finoR,
      finoS,
      dpl,
      closing,
      profitLoss,
    });
    setForm({
      date: today,
      openingCash: "",
      finoR: "",
      finoS: "",
      dpl: "",
      closing: "",
    });
    toast.success("P&L entry saved");
  };

  const aggregated = useMemo(() => {
    const sorted = [...combinedRecords];

    if (period === "daily") {
      return sorted.map((r) => ({
        label: new Date(r.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        opening: r.openingCash,
        finoR: r.finoR,
        finoS: r.finoS,
        dpl: r.dpl,
        closing: r.closing,
        profitLoss: r.profitLoss,
        ids: [r.id],
        key: r.id,
        isAuto: r.id.startsWith("auto_"),
      }));
    }

    const map = new Map<
      string,
      {
        label: string;
        opening: number;
        finoR: number;
        finoS: number;
        dpl: number;
        closing: number;
        profitLoss: number;
        ids: string[];
        key: string;
        isAuto: boolean;
      }
    >();

    for (const r of sorted) {
      const k = period === "weekly" ? getWeekKey(r.date) : getMonthKey(r.date);
      const label =
        period === "weekly" ? getWeekLabel(r.date) : getMonthLabel(r.date);
      const existing = map.get(k);
      if (existing) {
        existing.opening += r.openingCash;
        existing.finoR += r.finoR;
        existing.finoS += r.finoS;
        existing.dpl += r.dpl;
        existing.closing += r.closing;
        existing.profitLoss += r.profitLoss;
        existing.ids.push(r.id);
      } else {
        map.set(k, {
          label,
          opening: r.openingCash,
          finoR: r.finoR,
          finoS: r.finoS,
          dpl: r.dpl,
          closing: r.closing,
          profitLoss: r.profitLoss,
          ids: [r.id],
          key: k,
          isAuto: r.id.startsWith("auto_"),
        });
      }
    }
    return Array.from(map.values());
  }, [combinedRecords, period]);

  const totalPL = aggregated.reduce((s, r) => s + r.profitLoss, 0);
  const profitCount = aggregated.filter((r) => r.profitLoss >= 0).length;
  const lossCount = aggregated.filter((r) => r.profitLoss < 0).length;

  const chartData = aggregated.map((r) => ({
    name: r.label,
    profitLoss: r.profitLoss,
    chartKey: r.key,
  }));

  return (
    <div className="space-y-6">
      {/* Auto-pull notice */}
      {autoRecords.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>Auto-populated:</strong> P&amp;L data for{" "}
            {autoRecords.length} day(s) has been automatically pulled from the
            Cash In/Out tab (Opening Cash Balance, Fino(R), Fino(S), DPL, and
            Closing Balance entries).
          </span>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total P&amp;L
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${totalPL >= 0 ? "text-green-700" : "text-red-600"}`}
                >
                  {totalPL >= 0 ? "+" : "-"}
                  {fmtAmount(totalPL)}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${totalPL >= 0 ? "bg-green-100" : "bg-red-100"}`}
              >
                {totalPL >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-700" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Profit Periods
                </p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {profitCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Loss Periods
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {lossCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
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
              <Plus className="w-4 h-4" /> Manual P&amp;L Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              Selecting a date auto-fills values from Cash In/Out entries
            </div>
            <div>
              <Label className="text-xs font-medium">Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">
                Opening Cash Balance (&#8377;)
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={form.openingCash}
                onChange={(e) =>
                  setForm((p) => ({ ...p, openingCash: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">
                Fino(R) Balance (&#8377;)
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={form.finoR}
                onChange={(e) =>
                  setForm((p) => ({ ...p, finoR: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">
                Fino(S) Balance (&#8377;)
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={form.finoS}
                onChange={(e) =>
                  setForm((p) => ({ ...p, finoS: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">
                DPL Balance (&#8377;)
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={form.dpl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dpl: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">
                Closing Balance (&#8377;) *
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={form.closing}
                onChange={(e) =>
                  setForm((p) => ({ ...p, closing: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>

            {form.closing && (
              <div className="rounded-md bg-muted/60 p-3 text-xs space-y-1">
                <p className="font-semibold text-muted-foreground">
                  Formula Preview
                </p>
                <p className="text-muted-foreground">
                  P/L = Closing &#8722; Opening + Fino(R) + Fino(S) + DPL
                </p>
                <p className="font-bold text-sm">
                  {(() => {
                    const v =
                      (Number(form.closing) || 0) -
                      (Number(form.openingCash) || 0) +
                      (Number(form.finoR) || 0) +
                      (Number(form.finoS) || 0) +
                      (Number(form.dpl) || 0);
                    return (
                      <span
                        className={v >= 0 ? "text-green-700" : "text-red-600"}
                      >
                        {v >= 0 ? "Profit: +" : "Loss: -"}
                        {fmtAmount(v)}
                      </span>
                    );
                  })()}
                </p>
              </div>
            )}

            <Button
              className="w-full h-9 text-sm font-semibold bg-navy text-white hover:bg-navy/90"
              onClick={handleSubmit}
            >
              Save P&amp;L Entry
            </Button>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-semibold text-navy">
                Profit &amp; Loss Chart
              </CardTitle>
              <div className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={period === p ? "default" : "outline"}
                    className={
                      period === p
                        ? "h-7 text-xs bg-navy text-white capitalize"
                        : "h-7 text-xs capitalize"
                    }
                    onClick={() => setPeriod(p)}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                No entries yet. Add Cash In/Out entries to auto-populate.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
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
                    tickFormatter={(v) =>
                      `\u20b9${(Math.abs(v) / 1000).toFixed(0)}k`
                    }
                  />
                  <ReTooltip
                    formatter={(v: number) => [
                      `${v >= 0 ? "+" : "-"}\u20b9${Math.abs(v).toLocaleString("en-IN")}`,
                      "Profit / Loss",
                    ]}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                  <Bar dataKey="profitLoss" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={`cell-${entry.chartKey}`}
                        fill={entry.profitLoss >= 0 ? "#16a34a" : "#dc2626"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Period toggle for table */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">
          View by:
        </span>
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? "default" : "outline"}
            className={
              period === p
                ? "h-7 text-xs bg-navy text-white capitalize"
                : "h-7 text-xs capitalize"
            }
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {/* P&L Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-navy">
            P&amp;L Statement &#8212;{" "}
            {period.charAt(0).toUpperCase() + period.slice(1)} View
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {aggregated.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No P&amp;L data yet. Add Cash In/Out entries (Opening Cash
              Balance, Fino(R), Fino(S), DPL, Closing Balance) to auto-populate.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs uppercase">Period</TableHead>
                    <TableHead className="text-xs uppercase">Source</TableHead>
                    <TableHead className="text-right text-xs uppercase">
                      Opening Cash
                    </TableHead>
                    <TableHead className="text-right text-xs uppercase">
                      Fino(R)
                    </TableHead>
                    <TableHead className="text-right text-xs uppercase">
                      Fino(S)
                    </TableHead>
                    <TableHead className="text-right text-xs uppercase">
                      DPL
                    </TableHead>
                    <TableHead className="text-right text-xs uppercase">
                      Closing
                    </TableHead>
                    <TableHead className="text-right text-xs uppercase">
                      Profit / Loss
                    </TableHead>
                    {period === "daily" && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregated.map((row) => (
                    <TableRow
                      key={row.key}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium text-sm">
                        {row.label}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] font-medium ${
                            row.isAuto
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {row.isAuto ? "Auto" : "Manual"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmtAmount(row.opening)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmtAmount(row.finoR)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmtAmount(row.finoS)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmtAmount(row.dpl)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmtAmount(row.closing)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={`text-xs font-semibold ${
                            row.profitLoss >= 0
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                          }`}
                        >
                          {row.profitLoss >= 0 ? "+" : "-"}
                          {fmtAmount(row.profitLoss)}
                        </Badge>
                      </TableCell>
                      {period === "daily" && (
                        <TableCell>
                          {!row.isAuto && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => {
                                for (const id of row.ids) onDelete(id);
                                toast.success("Entry deleted");
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Formula: Profit / Loss = Closing Balance &#8722; Opening Cash Balance +
        Fino(R) Balance + Fino(S) Balance + DPL Balance
      </p>
    </div>
  );
}
