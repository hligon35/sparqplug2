import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "../../App";
// import MarketingQuickActions from "../components/marketing/MarketingQuickActions";
import { Badge, Card, ChipSelect, DateTimeField, ListRow, ModalSurface, Screen, SectionHeader } from "../components/ui";
import {
  createEmailCampaign,
  createEmailFlow,
  deleteEmailCampaign,
  deleteEmailFlow,
  loadRetentionClientData,
  updateEmailCampaign,
  updateEmailFlow,
  updateRetentionSettings,
  type EmailCampaign,
  type EmailFlow,
  type RetentionSettings
} from "../services/marketingRetentionService";
import { useAdminGate } from "../components/useAdminGate";

export default function ClientRetentionEngineScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ClientRetentionEngine">>();
  const { clientId } = route.params;

  const gate = useAdminGate("Retention (Email)");

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [engineId, setEngineId] = useState<number | null>(null);
  const [settings, setSettings] = useState<RetentionSettings | null>(null);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [flows, setFlows] = useState<EmailFlow[]>([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [provider, setProvider] = useState("klaviyo");
  const [accountId, setAccountId] = useState("");
  const [emailsPerMonth, setEmailsPerMonth] = useState("2");
  const [notes, setNotes] = useState("");

  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignSendAt, setCampaignSendAt] = useState("");

  const [campaignEditOpen, setCampaignEditOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<EmailCampaign | null>(null);
  const [campaignEditSubject, setCampaignEditSubject] = useState("");
  const [campaignEditStatus, setCampaignEditStatus] = useState("planned");
  const [campaignEditSendAt, setCampaignEditSendAt] = useState("");

  const [flowOpen, setFlowOpen] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [flowType, setFlowType] = useState("welcome");

  const [flowEditOpen, setFlowEditOpen] = useState(false);
  const [activeFlow, setActiveFlow] = useState<EmailFlow | null>(null);
  const [flowEditName, setFlowEditName] = useState("");
  const [flowEditType, setFlowEditType] = useState("welcome");
  const [flowEditStatus, setFlowEditStatus] = useState("active");

  const canAddCampaign = useMemo(() => campaignSubject.trim().length > 0 && !!engineId, [campaignSubject, engineId]);
  const canAddFlow = useMemo(() => flowName.trim().length > 0 && !!engineId, [flowName, engineId]);
  const canSaveCampaign = useMemo(() => campaignEditSubject.trim().length > 0, [campaignEditSubject]);
  const canSaveFlow = useMemo(() => flowEditName.trim().length > 0, [flowEditName]);

  function openCampaignEditor(c: EmailCampaign) {
    setActiveCampaign(c);
    setCampaignEditSubject(c.subject ?? "");
    setCampaignEditStatus(c.status ?? "planned");
    setCampaignEditSendAt(c.send_at ?? "");
    setCampaignEditOpen(true);
  }

  function openFlowEditor(f: EmailFlow) {
    setActiveFlow(f);
    setFlowEditName(f.name ?? "");
    setFlowEditType(f.flow_type ?? "welcome");
    setFlowEditStatus(f.status ?? "active");
    setFlowEditOpen(true);
  }

  async function refresh() {
    try {
      setStatus(null);
      const res = await loadRetentionClientData(Number(clientId));
      setEngineId(res.engineId);
      setSettings(res.settings);
      setCampaigns(res.campaigns);
      setFlows(res.flows);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to load retention engine");
    }
  }

  useEffect(() => {
    if (!gate.enabled) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, gate.enabled]);

  useEffect(() => {
    if (!settings) return;
    setProvider(settings.provider ?? "klaviyo");
    setAccountId(settings.account_id ?? "");
    setEmailsPerMonth(String(settings.promotional_emails_per_month ?? 2));
    setNotes(settings.notes ?? "");
  }, [settings]);

  async function saveSettings() {
    if (!settings) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateRetentionSettings(settings.id, {
        provider,
        account_id: accountId,
        promotional_emails_per_month: Number(emailsPerMonth) || 2,
        notes
      });
      setSettings(updated);
      setSettingsOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save retention settings");
    } finally {
      setBusy(false);
    }
  }

  async function addCampaign() {
    if (!engineId || !canAddCampaign) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await createEmailCampaign({
        engine: engineId,
        subject: campaignSubject.trim(),
        status: "planned",
        send_at: campaignSendAt || null,
        linked_task: null,
        linked_calendar_item: null,
        notes: ""
      });
      setCampaigns((prev) => [created, ...prev]);
      setCampaignSubject("");
      setCampaignSendAt("");
      setCampaignOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add email campaign");
    } finally {
      setBusy(false);
    }
  }

  async function saveCampaignEdits() {
    if (!activeCampaign || !canSaveCampaign) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateEmailCampaign(activeCampaign.id, {
        subject: campaignEditSubject.trim(),
        status: campaignEditStatus,
        send_at: campaignEditSendAt || null
      });
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setCampaignEditOpen(false);
      setActiveCampaign(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save email campaign");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteCampaign(c: EmailCampaign) {
    Alert.alert("Delete email campaign?", c.subject, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEmailCampaign(c.id);
            setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete email campaign");
          }
        }
      }
    ]);
  }

  async function addFlow() {
    if (!engineId || !canAddFlow) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await createEmailFlow({
        engine: engineId,
        name: flowName.trim(),
        flow_type: flowType,
        status: "active",
        last_updated_at: null,
        linked_task: null,
        notes: ""
      });
      setFlows((prev) => [created, ...prev]);
      setFlowName("");
      setFlowOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add email flow");
    } finally {
      setBusy(false);
    }
  }

  async function saveFlowEdits() {
    if (!activeFlow || !canSaveFlow) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateEmailFlow(activeFlow.id, {
        name: flowEditName.trim(),
        flow_type: flowEditType,
        status: flowEditStatus
      });
      setFlows((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setFlowEditOpen(false);
      setActiveFlow(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save email flow");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteFlow(f: EmailFlow) {
    Alert.alert("Delete email flow?", f.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEmailFlow(f.id);
            setFlows((prev) => prev.filter((x) => x.id !== f.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete flow");
          }
        }
      }
    ]);
  }

  return gate.guard ?? (
    <Screen subtitle="Retention (Email)" statusText={status}>
      {/*
      Quick actions are intentionally disabled across the app.
      This widget created linked Task + Calendar items for common actions.

      <MarketingQuickActions
        clientId={Number(clientId)}
        defaultCalendarPlatform="email"
        defaultCalendarContentType="send"
      />
      */}

      <Card>
        <SectionHeader
          title="Retention settings"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="create-outline" size={18} color="#111827" />
            </View>
          }
          onPressAction={() => setSettingsOpen(true)}
        />
        <View className="mt-3">
          <ListRow title="Provider" subtitle={settings?.provider || "Not set"} />
          <ListRow title="Promos/month" subtitle={String(settings?.promotional_emails_per_month ?? 2)} />
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Email campaigns"
          subtitle="2 promotional emails/month"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setCampaignOpen(true)}
        />
        <View className="mt-3">
          {campaigns.length === 0 ? (
            <Text className="text-sm opacity-70">No email campaigns yet.</Text>
          ) : (
            campaigns.slice(0, 20).map((c) => (
              <ListRow
                key={c.id}
                title={c.subject}
                subtitle={`${c.status || "status"} • ${c.send_at ? "scheduled" : "unscheduled"}`}
                onPress={() => openCampaignEditor(c)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => openCampaignEditor(c)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeleteCampaign(c)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                      </View>
                    </Pressable>
                  </View>
                }
              />
            ))
          )}
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Email flows"
          subtitle="Welcome, abandoned cart, post-purchase"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setFlowOpen(true)}
        />
        <View className="mt-3">
          {flows.length === 0 ? (
            <Text className="text-sm opacity-70">No flows yet.</Text>
          ) : (
            flows.slice(0, 20).map((f) => (
              <ListRow
                key={f.id}
                title={f.name}
                subtitle={`${f.flow_type || "flow"} • ${f.status || "status"}`}
                onPress={() => openFlowEditor(f)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => openFlowEditor(f)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeleteFlow(f)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                      </View>
                    </Pressable>
                  </View>
                }
              />
            ))
          )}
        </View>
      </Card>

      <Modal visible={settingsOpen} transparent animationType="fade" onRequestClose={() => setSettingsOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setSettingsOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Edit retention settings">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Provider</Text>
                  <ChipSelect
                    value={provider}
                    onChange={setProvider}
                    options={[
                      { label: "Klaviyo", value: "klaviyo" },
                      { label: "Mailchimp", value: "mailchimp" },
                      { label: "HubSpot", value: "hubspot" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={provider} onChangeText={setProvider} placeholder="klaviyo" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Account ID</Text>
                  <TextInput value={accountId} onChangeText={setAccountId} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Promo emails/month</Text>
                  <TextInput value={emailsPerMonth} onChangeText={setEmailsPerMonth} placeholder="2" keyboardType="numeric" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Notes</Text>
                  <TextInput value={notes} onChangeText={setNotes} placeholder="" multiline className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setSettingsOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable onPress={saveSettings} disabled={busy} className={busy ? "opacity-50" : ""}>
                    <Badge label={busy ? "Saving..." : "Save"} />
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={campaignOpen} transparent animationType="fade" onRequestClose={() => setCampaignOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setCampaignOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Add email campaign">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Subject</Text>
                  <TextInput value={campaignSubject} onChangeText={setCampaignSubject} placeholder="e.g. Weekend sale" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <DateTimeField
                    label="Send at"
                    mode="datetime"
                    value={campaignSendAt}
                    onChange={setCampaignSendAt}
                    placeholder="Pick date & time"
                  />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setCampaignOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable onPress={addCampaign} disabled={!canAddCampaign || busy} className={!canAddCampaign || busy ? "opacity-50" : ""}>
                    <Badge label={busy ? "Creating..." : "Create"} />
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={campaignEditOpen} transparent animationType="fade" onRequestClose={() => setCampaignEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setCampaignEditOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Edit email campaign">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Subject</Text>
                  <TextInput value={campaignEditSubject} onChangeText={setCampaignEditSubject} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Status</Text>
                  <ChipSelect
                    value={campaignEditStatus}
                    onChange={setCampaignEditStatus}
                    options={[
                      { label: "Planned", value: "planned" },
                      { label: "Scheduled", value: "scheduled" },
                      { label: "Sent", value: "sent" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={campaignEditStatus} onChangeText={setCampaignEditStatus} placeholder="planned" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <DateTimeField
                    label="Send at"
                    mode="datetime"
                    value={campaignEditSendAt}
                    onChange={setCampaignEditSendAt}
                    placeholder="Pick date & time"
                  />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setCampaignEditOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable onPress={saveCampaignEdits} disabled={!canSaveCampaign || busy} className={!canSaveCampaign || busy ? "opacity-50" : ""}>
                    <Badge label={busy ? "Saving..." : "Save"} />
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={flowOpen} transparent animationType="fade" onRequestClose={() => setFlowOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setFlowOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Add email flow">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Name</Text>
                  <TextInput value={flowName} onChangeText={setFlowName} placeholder="e.g. Welcome series" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Flow type</Text>
                  <ChipSelect
                    value={flowType}
                    onChange={setFlowType}
                    options={[
                      { label: "Welcome", value: "welcome" },
                      { label: "Abandoned cart", value: "abandoned_cart" },
                      { label: "Post-purchase", value: "post_purchase" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={flowType} onChangeText={setFlowType} placeholder="welcome" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setFlowOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable onPress={addFlow} disabled={!canAddFlow || busy} className={!canAddFlow || busy ? "opacity-50" : ""}>
                    <Badge label={busy ? "Creating..." : "Create"} />
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={flowEditOpen} transparent animationType="fade" onRequestClose={() => setFlowEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setFlowEditOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Edit email flow">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Name</Text>
                  <TextInput value={flowEditName} onChangeText={setFlowEditName} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Flow type</Text>
                  <ChipSelect
                    value={flowEditType}
                    onChange={setFlowEditType}
                    options={[
                      { label: "Welcome", value: "welcome" },
                      { label: "Abandoned cart", value: "abandoned_cart" },
                      { label: "Post-purchase", value: "post_purchase" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={flowEditType} onChangeText={setFlowEditType} placeholder="welcome" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Status</Text>
                  <ChipSelect
                    value={flowEditStatus}
                    onChange={setFlowEditStatus}
                    options={[
                      { label: "Active", value: "active" },
                      { label: "Paused", value: "paused" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={flowEditStatus} onChangeText={setFlowEditStatus} placeholder="active" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setFlowEditOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable onPress={saveFlowEdits} disabled={!canSaveFlow || busy} className={!canSaveFlow || busy ? "opacity-50" : ""}>
                    <Badge label={busy ? "Saving..." : "Save"} />
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
