import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PaymentHead } from "../hooks/useLocalStore";

interface Props {
  paymentHeads: PaymentHead[];
  onAdd: (name: string) => void;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function PaymentHeadManager({
  paymentHeads,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (paymentHeads.some((h) => h.name.toLowerCase() === name.toLowerCase())) {
      toast.error("A payment head with this name already exists");
      return;
    }
    onAdd(name);
    setNewName("");
    toast.success(`Payment head "${name}" added`);
  };

  const handleEdit = () => {
    if (!editingId || !editName.trim()) return;
    onEdit(editingId, editName.trim());
    setEditingId(null);
    toast.success("Payment head updated");
  };

  const handleDelete = () => {
    if (!deleteId) return;
    onDelete(deleteId);
    setDeleteId(null);
    toast.success("Payment head deleted");
  };

  return (
    <div className="space-y-4">
      {/* Add new */}
      <div className="flex gap-2">
        <Input
          data-ocid="payment_head.input"
          placeholder="New payment head name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1"
        />
        <Button
          data-ocid="payment_head.primary_button"
          onClick={handleAdd}
          className="bg-navy text-white hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {paymentHeads.map((head) => (
          <div
            key={head.id}
            className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{head.name}</span>
              {head.isDefault && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <ShieldCheck className="w-3 h-3" /> Default
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                data-ocid="payment_head.edit_button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setEditingId(head.id);
                  setEditName(head.name);
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                data-ocid="payment_head.delete_button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                disabled={head.isDefault}
                onClick={() => setDeleteId(head.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingId} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent data-ocid="payment_head.dialog">
          <DialogHeader>
            <DialogTitle>Edit Payment Head</DialogTitle>
          </DialogHeader>
          <Input
            data-ocid="payment_head.input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEdit()}
          />
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="payment_head.cancel_button"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="payment_head.save_button"
              onClick={handleEdit}
              className="bg-navy text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent data-ocid="payment_head.dialog">
          <DialogHeader>
            <DialogTitle>Delete Payment Head?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="payment_head.cancel_button"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-ocid="payment_head.delete_button"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
