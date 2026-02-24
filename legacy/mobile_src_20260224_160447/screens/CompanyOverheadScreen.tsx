import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import { endpoints } from "../services/endpoints";
import { Badge, Card, FloatingLabelInput, ListRow, ModalSurface, Screen, SectionHeader, SelectField, StackModal, type SelectOption } from "../components/ui";
import type { RootStackParamList } from "../../App";
import { useAdminGate } from "../components/useAdminGate";

type Expense = {
  id: number;
  scope: "company" | "client";
  name: string;
  vendor?: string;
  category: string;
  amount: string | number;
  frequency: "monthly" | "yearly" | "one_time";
  start_date?: string | null;
  end_date?: string | null;
  amortize_months?: number;
  is_overhead?: boolean;
  is_pass_through?: boolean;
  notes?: string;
  monthly_equivalent?: string;
};

type Summary = {
  as_of: string;
  monthly_overhead: string;
  monthly_pass_through: string;
};

function toNumber(v: any): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(v: any): string {
  const n = toNumber(v);
  return `$${n.toFixed(2)}`;
}

const CATEGORY_OPTIONS: SelectOption[] = [
  { label: "Software", value: "software" },
  { label: "Subscription", value: "subscription" },
  { label: "Email", value: "email" },
  { label: "Domain", value: "domain" },
  { label: "Other", value: "other" }
];

const FREQUENCY_OPTIONS: SelectOption[] = [
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "One-time (amortized)", value: "one_time" }
];

const BOOL_OPTIONS: SelectOption[] = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" }
];

