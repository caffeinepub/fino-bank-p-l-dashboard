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
import { Download, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { downloadFDReceipt } from "../utils/excelExport";
import type { FDRecord } from "../utils/excelExport";

const RATE_BY_TENURE: Record<number, number> = { 1: 5, 2: 7, 3: 10 };

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

interface Props {
  fdRecords: FDRecord[];
  onAdd: (record: Omit<FDRecord, "id">) => void;
  onDelete: (id: string) => void;
}

export function FDHistory({ fdRecords, onAdd, onDelete }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    customerName: "",
    accountNo: "",
    cifNo: "",
    contactNo: "",
    openingDate: today,
    fdAmount: "",
    tenure: "1",
  });
  const [search, setSearch] = useState("");
  const [filterTenure, setFilterTenure] = useState("all");

  const tenure = Number(form.tenure);
  const rate = RATE_BY_TENURE[tenure >= 3 ? 3 : tenure] || 5;
  const fdAmountNum = Number(form.fdAmount) || 0;
  const interestAmount =
    fdAmountNum * (rate / 100) * (tenure >= 3 ? 3 : tenure);
  const maturityAmount = fdAmountNum + interestAmount;
  const closureDate = form.openingDate
    ? addDays(addYears(form.openingDate, tenure >= 3 ? 3 : tenure), 8)
    : "";

  const filtered = useMemo(() => {
    return fdRecords.filter((r) => {
      const matchSearch =
        !search ||
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.accountNo.toLowerCase().includes(search.toLowerCase());
      const matchTenure =
        filterTenure === "all" || r.tenure === Number(filterTenure);
      return matchSearch && matchTenure;
    });
  }, [fdRecords, search, filterTenure]);

  const handleSubmit = () => {
    if (
      !form.customerName ||
      !form.accountNo ||
      !form.cifNo ||
      !form.contactNo ||
      !form.fdAmount
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    onAdd({
      customerName: form.customerName,
      accountNo: form.accountNo,
      cifNo: form.cifNo,
      contactNo: form.contactNo,
      openingDate: form.openingDate,
      fdAmount: fdAmountNum,
      tenure: tenure >= 3 ? 3 : tenure,
      interestRate: rate,
      interestAmount,
      maturityAmount,
      closureDate,
    });
    setForm({
      customerName: "",
      accountNo: "",
      cifNo: "",
      contactNo: "",
      openingDate: today,
      fdAmount: "",
      tenure: "1",
    });
    toast.success("FD record saved successfully");
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      {/* Entry Form */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Fixed Deposit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs font-medium">Customer Name *</Label>
              <Input
                data-ocid="fd.input"
                placeholder="Full name"
                value={form.customerName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, customerName: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Account No *</Label>
              <Input
                data-ocid="fd.input"
                placeholder="Account number"
                value={form.accountNo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, accountNo: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">CIF No *</Label>
              <Input
                data-ocid="fd.input"
                placeholder="CIF number"
                value={form.cifNo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cifNo: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Contact No *</Label>
              <Input
                data-ocid="fd.input"
                placeholder="Mobile number"
                value={form.contactNo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactNo: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Date of Opening *</Label>
              <Input
                data-ocid="fd.input"
                type="date"
                value={form.openingDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, openingDate: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">FD Amount (₹) *</Label>
              <Input
                data-ocid="fd.input"
                type="number"
                placeholder="Amount"
                value={form.fdAmount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fdAmount: e.target.value }))
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Tenure</Label>
              <Select
                value={form.tenure}
                onValueChange={(v) => setForm((p) => ({ ...p, tenure: v }))}
              >
                <SelectTrigger
                  data-ocid="fd.select"
                  className="mt-1 h-8 text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years or more</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Interest Rate</Label>
              <Input
                readOnly
                value={`${rate}% (flat rate)`}
                className="mt-1 h-8 text-sm bg-muted cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Interest Amount (₹)</Label>
              <Input
                readOnly
                value={interestAmount > 0 ? fmt(interestAmount) : ""}
                placeholder="Auto-calculated"
                className="mt-1 h-8 text-sm bg-muted cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Maturity Amount (₹)</Label>
              <Input
                readOnly
                value={maturityAmount > 0 ? fmt(maturityAmount) : ""}
                placeholder="Auto-calculated"
                className="mt-1 h-8 text-sm bg-muted cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Date of Closure</Label>
              <Input
                readOnly
                value={closureDate}
                placeholder="Auto-calculated"
                className="mt-1 h-8 text-sm bg-muted cursor-not-allowed"
              />
            </div>
            <div className="flex items-end">
              <Button
                data-ocid="fd.submit_button"
                className="w-full h-8 bg-navy text-white hover:bg-primary/90 text-sm"
                onClick={handleSubmit}
              >
                Save FD
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            data-ocid="fd.search_input"
            placeholder="Search by name or account no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={filterTenure} onValueChange={setFilterTenure}>
          <SelectTrigger data-ocid="fd.select" className="w-40 h-8 text-sm">
            <SelectValue placeholder="Filter by tenure" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tenures</SelectItem>
            <SelectItem value="1">1 Year</SelectItem>
            <SelectItem value="2">2 Years</SelectItem>
            <SelectItem value="3">3 Years+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* FD Table */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div
              data-ocid="fd.empty_state"
              className="py-12 text-center text-muted-foreground text-sm"
            >
              No FD records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {[
                      "Customer",
                      "Account No",
                      "CIF No",
                      "Contact",
                      "Opening Date",
                      "FD Amount",
                      "Tenure",
                      "Rate",
                      "Interest",
                      "Maturity",
                      "Closure Date",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs uppercase whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec, idx) => (
                    <tr
                      key={rec.id}
                      data-ocid={`fd.item.${idx + 1}`}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2 font-medium whitespace-nowrap">
                        {rec.customerName}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {rec.accountNo}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {rec.cifNo}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {rec.contactNo}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {rec.openingDate}
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {fmt(rec.fdAmount)}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary" className="text-xs">
                          {rec.tenure}yr{rec.tenure > 1 ? "s" : ""}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">{rec.interestRate}%</td>
                      <td className="px-3 py-2 text-profit font-medium">
                        {fmt(rec.interestAmount)}
                      </td>
                      <td className="px-3 py-2 font-semibold text-navy">
                        {fmt(rec.maturityAmount)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {rec.closureDate}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button
                            data-ocid={`fd.secondary_button.${idx + 1}`}
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2 border-navy text-navy"
                            onClick={() => {
                              downloadFDReceipt(rec);
                              toast.success("Receipt downloaded");
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Receipt
                          </Button>
                          <Button
                            data-ocid={`fd.delete_button.${idx + 1}`}
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => {
                              onDelete(rec.id);
                              toast.success("FD record deleted");
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
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
