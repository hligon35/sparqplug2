import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "../../App";
// import MarketingQuickActions from "../components/marketing/MarketingQuickActions";
import { Badge, Card, ChipSelect, ListRow, ModalSurface, Screen, SectionHeader } from "../components/ui";
import {
  createAdCampaign,
  createAdCreative,
  deleteAdCampaign,
  deleteAdCreative,
  disconnectGoogleAds,
  getGoogleAdsConnectUrl,
  getGoogleAdsStatus,
  loadAdsClientData,
  updateAdCampaign,
  updateAdCreative,
  updateAdsSettings,
  type AdCampaign,
  type AdCreative,
  type AdsSettings,
  type GoogleAdsStatus
} from "../services/marketingAdsService";
import { runMarketingTask } from "../services/aiService";
import { useAdminGate } from "../components/useAdminGate";

export default function ClientAdsEngineScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ClientAdsEngine">>();
  const { clientId } = route.params;

  const gate = useAdminGate("Paid Ads Management");

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string>("");
  const [engineId, setEngineId] = useState<number | null>(null);
  const [settings, setSettings] = useState<AdsSettings | null>(null);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [googleAds, setGoogleAds] = useState<GoogleAdsStatus | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [metaId, setMetaId] = useState("");
  const [tiktokId, setTiktokId] = useState("");
  const [googleId, setGoogleId] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignPlatform, setCampaignPlatform] = useState("meta");
  const [campaignObjective, setCampaignObjective] = useState("conversions");
  const [campaignFunnel, setCampaignFunnel] = useState("TOFU");

  const [campaignEditOpen, setCampaignEditOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<AdCampaign | null>(null);
  const [campaignEditPlatform, setCampaignEditPlatform] = useState("meta");
  const [campaignEditObjective, setCampaignEditObjective] = useState("conversions");
  const [campaignEditStatus, setCampaignEditStatus] = useState("active");

  const [creativeOpen, setCreativeOpen] = useState(false);
  const [creativeName, setCreativeName] = useState("");
  const [creativeFormat, setCreativeFormat] = useState("video");

  const [creativeEditOpen, setCreativeEditOpen] = useState(false);
  const [activeCreative, setActiveCreative] = useState<AdCreative | null>(null);
  const [creativeEditName, setCreativeEditName] = useState("");
  const [creativeEditFormat, setCreativeEditFormat] = useState("video");
  const [creativeEditStatus, setCreativeEditStatus] = useState("testing");

  const canAddCampaign = useMemo(() => !!engineId, [engineId]);
  const canAddCreative = useMemo(() => creativeName.trim().length > 0 && !!engineId, [creativeName, engineId]);
  const canSaveCampaign = useMemo(() => campaignEditPlatform.trim().length > 0, [campaignEditPlatform]);
  const canSaveCreative = useMemo(() => creativeEditName.trim().length > 0, [creativeEditName]);

  async function askCopilot() {
    setAiOpen(true);
    setAiBusy(true);
    setAiError(null);
    setAiText("");

    const res = await runMarketingTask(Number(clientId), "ads", "ad_copy_ideas", "markdown");
    if (!res.ok) {
      setAiError(res.error);
      setAiBusy(false);
      return;
    }

    const output = res.data?.output;
    const text =
      (output?.format === "markdown" && typeof output?.text === "string" && output.text) ||
      JSON.stringify(output ?? res.data, null, 2);
    setAiText(text);
    setAiBusy(false);
  }

  function openCampaignEditor(c: AdCampaign) {
    setActiveCampaign(c);
    setCampaignEditPlatform(c.platform ?? "meta");
    setCampaignEditObjective(c.objective ?? "conversions");
    setCampaignEditStatus(c.status ?? "active");
    setCampaignEditOpen(true);
  }

  function openCreativeEditor(c: AdCreative) {
    setActiveCreative(c);
    setCreativeEditName(c.name ?? "");
    setCreativeEditFormat(c.creative_format ?? "video");
    setCreativeEditStatus(c.status ?? "testing");
    setCreativeEditOpen(true);
  }

  async function refresh() {
    try {
      setStatus(null);
      const [res, googleStatus] = await Promise.all([
        loadAdsClientData(Number(clientId)),
        getGoogleAdsStatus(Number(clientId)).catch(() => null)
      ]);
      setEngineId(res.engineId);
      setSettings(res.settings);
      setCampaigns(res.campaigns);
      setCreatives(res.creatives);
      setGoogleAds(googleStatus);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to load ads engine");
    }
  }

  async function connectGoogle() {
    try {
      setStatus(null);
      setBusy(true);
      const { authorization_url } = await getGoogleAdsConnectUrl(Number(clientId), {
        customer_id: googleId
      });
      await Linking.openURL(authorization_url);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to start Google Ads connection");
    } finally {
      setBusy(false);
    }
  }

  async function disconnectGoogle() {
    try {
      setStatus(null);
      setBusy(true);
      await disconnectGoogleAds(Number(clientId));
      await refresh();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to disconnect Google Ads");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!gate.enabled) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, gate.enabled]);

  useEffect(() => {
    if (!settings) return;
    setMetaId(settings.meta_ad_account_id ?? "");
    setTiktokId(settings.tiktok_ad_account_id ?? "");
    setGoogleId(settings.google_ads_customer_id ?? "");
    setBudget(settings.monthly_budget ?? "");
    setNotes(settings.notes ?? "");
  }, [settings]);

  async function saveSettings() {
    if (!settings) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateAdsSettings(settings.id, {
        meta_ad_account_id: metaId,
        tiktok_ad_account_id: tiktokId,
        google_ads_customer_id: googleId,
        monthly_budget: budget || null,
        notes
      });
      setSettings(updated);
      setSettingsOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save ads settings");
    } finally {
      setBusy(false);
    }
  }

  async function addCampaign() {
    if (!engineId) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await createAdCampaign({
        engine: engineId,
        platform: campaignPlatform,
        objective: campaignObjective,
        funnel_stage: campaignFunnel,
        status: "active",
        start_date: null,
        end_date: null,
        budget: null
      });
      setCampaigns((prev) => [created, ...prev]);
      setCampaignOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add campaign");
    } finally {
      setBusy(false);
    }
  }

  async function saveCampaignEdits() {
    if (!activeCampaign || !canSaveCampaign) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateAdCampaign(activeCampaign.id, {
        platform: campaignEditPlatform,
        objective: campaignEditObjective,
        status: campaignEditStatus
      });
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setCampaignEditOpen(false);
      setActiveCampaign(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save campaign");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteCampaign(c: AdCampaign) {
    Alert.alert("Delete campaign?", `${c.platform || "ads"} • ${c.objective || "objective"}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdCampaign(c.id);
            setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete campaign");
          }
        }
      }
    ]);
  }

  async function addCreative() {
    if (!engineId || !canAddCreative) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await createAdCreative({
        engine: engineId,
        campaign: null,
        name: creativeName.trim(),
        creative_format: creativeFormat,
        hook: "",
        asset_url: "",
        variant: "",
        status: "testing",
        last_tested_at: null,
        is_winner: false,
        linked_task: null
      });
      setCreatives((prev) => [created, ...prev]);
      setCreativeName("");
      setCreativeOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add creative");
    } finally {
      setBusy(false);
    }
  }

  async function saveCreativeEdits() {
    if (!activeCreative || !canSaveCreative) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateAdCreative(activeCreative.id, {
        name: creativeEditName.trim(),
        creative_format: creativeEditFormat,
        status: creativeEditStatus
      });
      setCreatives((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setCreativeEditOpen(false);
      setActiveCreative(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save creative");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteCreative(c: AdCreative) {
    Alert.alert("Delete creative?", c.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdCreative(c.id);
            setCreatives((prev) => prev.filter((x) => x.id !== c.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete creative");
          }
        }
      }
    ]);
  }

  return gate.guard ?? (
    <Screen subtitle="Paid Ads Management" statusText={status}>
      <View className="mb-3 flex-row justify-end">
        <Pressable onPress={askCopilot} disabled={busy || aiBusy} className={busy || aiBusy ? "opacity-50" : ""}>
          <View className="h-9 px-3 rounded-full border border-gray-200 bg-white items-center justify-center flex-row gap-2">
            <Ionicons name="sparkles-outline" size={16} color="#111827" />
            <Text className="text-xs font-semibold">Ask Copilot</Text>
          </View>
        </Pressable>
      </View>

      <Modal visible={aiOpen} transparent animationType="fade" onRequestClose={() => setAiOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setAiOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface
              title="Ask Copilot"
              subtitle="Ads • ad_copy_ideas"
              headerRight={
                <Pressable onPress={() => setAiOpen(false)} hitSlop={10}>
                  <Ionicons name="close" size={22} color="#111827" />
                </Pressable>
              }
            >
              <View className="p-4">
                {aiError ? (
                  <View className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 mb-3">
                    <Text className="text-sm text-red-700">{aiError}</Text>
                  </View>
                ) : null}
                <Text className="text-xs opacity-60 mb-2">{aiBusy ? "Running..." : "Result"}</Text>
                <Text selectable className="text-sm">{aiText || (aiBusy ? "Generating..." : "No output")}</Text>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </Modal>

      {/*
      Quick actions are intentionally disabled across the app.
      This widget created linked Task + Calendar items for common actions.

      <MarketingQuickActions
        clientId={Number(clientId)}
        defaultCalendarPlatform="ads"
        defaultCalendarContentType="creative_test"
      />
      */}

      <Card>
        <SectionHeader
          title="Ads settings"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="create-outline" size={18} color="#111827" />
            </View>
          }
          onPressAction={() => setSettingsOpen(true)}
        />
        <View className="mt-3">
          <ListRow title="Meta account" subtitle={settings?.meta_ad_account_id || "Not set"} />
          <ListRow title="TikTok account" subtitle={settings?.tiktok_ad_account_id || "Not set"} />
          <ListRow title="Google Ads customer" subtitle={settings?.google_ads_customer_id || "Not set"} />
          <ListRow title="Monthly budget" subtitle={settings?.monthly_budget || "Not set"} />
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Google Ads connection"
          subtitle={googleAds?.connected ? "Connected" : "Not connected"}
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="refresh" size={18} color="#111827" />
            </View>
          }
          onPressAction={refresh}
        />
        <View className="mt-3">
          <ListRow title="Status" subtitle={googleAds?.connected ? "Connected" : "Not connected"} />
          <ListRow title="Customer ID" subtitle={googleAds?.customer_id || settings?.google_ads_customer_id || "Not set"} />
          <ListRow title="Token expiry" subtitle={googleAds?.token_expiry || "Unknown"} />

          <View className="flex-row justify-end gap-2 mt-3">
            {googleAds?.connected ? (
              <Pressable onPress={disconnectGoogle} disabled={busy} className={busy ? "opacity-50" : ""}>
                <Badge label="Disconnect" />
              </Pressable>
            ) : (
              <Pressable onPress={connectGoogle} disabled={busy} className={busy ? "opacity-50" : ""}>
                <Badge label="Connect" />
              </Pressable>
            )}
          </View>

          {!googleAds?.connected ? (
            <Text className="text-xs opacity-70 mt-3">
              Connect opens a browser consent screen. After completing it, tap Refresh.
            </Text>
          ) : null}
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Campaigns"
          subtitle="Meta + TikTok"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setCampaignOpen(true)}
        />
        <View className="mt-3">
          {campaigns.length === 0 ? (
            <Text className="text-sm opacity-70">No ad campaigns yet.</Text>
          ) : (
            campaigns.slice(0, 20).map((c) => (
              <ListRow
                key={c.id}
                title={`${c.platform || "ads"} • ${c.objective || "objective"}`}
                subtitle={`${c.funnel_stage || "stage"} • ${c.status || "status"}`}
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
          title="Creatives"
          subtitle="Weekly testing & A/B"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setCreativeOpen(true)}
        />
        <View className="mt-3">
          {creatives.length === 0 ? (
            <Text className="text-sm opacity-70">No creatives yet.</Text>
          ) : (
            creatives.slice(0, 20).map((c) => (
              <ListRow
                key={c.id}
                title={c.name}
                subtitle={`${c.creative_format || "format"} • ${c.status || "status"}`}
                onPress={() => openCreativeEditor(c)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => openCreativeEditor(c)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeleteCreative(c)}>
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
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit ads settings</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Meta ad account</Text>
              <TextInput value={metaId} onChangeText={setMetaId} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">TikTok ad account</Text>
              <TextInput value={tiktokId} onChangeText={setTiktokId} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Google Ads customer ID</Text>
              <TextInput
                value={googleId}
                onChangeText={setGoogleId}
                placeholder="123-456-7890"
                className="rounded-xl border border-gray-200 px-3 py-2"
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Monthly budget</Text>
              <TextInput value={budget} onChangeText={setBudget} placeholder="1000" keyboardType="numeric" className="rounded-xl border border-gray-200 px-3 py-2" />
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
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={campaignOpen} transparent animationType="fade" onRequestClose={() => setCampaignOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setCampaignOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Add ad campaign</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Platform</Text>
              <ChipSelect
                value={campaignPlatform}
                onChange={setCampaignPlatform}
                options={[
                  { label: "Meta", value: "meta" },
                  { label: "TikTok", value: "tiktok" },
                  { label: "Google", value: "google" }
                ]}
              />
              <View className="mt-2" />
              <TextInput
                value={campaignPlatform}
                onChangeText={setCampaignPlatform}
                placeholder="meta | tiktok | google"
                className="rounded-xl border border-gray-200 px-3 py-2"
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Objective</Text>
              <TextInput value={campaignObjective} onChangeText={setCampaignObjective} placeholder="conversions" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Funnel stage</Text>
              <ChipSelect
                value={campaignFunnel}
                onChange={setCampaignFunnel}
                options={[
                  { label: "TOFU", value: "TOFU" },
                  { label: "MOFU", value: "MOFU" },
                  { label: "BOFU", value: "BOFU" }
                ]}
              />
              <View className="mt-2" />
              <TextInput value={campaignFunnel} onChangeText={setCampaignFunnel} placeholder="TOFU" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setCampaignOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={addCampaign} disabled={!canAddCampaign || busy} className={!canAddCampaign || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Creating..." : "Create"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={campaignEditOpen} transparent animationType="fade" onRequestClose={() => setCampaignEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setCampaignEditOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit ad campaign</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Platform</Text>
              <ChipSelect
                value={campaignEditPlatform}
                onChange={setCampaignEditPlatform}
                options={[
                  { label: "Meta", value: "meta" },
                  { label: "TikTok", value: "tiktok" },
                  { label: "Google", value: "google" }
                ]}
              />
              <View className="mt-2" />
              <TextInput value={campaignEditPlatform} onChangeText={setCampaignEditPlatform} placeholder="meta | tiktok | google" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Objective</Text>
              <TextInput value={campaignEditObjective} onChangeText={setCampaignEditObjective} placeholder="conversions" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Status</Text>
              <ChipSelect
                value={campaignEditStatus}
                onChange={setCampaignEditStatus}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Paused", value: "paused" }
                ]}
              />
              <View className="mt-2" />
              <TextInput value={campaignEditStatus} onChangeText={setCampaignEditStatus} placeholder="active" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setCampaignEditOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={saveCampaignEdits} disabled={!canSaveCampaign || busy} className={!canSaveCampaign || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Saving..." : "Save"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={creativeOpen} transparent animationType="fade" onRequestClose={() => setCreativeOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setCreativeOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Add creative</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Name</Text>
              <TextInput value={creativeName} onChangeText={setCreativeName} placeholder="e.g. Hook v1" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Format</Text>
              <ChipSelect
                value={creativeFormat}
                onChange={setCreativeFormat}
                options={[
                  { label: "Video", value: "video" },
                  { label: "Image", value: "image" },
                  { label: "Carousel", value: "carousel" }
                ]}
              />
              <View className="mt-2" />
              <TextInput value={creativeFormat} onChangeText={setCreativeFormat} placeholder="video" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setCreativeOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={addCreative} disabled={!canAddCreative || busy} className={!canAddCreative || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Creating..." : "Create"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={creativeEditOpen} transparent animationType="fade" onRequestClose={() => setCreativeEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setCreativeEditOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit creative</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Name</Text>
              <TextInput value={creativeEditName} onChangeText={setCreativeEditName} placeholder="e.g. Hook v1" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Format</Text>
              <ChipSelect
                value={creativeEditFormat}
                onChange={setCreativeEditFormat}
                options={[
                  { label: "Video", value: "video" },
                  { label: "Image", value: "image" },
                  { label: "Carousel", value: "carousel" }
                ]}
              />
              <View className="mt-2" />
              <TextInput value={creativeEditFormat} onChangeText={setCreativeEditFormat} placeholder="video" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Status</Text>
              <ChipSelect
                value={creativeEditStatus}
                onChange={setCreativeEditStatus}
                options={[
                  { label: "Testing", value: "testing" },
                  { label: "Winner", value: "winning" },
                  { label: "Paused", value: "paused" }
                ]}
              />
              <View className="mt-2" />
              <TextInput value={creativeEditStatus} onChangeText={setCreativeEditStatus} placeholder="testing" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setCreativeEditOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={saveCreativeEdits} disabled={!canSaveCreative || busy} className={!canSaveCreative || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Saving..." : "Save"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

// --- Change Summary ---
// Added an "Ask Copilot" button + modal that calls runMarketingTask() for Ads tasks.
