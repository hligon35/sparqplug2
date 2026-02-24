import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../App";
import { endpoints } from "../services/endpoints";
import { Badge, Card, FloatingLabelInput, ListRow, ModalSurface, Screen, SectionHeader, SelectField, StackModal, type SelectOption } from "../components/ui";

type RouteParams = { clientId: number };

type Expense = {
  id: number;
  scope: "company" | "client";
  client?: number | null;
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

type FeeRule = {
  id: number;
  client: number;
  fee_type: string;
  percentage: string | number;
  is_enabled?: boolean;
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
  { label: "Domain", value: "domain" },
  { label: "Email", value: "email" },
  { label: "Hosting", value: "hosting" },
  { label: "Subscription", value: "subscription" },
  { label: "Processing fees", value: "processing" },
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

export default function ClientExpensesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { clientId } = (route.params as RouteParams) || { clientId: 0 };

  const [clientName, setClientName] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [feeRule, setFeeRule] = useState<FeeRule | null>(null);
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

  const [feeOpen, setFeeOpen] = useState(false);
  const [feePercent, setFeePercent] = useState("1.5");
  const [feeEnabled, setFeeEnabled] = useState("true");

  const [eventOpen, setEventOpen] = useState(false);
  const [eventBasis, setEventBasis] = useState("0.00");

  const computedFeeAmount = useMemo(() => {
    const basis = toNumber(eventBasis);
    const pct = toNumber(feePercent);
    return ((basis * pct) / 100).toFixed(2);
  }, [eventBasis, feePercent]);

  function resetExpenseForm() {
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
    try {
      setStatus(null);

      const [clientRes, expensesRes, overheadRes, ruleRes] = await Promise.all([
        endpoints.clients.get(clientId),
        endpoints.expenses.list({ scope: "client", client: clientId }),
        endpoints.overhead.client(clientId),
        endpoints.clientFeeRules.list({ client: clientId })
      ]);

      setClientName(String(clientRes.data?.name ?? ""));
      setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : expensesRes.data?.results ?? []);
      setSummary(overheadRes.data as any);

      const rules = Array.isArray(ruleRes.data) ? ruleRes.data : ruleRes.data?.results ?? [];
      const r = rules?.[0] ?? null;
      setFeeRule(r);
      if (r) {
        setFeePercent(String(r.percentage ?? "1.5"));
        setFeeEnabled(String(Boolean(r.is_enabled ?? true)));
      }
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to load expenses");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  function openAdd() {
    resetExpenseForm();
    // Most client-specific costs start as pass-through.
    setEditIsOverhead("false");
    setEditIsPassThrough("true");
    setEditOpen(true);
  }

  function openEdit(exp: Expense) {
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

  async function onSaveExpense() {
    try {
      setBusy(true);
      setStatus(null);

      const payload: any = {
        scope: "client",
        client: clientId,
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

  async function onDeleteExpense() {
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

  async function onSaveFeeRule() {
    try {
      setBusy(true);
      setStatus(null);

      const payload = {
        client: clientId,
        percentage: String(feePercent).trim(),
        is_enabled: feeEnabled === "true"
      };

      const res = await endpoints.clientFeeRules.upsert(payload);
      setFeeRule(res.data);
      setFeeOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save fee rule");
    } finally {
      setBusy(false);
    }
  }

  async function onLogFeeEvent() {
    try {
      setBusy(true);
      setStatus(null);

      await endpoints.clientFeeEvents.create({
        client: clientId,
        fee_type: "order_processing",
        basis_amount: String(eventBasis).trim(),
        fee_amount: String(computedFeeAmount).trim(),
        occurred_at: new Date().toISOString(),
        note: ""
      });

      setEventOpen(false);
      setEventBasis("0.00");
      setStatus("Logged processing fee event");
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to log fee event");
    } finally {
      setBusy(false);
    }
  }

  const title = clientName ? `${clientName} Expenses` : "Expenses";
  const overheadLine = summary ? `${money(summary.monthly_overhead)}/mo overhead` : "Overhead";
  const passthroughLine = summary ? `${money(summary.monthly_pass_through)}/mo pass-through` : "Pass-through";

  return (
    <Screen subtitle={overheadLine} statusText={status}>
      <SectionHeader
        title={title}
        subtitle={passthroughLine}
        action={
          <View className="h-10 w-10 rounded-full border border-gray-200 bg-white items-center justify-center">
            <Ionicons name="add" size={22} color="#111827" />
          </View>
        }
        onPressAction={openAdd}
      />

      <Card>
        <SectionHeader title="Summary" variant="card" />
        <View className="mt-2">
          <ListRow title="Monthly overhead" subtitle={summary ? money(summary.monthly_overhead) : "—"} />
          <ListRow title="Monthly pass-through" subtitle={summary ? money(summary.monthly_pass_through) : "—"} />
          <ListRow
            title="Processing fee" 
            subtitle={feeRule ? `${feeRule.is_enabled ? "Enabled" : "Disabled"} • ${String(feeRule.percentage ?? feePercent)}%` : `${feePercent}% (not set)`}
            right={<Ionicons name="create-outline" size={18} color="#111827" />}
            onPress={() => setFeeOpen(true)}
          />
          <ListRow
            title="Log fee event"
            subtitle="Record an order processing fee occurrence"
            right={<Ionicons name="add" size={20} color="#111827" />}
            onPress={() => setEventOpen(true)}
          />
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
                    onPress={() => openEdit(e)}
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
              <Text className="opacity-70">No expenses yet.</Text>
            </View>
          )}
        </View>
      </Card>

      <StackModal
        overlayKey="expenses:edit"
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditOpen(false)}
      >
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setEditOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title={editId ? "Edit expense" : "Add expense"}>
              <View className="p-4 gap-3">
                <FloatingLabelInput label="Name" value={editName} onChangeText={setEditName} placeholder="e.g. Hosting" />
                <FloatingLabelInput label="Vendor" value={editVendor} onChangeText={setEditVendor} placeholder="e.g. GoDaddy" />
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
                      onPress={onDeleteExpense}
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
                      onPress={onSaveExpense}
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

      <StackModal
        overlayKey="expenses:fee"
        visible={feeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFeeOpen(false)}
      >
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setFeeOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Order processing fee">
              <View className="p-4 gap-3">
                <FloatingLabelInput label="Percentage" value={feePercent} onChangeText={setFeePercent} placeholder="1.5" keyboardType="decimal-pad" />
                <SelectField label="Enabled" value={feeEnabled} options={BOOL_OPTIONS} onChange={setFeeEnabled} />

                <View className="flex-row justify-end gap-2 mt-2">
                  <Pressable onPress={() => setFeeOpen(false)} hitSlop={10} className="rounded-full border border-gray-200 bg-white px-5 py-3">
                    <Text className="text-sm font-semibold">Close</Text>
                  </Pressable>
                  <Pressable
                    onPress={onSaveFeeRule}
                    disabled={busy}
                    hitSlop={10}
                    className={busy ? "rounded-full bg-black/90 px-5 py-3 opacity-40" : "rounded-full bg-black/90 px-5 py-3"}
                  >
                    <Text className="text-sm font-semibold text-white">Save</Text>
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </StackModal>

      <StackModal
        overlayKey="expenses:fee-event"
        visible={eventOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEventOpen(false)}
      >
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setEventOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Log fee event">
              <View className="p-4 gap-3">
                <FloatingLabelInput
                  label="Order total (basis)"
                  value={eventBasis}
                  onChangeText={setEventBasis}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
                <View className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <Text className="text-sm font-semibold opacity-60">Fee amount</Text>
                  <Text className="text-base mt-1">{money(computedFeeAmount)}</Text>
                </View>

                <View className="flex-row justify-end gap-2 mt-2">
                  <Pressable onPress={() => setEventOpen(false)} hitSlop={10} className="rounded-full border border-gray-200 bg-white px-5 py-3">
                    <Text className="text-sm font-semibold">Close</Text>
                  </Pressable>
                  <Pressable
                    onPress={onLogFeeEvent}
                    disabled={busy}
                    hitSlop={10}
                    className={busy ? "rounded-full bg-black/90 px-5 py-3 opacity-40" : "rounded-full bg-black/90 px-5 py-3"}
                  >
                    <Text className="text-sm font-semibold text-white">Log</Text>
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </StackModal>
    </Screen>
  );
}
