import React from "react";
import { Alert, Linking, Pressable, Share, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../App";
import { Card, FloatingLabelInput, ListRow, Screen, SectionHeader, SelectField } from "../components/ui";
import { api } from "../services/api";
import { TERM_MONTH_OPTIONS, US_STATE_OPTIONS } from "../constants/options";
import {
  ensureClientContract,
  getClientContract,
  recalculateClientContract,
  renderClientContract,
  setContractService,
  updateClientContract,
  type ClientContract,
  type ClientServiceSchedule
} from "../services/clientContractService";
import {
  listServiceScheduleTemplates,
  type ServiceScheduleTemplate
} from "../services/contractTemplateService";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function moneyInputToString(value: string) {
  return value.replace(/[^0-9.]/g, "");
}

function stableStringify(value: any): string {
  const seen = new WeakSet<object>();
  const sorter = (_key: string, v: any) => {
    if (v && typeof v === "object") {
      if (seen.has(v)) return undefined;
      seen.add(v);
      if (Array.isArray(v)) return v;
      const out: Record<string, any> = {};
      for (const key of Object.keys(v).sort()) out[key] = v[key];
      return out;
    }
    return v;
  };

  try {
    return JSON.stringify(value ?? null, sorter);
  } catch {
    return "";
  }
}

function hasUnresolvedPlaceholders(rendered: string): boolean {
  return /\{\{[^}]+\}\}/.test(rendered);
}

function confirmAlert(title: string, message: string, buttons: { text: string; style?: "cancel" | "default" | "destructive"; value: any }[]) {
  return new Promise<any>((resolve) => {
    Alert.alert(
      title,
      message,
      buttons.map((b) => ({
        text: b.text,
        style: b.style,
        onPress: () => resolve(b.value)
      }))
    );
  });
}