export default function CompanyOverheadScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "CompanyOverhead">>();

  const gate = useAdminGate("Company overhead");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editVendor, setEditVendor] = useState("");
  const [editCategory, setEditCategory] = useState("software");
  const [editAmount, setEditAmount] = useState("0.00");
  const [editFrequency, setEditFrequency] = useState<Expense["frequency"]>("monthly");
  const [editStartDate, setEditStartDate] = useState("");
  const [editAmortizeMonths, setEditAmortizeMonths] = useState("12");
  const [editIsOverhead, setEditIsOverhead] = useState("true");
  const [editIsPassThrough, setEditIsPassThrough] = useState("false");

  function resetForm() {
    setEditId(null);
    setEditName("");
    setEditVendor("");
    setEditCategory("software");
    setEditAmount("0.00");
    setEditFrequency("monthly");
    setEditStartDate("");
    setEditAmortizeMonths("12");
    setEditIsOverhead("true");
    setEditIsPassThrough("false");
  }

  async function refresh() {
    if (!gate.enabled) return;
    try {
      setStatus(null);
      const [expensesRes, overheadRes] = await Promise.all([
        endpoints.expenses.list({ scope: "company" }),
        endpoints.overhead.company()
      ]);

      setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : expensesRes.data?.results ?? []);
      setSummary(overheadRes.data as any);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to load company overhead");
    }
  }

  useEffect(() => {
    if (!gate.enabled) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate.enabled]);

  useEffect(() => {
    if (!gate.enabled) return;
    if (route.params && (route.params as any).openAdd) {
      openAdd();
    }
    // intentionally run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    if (!gate.enabled) return;
    resetForm();
    setEditIsOverhead("true");
    setEditIsPassThrough("false");
    setEditOpen(true);
  }

  function openEdit(exp: Expense) {
    if (!gate.enabled) return;
    setEditId(exp.id);
    setEditName(String(exp.name ?? ""));
    setEditVendor(String(exp.vendor ?? ""));
    setEditCategory(String(exp.category ?? "software"));
    setEditAmount(String(exp.amount ?? "0.00"));
    setEditFrequency(exp.frequency ?? "monthly");
    setEditStartDate(String(exp.start_date ?? ""));
    setEditAmortizeMonths(String(exp.amortize_months ?? 12));
    setEditIsOverhead(String(Boolean(exp.is_overhead ?? true)));
    setEditIsPassThrough(String(Boolean(exp.is_pass_through ?? false)));
    setEditOpen(true);
  }

  async function onSave() {
    if (!gate.enabled) return;
    try {
      setBusy(true);
      setStatus(null);

      const payload: any = {
        scope: "company",
        client: null,
        name: editName.trim(),
        vendor: editVendor.trim(),
        category: editCategory,
        amount: String(editAmount).trim(),
        frequency: editFrequency,
        start_date: editStartDate.trim() ? editStartDate.trim() : null,
        amortize_months: Math.max(1, Number(editAmortizeMonths) || 12),
        is_overhead: editIsOverhead === "true",
        is_pass_through: editIsPassThrough === "true"
      };

      if (!payload.name) {
        setStatus("Name is required");
        return;
      }

      if (editId) await endpoints.expenses.update(editId, payload);
      else await endpoints.expenses.create(payload);

      setEditOpen(false);
      await refresh();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save expense");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!gate.enabled) return;
    if (!editId) return;
    try {
      setBusy(true);
      setStatus(null);
      await endpoints.expenses.remove(editId);
      setEditOpen(false);
      await refresh();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to delete expense");
    } finally {
      setBusy(false);
    }
  }

  return gate.guard ?? (
    <Screen subtitle={summary ? `${money(summary.monthly_overhead)}/mo overhead` : "Company overhead"} statusText={status}>
      <SectionHeader
        title="Company Overhead"
        subtitle={summary ? `${money(summary.monthly_overhead)}/mo` : ""}
        action={
          gate.enabled ? (
            <View className="h-10 w-10 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          ) : undefined
        }
        onPressAction={gate.enabled ? openAdd : undefined}
      />

      <Card>
        <SectionHeader title="Summary" variant="card" />
        <View className="mt-2">
          <ListRow title="Monthly overhead" subtitle={summary ? money(summary.monthly_overhead) : "—"} />
          <ListRow title="Monthly pass-through" subtitle={summary ? money(summary.monthly_pass_through) : "—"} />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Expenses" variant="card" />
        <View className="mt-2">
          {expenses.length ? (
            <View>
              {expenses.map((e, idx) => (
                <View key={String(e.id)}>
                  {idx ? <View className="h-3" /> : null}
                  <ListRow
                    title={e.name}
                    subtitle={`${String(e.category)} • ${String(e.frequency)} • ${money(e.monthly_equivalent ?? 0)}/mo`}
                    right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                    onPress={gate.enabled ? () => openEdit(e) : undefined}
                  />
                  <View className="flex-row gap-2 mt-2">
                    {e.is_overhead ? <Badge label="Overhead" /> : <Badge label="Not overhead" />}
                    {e.is_pass_through ? <Badge label="Pass-through" /> : <Badge label="Internal" />}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="py-6">
              <Text className="opacity-70">No company overhead expenses yet.</Text>
            </View>
          )}
        </View>
      </Card>

      {gate.enabled ? (
        <StackModal
          overlayKey="company-overhead:edit"
          visible={editOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setEditOpen(false)}
        >
          <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setEditOpen(false)}>
            <Pressable onPress={() => {}}>
              <ModalSurface title={editId ? "Edit expense" : "Add expense"}>
                <View className="p-4 gap-3">
                  <FloatingLabelInput label="Name" value={editName} onChangeText={setEditName} placeholder="e.g. Google Workspace" />
                  <FloatingLabelInput label="Vendor" value={editVendor} onChangeText={setEditVendor} placeholder="e.g. Google" />
                  <SelectField label="Category" value={editCategory} options={CATEGORY_OPTIONS} onChange={setEditCategory} />
                  <SelectField label="Frequency" value={editFrequency} options={FREQUENCY_OPTIONS} onChange={(v) => setEditFrequency(v as any)} />
                  <FloatingLabelInput label="Amount" value={editAmount} onChangeText={setEditAmount} placeholder="0.00" keyboardType="decimal-pad" />
                  <FloatingLabelInput label="Start date (YYYY-MM-DD)" value={editStartDate} onChangeText={setEditStartDate} placeholder="2026-01-15" />
                  {editFrequency === "one_time" ? (
                    <FloatingLabelInput
                      label="Amortize months"
                      value={editAmortizeMonths}
                      onChangeText={setEditAmortizeMonths}
                      placeholder="12"
                      keyboardType="decimal-pad"
                    />
                  ) : null}
                  <SelectField label="Counts as overhead?" value={editIsOverhead} options={BOOL_OPTIONS} onChange={setEditIsOverhead} />
                  <SelectField label="Pass-through?" value={editIsPassThrough} options={BOOL_OPTIONS} onChange={setEditIsPassThrough} />

                  <View className="flex-row justify-between mt-2">
                    {editId ? (
                      <Pressable
                        onPress={onDelete}
                        disabled={busy}
                        className={busy ? "rounded-full border border-red-200 bg-white px-5 py-3 opacity-40" : "rounded-full border border-red-200 bg-white px-5 py-3"}
                        hitSlop={10}
                      >
                        <Text className="text-sm font-semibold text-red-600">Delete</Text>
                      </Pressable>
                    ) : (
                      <View />
                    )}

                    <View className="flex-row gap-2">
                      <Pressable onPress={() => setEditOpen(false)} hitSlop={10} className="rounded-full border border-gray-200 bg-white px-5 py-3">
                        <Text className="text-sm font-semibold">Close</Text>
                      </Pressable>
                      <Pressable
                        onPress={onSave}
                        disabled={busy}
                        hitSlop={10}
                        className={busy ? "rounded-full bg-black/90 px-5 py-3 opacity-40" : "rounded-full bg-black/90 px-5 py-3"}
                      >
                        <Text className="text-sm font-semibold text-white">Save</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </ModalSurface>
            </Pressable>
          </Pressable>
        </StackModal>
      ) : null}
    </Screen>
  );
}
