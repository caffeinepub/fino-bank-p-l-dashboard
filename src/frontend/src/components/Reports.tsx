import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  BarChart2,
  Clock,
  Download,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  downloadAllTransactions,
  downloadFDReport,
  downloadPLReport,
  downloadPnLReport,
} from "../utils/excelExport";
import type {
  FDRecord,
  PLEntry,
  PLRecord,
  TransactionRecord,
} from "../utils/excelExport";

type Period = "daily" | "weekly" | "bimonthly" | "monthly" | "custom";

interface Props {
  plEntries: PLEntry[];
  fdRecords: FDRecord[];
  transactions?: TransactionRecord[];
  plRecords?: PLRecord[];
}

function getPeriodDates(
  period: Period,
  customFrom: string,
  customTo: string,
): { from: string; to: string } {
  const today = new Date();
  const toStr = today.toISOString().slice(0, 10);

  if (period === "custom") return { from: customFrom, to: customTo };
  if (period === "daily") return { from: toStr, to: toStr };

  const from = new Date(today);
  if (period === "weekly") from.setDate(today.getDate() - 6);
  else if (period === "bimonthly") from.setDate(today.getDate() - 14);
  else if (period === "monthly") from.setMonth(today.getMonth() - 1);

  return { from: from.toISOString().slice(0, 10), to: toStr };
}

// Derive P&L records from Cash In/Out entries for the given period
function derivePnLFromEntries(entries: PLEntry[]): PLRecord[] {
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

  for (const e of entries) {
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

export function Reports({
  plEntries,
  fdRecords,
  transactions = [],
  plRecords = [],
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState<Period>("daily");
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);

  const { from: fromDate, to: toDate } = getPeriodDates(
    period,
    customFrom,
    customTo,
  );

  const filteredPL = plEntries.filter(
    (e) => e.date >= fromDate && e.date <= toDate,
  );

  // Build combined P&L records for the period (auto-derived + manual)
  const filteredPnLRecords = useMemo(() => {
    const autoDerived = derivePnLFromEntries(filteredPL);
    const manualDates = new Set(plRecords.map((r) => r.date));
    const autoOnly = autoDerived.filter((r) => !manualDates.has(r.date));
    const manualFiltered = plRecords.filter(
      (r) => r.date >= fromDate && r.date <= toDate,
    );
    return [...autoOnly, ...manualFiltered].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [filteredPL, plRecords, fromDate, toDate]);

  const PERIODS: { value: Period; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "bimonthly", label: "Bi-Monthly" },
    { value: "monthly", label: "Monthly" },
    { value: "custom", label: "Custom" },
  ];

  const handlePLDownload = () => {
    if (filteredPL.length === 0) {
      toast.error("No Cash In/Out entries found for the selected period");
      return;
    }
    downloadPLReport(filteredPL, fromDate, toDate);
    toast.success("Cash In/Out report downloaded");
  };

  const handleFDDownload = () => {
    if (fdRecords.length === 0) {
      toast.error("No FD records found");
      return;
    }
    downloadFDReport(fdRecords);
    toast.success("FD History report downloaded");
  };

  const handleAllDownload = () => {
    if (
      plEntries.length === 0 &&
      fdRecords.length === 0 &&
      transactions.length === 0
    ) {
      toast.error("No data found");
      return;
    }
    downloadAllTransactions(plEntries, fdRecords, transactions);
    toast.success("All transactions report downloaded");
  };

  const handlePnLDownload = () => {
    if (filteredPnLRecords.length === 0) {
      toast.error("No P&L data found for the selected period");
      return;
    }
    downloadPnLReport(filteredPnLRecords, fromDate, toDate);
    toast.success("Profit & Loss report downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-navy">
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  period === p.value
                    ? "bg-navy text-white border-navy"
                    : "border-gray-300 text-gray-600 hover:border-navy/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <Label className="text-xs">From Date</Label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="mt-1 h-8 text-sm w-36"
                />
              </div>
              <div>
                <Label className="text-xs">To Date</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="mt-1 h-8 text-sm w-36"
                />
              </div>
            </div>
          )}
          {period !== "custom" && (
            <p className="text-xs text-muted-foreground">
              Period: <span className="font-medium">{fromDate}</span> to{" "}
              <span className="font-medium">{toDate}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cash In/Out Report */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Cash In/Out Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Download Cash In &amp; Cash Out entries for the selected period as
              an Excel file with bank header, data table, and summary.
            </p>
            <div className="text-xs text-muted-foreground">
              {filteredPL.length} entries found in this period
            </div>
            <Button
              data-ocid="reports.primary_button"
              onClick={handlePLDownload}
              className="bg-navy text-white hover:bg-primary/90 h-8 text-sm"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Download Cash In/Out Report (.xlsx)
            </Button>
          </CardContent>
        </Card>

        {/* P&L Report */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Profit &amp; Loss Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Export daily P&amp;L data auto-calculated from Cash In/Out entries
              (Opening Cash, Fino(R), Fino(S), DPL, Closing Balance) for the
              selected period.
            </p>
            <div className="text-xs text-muted-foreground">
              {filteredPnLRecords.length} P&amp;L record(s) in this period
            </div>
            <Button
              onClick={handlePnLDownload}
              className="bg-green-700 text-white hover:bg-green-800 h-8 text-sm"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Download P&amp;L Report (.xlsx)
            </Button>
          </CardContent>
        </Card>

        {/* FD Report */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> FD History Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Export all Fixed Deposit records as a formatted Excel file
              including customer details, interest calculations, and maturity
              dates.
            </p>
            <div className="text-xs text-muted-foreground">
              {fdRecords.length} FD records total
            </div>
            <Button
              data-ocid="reports.secondary_button"
              onClick={handleFDDownload}
              className="bg-navy text-white hover:bg-primary/90 h-8 text-sm"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Download FD History (.xlsx)
            </Button>
          </CardContent>
        </Card>

        {/* All Transactions */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
              <Clock className="w-4 h-4" /> All Transactions (Combined Report)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Download a combined Excel workbook with separate sheets for Cash
              In/Out entries, FD records, and transaction history. Includes bank
              header, IFSC code, all data, and proper formatting.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
              <span>{plEntries.length} Cash In/Out entries</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{fdRecords.length} FD records</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{transactions.length} transactions</span>
            </div>
            <Button
              data-ocid="reports.primary_button"
              onClick={handleAllDownload}
              className="bg-navy text-white hover:bg-primary/90 h-8 text-sm"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Download All Transactions (.xlsx)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Format notes */}
      <Card className="border-border shadow-sm bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <h4 className="text-xs font-semibold text-navy mb-2">
            Excel File Format
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
            <li>
              All files include "Fino Small Finance Bank – Doolahat Branch –
              IFSC: FINO0001599" header
            </li>
            <li>Report title and generation date are stamped on each file</li>
            <li>
              P&amp;L report includes formula breakdown and summary totals
            </li>
            <li>
              FD Receipts (via FD History tab) include interest breakdown and
              signature/stamp placeholders
            </li>
            <li>
              Transaction receipts (via Transaction History tab) include full
              transaction details
            </li>
            <li>Column widths are auto-fitted for readability</li>
            <li>
              Files are downloaded directly to your device (no server upload)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