export default function ClientContractScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ClientContract">>();
  const { clientId } = route.params;
  const navigation = useNavigation<Nav>();

  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [contract, setContract] = React.useState<ClientContract | null>(null);
  const [templatesByKey, setTemplatesByKey] = React.useState<Record<string, ServiceScheduleTemplate>>({});

  const [baseFieldsDraft, setBaseFieldsDraft] = React.useState<Record<string, any>>({});
  const [scheduleDraft, setScheduleDraft] = React.useState<Record<string, { special_price: string; quantity: string }>>({});

  const refreshContract = React.useCallback(async (contractId: number) => {
    const fresh = await getClientContract(contractId);
    setContract(fresh);
    setBaseFieldsDraft(fresh.base_fields ?? {});

    const drafts: Record<string, { special_price: string; quantity: string }> = {};
    for (const s of fresh.service_schedules ?? []) {
      drafts[s.service_key] = {
        special_price: s.special_price ?? "",
        quantity: String(s.quantity ?? "1")
      };
    }
    setScheduleDraft(drafts);

    try {
      const scheduleTemplates = await listServiceScheduleTemplates(fresh.template);
      const map: Record<string, ServiceScheduleTemplate> = {};
      for (const t of scheduleTemplates) map[t.service_key] = t;
      setTemplatesByKey(map);
    } catch {
      setTemplatesByKey({});
    }
  }, []);

  React.useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setStatus(null);
        const ensured = await ensureClientContract(Number(clientId));
        if (!active) return;
        await refreshContract(ensured.id);
      } catch (e: any) {
        if (!active) return;
        setStatus(e?.message ?? "Unable to load contract");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [clientId, refreshContract]);

  async function onSaveBaseFields() {
    if (!contract) return;
    try {
      setStatus(null);
      setLoading(true);
      const updated = await updateClientContract(contract.id, { base_fields: baseFieldsDraft });
      setContract(updated);
      await renderClientContract(updated.id);
      await refreshContract(updated.id);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to save fields");
    } finally {
      setLoading(false);
    }
  }

  async function persistBaseFieldsIfDirty(contractId: number): Promise<number> {
    if (!contract) return contractId;
    const current = contract.base_fields ?? {};
    const draft = baseFieldsDraft ?? {};
    if (stableStringify(current) === stableStringify(draft)) return contractId;

    const updated = await updateClientContract(contractId, { base_fields: draft });
    setContract(updated);
    return updated.id;
  }

  function getUnsavedServiceKeys(): string[] {
    const schedules = contract?.service_schedules ?? [];
    const keys: string[] = [];
    for (const s of schedules) {
      const draft = scheduleDraft[s.service_key] ?? { special_price: s.special_price ?? "", quantity: String(s.quantity ?? "1") };
      const currentSpecial = s.special_price ?? "";
      const currentQty = String(s.quantity ?? "1");

      if (String(draft.special_price ?? "") !== String(currentSpecial) || String(draft.quantity ?? "") !== String(currentQty)) {
        keys.push(s.service_key);
      }
    }
    return keys;
  }

  async function applyAllServiceDrafts(contractId: number) {
    if (!contract) return;
    const schedules = contract.service_schedules ?? [];
    for (const s of schedules) {
      const draft = scheduleDraft[s.service_key] ?? { special_price: s.special_price ?? "", quantity: String(s.quantity ?? "1") };
      const currentSpecial = s.special_price ?? "";
      const currentQty = String(s.quantity ?? "1");
      const nextSpecial = String(draft.special_price ?? "");
      const nextQty = String(draft.quantity ?? "");

      if (nextSpecial === String(currentSpecial) && nextQty === String(currentQty)) continue;

      await setContractService(contractId, {
        service_key: s.service_key,
        special_price: nextSpecial.trim() === "" ? null : moneyInputToString(nextSpecial),
        quantity: moneyInputToString(nextQty).trim() === "" ? "1" : moneyInputToString(nextQty)
      });
    }

    await recalculateClientContract(contractId);
    await refreshContract(contractId);
  }

  async function ensureDraftsReady(contractId: number): Promise<boolean> {
    const unsavedServiceKeys = getUnsavedServiceKeys();
    if (unsavedServiceKeys.length === 0) return true;

    const choice = await confirmAlert(
      "Unsaved pricing changes",
      "You have module pricing/qty edits that haven\'t been applied yet.",
      [
        { text: "Cancel", style: "cancel", value: "cancel" },
        { text: "Continue", value: "continue" },
        { text: "Apply all", value: "apply" }
      ]
    );

    if (choice === "cancel") return false;
    if (choice === "apply") {
      await applyAllServiceDrafts(contractId);
    }
    return true;
  }

  async function onPreviewContract() {
    if (!contract) return;
    try {
      setStatus(null);
      setLoading(true);

      const contractId = await persistBaseFieldsIfDirty(contract.id);
      const ok = await ensureDraftsReady(contractId);
      if (!ok) return;

      await renderClientContract(contractId);
      navigation.navigate("ContractPreview", { clientId: Number(clientId), contractId });
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to preview contract");
    } finally {
      setLoading(false);
    }
  }

  async function onOpenSignature() {
    if (!contract) return;
    try {
      setStatus(null);
      setLoading(true);

      const contractId = await persistBaseFieldsIfDirty(contract.id);
      const ok = await ensureDraftsReady(contractId);
      if (!ok) return;

      navigation.navigate("ContractSignature", { clientId: Number(clientId), contractId });
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to open signature");
    } finally {
      setLoading(false);
    }
  }

  async function onSendContract() {
    if (!contract) return;
    try {
      setStatus(null);
      setLoading(true);

      const contractId = await persistBaseFieldsIfDirty(contract.id);
      const ok = await ensureDraftsReady(contractId);
      if (!ok) return;

      const rendered = await renderClientContract(contractId);
      const title = contract.client_name ? `${contract.client_name} Contract` : "Client Contract";

      // Try to find a good recipient (primary contact if present).
      let to = "";
      try {
        const contactsRes = await api.get("/contacts/", { params: { client: Number(clientId) } });
        const contacts = Array.isArray(contactsRes.data)
          ? contactsRes.data
          : contactsRes.data?.results ?? [];
        const primary = contacts.find((c: any) => c?.is_primary) ?? contacts[0];
        to = String(primary?.email ?? "").trim();
      } catch {
        to = "";
      }

      const body = rendered.rendered_contract || "";

      if (hasUnresolvedPlaceholders(body)) {
        const decision = await confirmAlert(
          "Missing fields",
          "Some placeholders still look unfilled (e.g. {{field}}). Send anyway?",
          [
            { text: "Cancel", style: "cancel", value: false },
            { text: "Send anyway", style: "destructive", value: true }
          ]
        );
        if (!decision) return;
      }

      const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
      const canOpen = await Linking.canOpenURL(mailto);

      if (canOpen) {
        await Linking.openURL(mailto);
        await updateClientContract(contractId, { contract_status: "sent" } as any);
        await refreshContract(contractId);
        return;
      }

      // Fallback: share sheet if mail app can't open.
      await Share.share({ title, message: body });
      await updateClientContract(contractId, { contract_status: "sent" } as any);
      await refreshContract(contractId);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to send contract");
    } finally {
      setLoading(false);
    }
  }

  async function onToggleService(schedule: ClientServiceSchedule) {
    if (!contract) return;
    try {
      setStatus(null);
      const nextEnabled = !schedule.is_enabled;
      const updatedSchedule = await setContractService(contract.id, {
        service_key: schedule.service_key,
        is_enabled: nextEnabled
      });

      setContract((prev) => {
        if (!prev) return prev;
        const nextSchedules = (prev.service_schedules ?? []).map((s) =>
          s.service_key === updatedSchedule.service_key ? { ...s, ...updatedSchedule } : s
        );
        return { ...prev, service_schedules: nextSchedules };
      });

      const total = await recalculateClientContract(contract.id);
      setContract((prev) => (prev ? { ...prev, total_price: String(total.total_price) } : prev));
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to update module");
    }
  }

  async function onSaveService(serviceKey: string) {
    if (!contract) return;
    const draft = scheduleDraft[serviceKey] ?? { special_price: "", quantity: "1" };

    try {
      setStatus(null);
      const updatedSchedule = await setContractService(contract.id, {
        service_key: serviceKey,
        special_price: draft.special_price.trim() === "" ? null : moneyInputToString(draft.special_price),
        quantity: moneyInputToString(draft.quantity).trim() === "" ? "1" : moneyInputToString(draft.quantity)
      });

      setContract((prev) => {
        if (!prev) return prev;
        const nextSchedules = (prev.service_schedules ?? []).map((s) =>
          s.service_key === updatedSchedule.service_key ? { ...s, ...updatedSchedule } : s
        );
        return { ...prev, service_schedules: nextSchedules };
      });

      const total = await recalculateClientContract(contract.id);
      setContract((prev) => (prev ? { ...prev, total_price: String(total.total_price) } : prev));
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to save pricing");
    }
  }

  const contractTitle = contract?.client_name ? `${contract.client_name} Contract` : "Client Contract";

  return (
    <Screen subtitle={loading ? "Loading…" : undefined} statusText={status}>
      <Card>
        <SectionHeader
          title={contractTitle}
          subtitle="Master contract → modules → totals → preview → signature"
          variant="card"
          action={
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => navigation.navigate("ContractTemplateManager")}
                hitSlop={10}
                className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center"
              >
                <Ionicons name="settings-outline" size={18} color="#111827" />
              </Pressable>
            </View>
          }
        />

        <View className="mt-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm opacity-70">Total</Text>
            <Text className="text-lg font-semibold">${Number(contract?.total_price ?? 0).toFixed(2)}</Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-sm opacity-70">Status</Text>
            <Text className="text-sm font-semibold">{contract?.contract_status ?? "—"}</Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-sm opacity-70">Signature</Text>
            <Text className="text-sm font-semibold">{contract?.signature_status ?? "—"}</Text>
          </View>

          <View className="flex-row gap-2 mt-4">
            <Pressable
              disabled={!contract || loading}
              onPress={onPreviewContract}
              className={`flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 items-center ${!contract || loading ? "opacity-50" : ""}`}
            >
              <Text className="text-sm font-semibold">Preview</Text>
            </Pressable>
            <Pressable
              disabled={!contract || loading}
              onPress={onSendContract}
              className={`flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 items-center ${!contract || loading ? "opacity-50" : ""}`}
            >
              <Text className="text-sm font-semibold">Send</Text>
            </Pressable>
            <Pressable
              disabled={!contract || loading}
              onPress={onOpenSignature}
              className={`flex-1 rounded-xl bg-gray-900 px-4 py-3 items-center ${!contract || loading ? "opacity-50" : ""}`}
            >
              <Text className="text-sm font-semibold text-white">Signature</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <Card>
        <SectionHeader title="Placeholders" subtitle="These sync from client + app data, with optional overrides" variant="card" />

        <View className="mt-3 gap-3">
          {(
            [
              { key: "effective_date", label: "Effective date" },
              { key: "term_months", label: "Term (months)" },
              { key: "start_date", label: "Start date" },
              { key: "end_date", label: "End date" },
              { key: "state", label: "State" },
              { key: "initial_budget", label: "Initial budget" },
              { key: "client_goal", label: "Client goal" }
            ] as const
          ).map((f) => (
            <View key={f.key}>
              {f.key === "term_months" ? (
                <SelectField
                  label={f.label}
                  value={String(baseFieldsDraft?.[f.key] ?? "")}
                  onChange={(v) => setBaseFieldsDraft((prev) => ({ ...(prev ?? {}), [f.key]: v }))}
                  options={[{ label: "", value: "" }, ...TERM_MONTH_OPTIONS]}
                  placeholder="Select"
                />
              ) : f.key === "state" ? (
                <SelectField
                  label={f.label}
                  value={String(baseFieldsDraft?.[f.key] ?? "")}
                  onChange={(v) => setBaseFieldsDraft((prev) => ({ ...(prev ?? {}), [f.key]: v }))}
                  options={[{ label: "", value: "" }, ...US_STATE_OPTIONS]}
                  placeholder="Select"
                />
              ) : (
                <FloatingLabelInput
                  label={f.label}
                  value={String(baseFieldsDraft?.[f.key] ?? "")}
                  onChangeText={(v) => setBaseFieldsDraft((prev) => ({ ...(prev ?? {}), [f.key]: v }))}
                  autoCapitalize="none"
                />
              )}
            </View>
          ))}

          <Pressable
            disabled={!contract}
            onPress={onSaveBaseFields}
            className="rounded-xl bg-gray-900 px-4 py-3 items-center"
          >
            <Text className="text-sm font-semibold text-white">Save placeholders</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <SectionHeader title="Service Modules" subtitle="Toggle modules and override pricing" variant="card" />

        <View className="mt-2">
          {(contract?.service_schedules ?? []).length === 0 ? (
            <Text className="text-sm opacity-70">No service modules yet.</Text>
          ) : (
            <View>
              {(contract?.service_schedules ?? []).map((s) => {
                const tpl = templatesByKey[s.service_key];
                const title = tpl?.service_title ?? s.service_key;
                const subtitle = `Unit: $${Number(s.unit_price ?? 0).toFixed(2)} • Subtotal: $${Number(s.subtotal ?? 0).toFixed(2)}`;

                const draft = scheduleDraft[s.service_key] ?? { special_price: s.special_price ?? "", quantity: String(s.quantity ?? "1") };

                return (
                  <View key={s.service_key} className="border-b border-gray-100">
                    <ListRow
                      title={title}
                      subtitle={subtitle}
                      left={
                        <Pressable
                          onPress={() => onToggleService(s)}
                          hitSlop={10}
                          className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center"
                        >
                          <Ionicons
                            name={s.is_enabled ? "checkmark-circle" : "ellipse-outline"}
                            size={20}
                            color={s.is_enabled ? "#16A34A" : "#6B7280"}
                          />
                        </Pressable>
                      }
                      right={<Ionicons name="chevron-forward" size={18} color="#111827" />}
                      onPress={() => {}}
                    />

                    <View className="px-1 pb-4">
                      <View className="flex-row gap-2">
                        <View className="flex-1">
                          <FloatingLabelInput
                            label="Special price"
                            value={draft.special_price}
                            onChangeText={(v) =>
                              setScheduleDraft((prev) => ({
                                ...prev,
                                [s.service_key]: { ...draft, special_price: moneyInputToString(v) }
                              }))
                            }
                            placeholder="e.g. 250"
                            keyboardType="decimal-pad"
                          />
                        </View>

                        <View style={{ width: 120 }}>
                          <FloatingLabelInput
                            label="Qty"
                            value={draft.quantity}
                            onChangeText={(v) =>
                              setScheduleDraft((prev) => ({
                                ...prev,
                                [s.service_key]: { ...draft, quantity: moneyInputToString(v) }
                              }))
                            }
                            placeholder="1"
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>

                      <View className="flex-row justify-end mt-3">
                        <Pressable
                          onPress={() => onSaveService(s.service_key)}
                          className="rounded-xl bg-gray-900 px-4 py-3"
                        >
                          <Text className="text-sm font-semibold text-white">Apply</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Card>
    </Screen>
  );
}
