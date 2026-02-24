import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Modal, Pressable, Switch, Text, TextInput, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "../../App";
// import MarketingQuickActions from "../components/marketing/MarketingQuickActions";
import { Badge, Card, ChipSelect, DateTimeField, ListRow, ModalSurface, Screen, SectionHeader } from "../components/ui";
import {
  disconnectGoogleAnalytics,
  getGA4Summary,
  getGoogleAnalyticsConnectUrl,
  getGoogleAnalyticsStatus,
  type GoogleAnalyticsConnectionStatus
} from "../services/marketingIntegrationsService";
import {
  createKeyword,
  createSEOContentPiece,
  deleteKeyword,
  deleteSEOContentPiece,
  loadSEOClientData,
  updateKeyword,
  updateSEOContentPiece,
  updateSEOSettings,
  type Keyword,
  type SEOContentPiece,
  type SEOSettings
} from "../services/marketingSEOService";
import { runMarketingTask } from "../services/aiService";
import { useAdminGate } from "../components/useAdminGate";

export default function ClientSEOEngineScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ClientSEOEngine">>();
  const { clientId } = route.params;

  const gate = useAdminGate("SEO Revenue Engine");

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string>("");
  const [engineId, setEngineId] = useState<number | null>(null);
  const [settings, setSettings] = useState<SEOSettings | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [content, setContent] = useState<SEOContentPiece[]>([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [ga4, setGa4] = useState("");
  const [gsc, setGsc] = useState("");
  const [postsTarget, setPostsTarget] = useState("2");
  const [technicalEnabled, setTechnicalEnabled] = useState(true);
  const [notes, setNotes] = useState("");

  const [keywordOpen, setKeywordOpen] = useState(false);
  const [keywordPhrase, setKeywordPhrase] = useState("");

  const [keywordEditOpen, setKeywordEditOpen] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState<Keyword | null>(null);
  const [keywordEditPhrase, setKeywordEditPhrase] = useState("");
  const [keywordEditStatus, setKeywordEditStatus] = useState("backlog");

  const [contentOpen, setContentOpen] = useState(false);
  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState("blog_post");
  const [contentStatus, setContentStatus] = useState("planned");
  const [plannedDate, setPlannedDate] = useState("");

  const [contentEditOpen, setContentEditOpen] = useState(false);
  const [activeContent, setActiveContent] = useState<SEOContentPiece | null>(null);
  const [contentEditTitle, setContentEditTitle] = useState("");
  const [contentEditType, setContentEditType] = useState("blog_post");
  const [contentEditStatus, setContentEditStatus] = useState("planned");
  const [contentEditPlannedDate, setContentEditPlannedDate] = useState("");

  const [gaStatus, setGaStatus] = useState<GoogleAnalyticsConnectionStatus | null>(null);
  const [ga4Totals, setGa4Totals] = useState<{ activeUsers?: string | null; sessions?: string | null } | null>(null);

  const canAddKeyword = useMemo(() => keywordPhrase.trim().length > 0, [keywordPhrase]);
  const canAddContent = useMemo(() => contentTitle.trim().length > 0, [contentTitle]);
  const canSaveKeyword = useMemo(() => keywordEditPhrase.trim().length > 0, [keywordEditPhrase]);
  const canSaveContent = useMemo(() => contentEditTitle.trim().length > 0, [contentEditTitle]);

  async function askCopilot() {
    setAiOpen(true);
    setAiBusy(true);
    setAiError(null);
    setAiText("");

    const res = await runMarketingTask(Number(clientId), "seo", "seo_audit", "markdown");
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

  async function refreshGoogleStatus() {
    try {
      const s = await getGoogleAnalyticsStatus(Number(clientId));
      setGaStatus(s);
    } catch {
      setGaStatus(null);
    }
  }

  async function connectGoogleAnalytics() {
    try {
      setStatus(null);
      setBusy(true);
      const { authorization_url } = await getGoogleAnalyticsConnectUrl(Number(clientId));
      await Linking.openURL(authorization_url);
      setStatus("Complete the connection in your browser, then return here and refresh.");
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to start Google connection");
    } finally {
      setBusy(false);
    }
  }

  async function disconnectGoogle() {
    try {
      setStatus(null);
      setBusy(true);
      await disconnectGoogleAnalytics(Number(clientId));
      setGa4Totals(null);
      await refreshGoogleStatus();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to disconnect Google");
    } finally {
      setBusy(false);
    }
  }

  async function runGA4Test() {
    try {
      setStatus(null);
      setBusy(true);
      const res = await getGA4Summary(Number(clientId), 30);
      setGa4Totals(res.totals ?? null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to fetch GA4 summary");
    } finally {
      setBusy(false);
    }
  }

  function openKeywordEditor(k: Keyword) {
    setActiveKeyword(k);
    setKeywordEditPhrase(k.phrase ?? "");
    setKeywordEditStatus(k.status ?? "backlog");
    setKeywordEditOpen(true);
  }

  function openContentEditor(c: SEOContentPiece) {
    setActiveContent(c);
    setContentEditTitle(c.title ?? "");
    setContentEditType(c.content_type ?? "blog_post");
    setContentEditStatus(c.status ?? "planned");
    setContentEditPlannedDate(c.planned_publish_date ?? "");
    setContentEditOpen(true);
  }

  async function refresh() {
    try {
      setStatus(null);
      const res = await loadSEOClientData(Number(clientId));
      setEngineId(res.engineId);
      setSettings(res.settings);
      setKeywords(res.keywords);
      setContent(res.content);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to load SEO engine");
    }
  }

  useEffect(() => {
    if (!gate.enabled) return;
    refresh();
    refreshGoogleStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, gate.enabled]);

  useEffect(() => {
    if (!settings) return;
    setDomain(settings.primary_domain ?? "");
    setGa4(settings.ga4_property_id ?? "");
    setGsc(settings.gsc_property ?? "");
    setPostsTarget(String(settings.monthly_revenue_posts_target ?? 2));
    setTechnicalEnabled(Boolean(settings.technical_seo_enabled));
    setNotes(settings.notes ?? "");
  }, [settings]);

  async function saveSettings() {
    if (!settings) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateSEOSettings(settings.id, {
        primary_domain: domain,
        ga4_property_id: ga4,
        gsc_property: gsc,
        monthly_revenue_posts_target: Number(postsTarget) || 2,
        technical_seo_enabled: technicalEnabled,
        notes
      });
      setSettings(updated);
      setSettingsOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save SEO settings");
    } finally {
      setBusy(false);
    }
  }

  async function addKeyword() {
    if (!engineId || !canAddKeyword) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await createKeyword({
        engine: engineId,
        phrase: keywordPhrase.trim(),
        intent: "",
        status: "backlog",
        volume: null,
        difficulty: null,
        priority: null,
        target_page_url: "",
        notes: ""
      });
      setKeywords((prev) => [created, ...prev]);
      setKeywordPhrase("");
      setKeywordOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add keyword");
    } finally {
      setBusy(false);
    }
  }

  async function saveKeywordEdits() {
    if (!activeKeyword || !canSaveKeyword) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateKeyword(activeKeyword.id, {
        phrase: keywordEditPhrase.trim(),
        status: keywordEditStatus
      });
      setKeywords((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
      setKeywordEditOpen(false);
      setActiveKeyword(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save keyword");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteKeyword(k: Keyword) {
    Alert.alert("Delete keyword?", k.phrase, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteKeyword(k.id);
            setKeywords((prev) => prev.filter((x) => x.id !== k.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete keyword");
          }
        }
      }
    ]);
  }

  async function addContentPiece() {
    if (!engineId || !canAddContent) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await createSEOContentPiece({
        engine: engineId,
        title: contentTitle.trim(),
        content_type: contentType,
        status: contentStatus,
        target_keyword: null,
        planned_publish_date: plannedDate || null,
        published_url: "",
        linked_task: null,
        linked_calendar_item: null,
        notes: ""
      });
      setContent((prev) => [created, ...prev]);
      setContentTitle("");
      setPlannedDate("");
      setContentOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add content piece");
    } finally {
      setBusy(false);
    }
  }

  async function saveContentEdits() {
    if (!activeContent || !canSaveContent) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateSEOContentPiece(activeContent.id, {
        title: contentEditTitle.trim(),
        content_type: contentEditType,
        status: contentEditStatus,
        planned_publish_date: contentEditPlannedDate || null
      });
      setContent((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setContentEditOpen(false);
      setActiveContent(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save content piece");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteContent(c: SEOContentPiece) {
    Alert.alert("Delete content piece?", c.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSEOContentPiece(c.id);
            setContent((prev) => prev.filter((x) => x.id !== c.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete content piece");
          }
        }
      }
    ]);
  }

  return gate.guard ?? (
    <Screen subtitle="SEO Revenue Engine" statusText={status}>
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
              subtitle="SEO • seo_audit"
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

      <Card>
        <SectionHeader
          title="Connections"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="refresh" size={18} color="#111827" />
            </View>
          }
          onPressAction={refreshGoogleStatus}
        />
        <View className="mt-3">
          <ListRow
            title="Google Analytics / Search Console"
            subtitle={gaStatus?.connected ? "Connected" : "Not connected"}
            right={
              <View className="flex-row gap-2">
                {gaStatus?.connected ? (
                  <>
                    <Pressable onPress={runGA4Test} disabled={busy}>
                      <View className="h-9 px-3 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Text className="text-xs font-semibold">Test GA4</Text>
                      </View>
                    </Pressable>
                    <Pressable onPress={disconnectGoogle} disabled={busy}>
                      <View className="h-9 px-3 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Text className="text-xs font-semibold">Disconnect</Text>
                      </View>
                    </Pressable>
                  </>
                ) : (
                  <Pressable onPress={connectGoogleAnalytics} disabled={busy}>
                    <View className="h-9 px-3 rounded-full bg-black items-center justify-center">
                      <Text className="text-xs font-semibold text-white">Connect</Text>
                    </View>
                  </Pressable>
                )}
              </View>
            }
            onPress={gaStatus?.connected ? runGA4Test : connectGoogleAnalytics}
          />

          {ga4Totals ? (
            <View className="mt-2">
              <Text className="text-xs opacity-70">GA4 last 30 days</Text>
              <Text className="text-sm">
                Active users: {ga4Totals.activeUsers ?? "—"} • Sessions: {ga4Totals.sessions ?? "—"}
              </Text>
            </View>
          ) : null}

          <Text className="text-xs opacity-60 mt-2">
            GA4 property ID is taken from SEO settings (GA4 Property).
          </Text>
        </View>
      </Card>

      {/*
      Quick actions are intentionally disabled across the app.
      This widget created linked Task + Calendar items for common actions.

      <MarketingQuickActions
        clientId={Number(clientId)}
        defaultCalendarPlatform="seo"
        defaultCalendarContentType="content"
      />
      */}

      <Card>
        <SectionHeader
          title="SEO Settings"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="create-outline" size={18} color="#111827" />
            </View>
          }
          onPressAction={() => setSettingsOpen(true)}
        />
        <View className="mt-3">
          <ListRow title="Primary domain" subtitle={settings?.primary_domain || "Not set"} />
          <ListRow title="GA4 property" subtitle={settings?.ga4_property_id || "Not set"} />
          <ListRow title="GSC property" subtitle={settings?.gsc_property || "Not set"} />
          <ListRow
            title="Monthly revenue posts"
            subtitle={String(settings?.monthly_revenue_posts_target ?? 2)}
          />
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Keywords"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setKeywordOpen(true)}
        />
        <View className="mt-3">
          {keywords.length === 0 ? (
            <Text className="text-sm opacity-70">No keywords yet.</Text>
          ) : (
            keywords.slice(0, 20).map((k) => (
              <ListRow
                key={k.id}
                title={k.phrase}
                subtitle={k.status || "keyword"}
                onPress={() => openKeywordEditor(k)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => openKeywordEditor(k)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeleteKeyword(k)}>
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
          title="Content strategy"
          subtitle="2 revenue-focused posts/month"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setContentOpen(true)}
        />
        <View className="mt-3">
          {content.length === 0 ? (
            <Text className="text-sm opacity-70">No content pieces yet.</Text>
          ) : (
            content.slice(0, 20).map((c) => (
              <ListRow
                key={c.id}
                title={c.title}
                subtitle={`${c.status || "status"} • ${c.content_type || "type"}`}
                onPress={() => openContentEditor(c)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => openContentEditor(c)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeleteContent(c)}>
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
            <ModalSurface title="Edit SEO settings">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Primary domain</Text>
                  <TextInput value={domain} onChangeText={setDomain} placeholder="example.com" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">GA4 property ID</Text>
                  <TextInput value={ga4} onChangeText={setGa4} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">GSC property</Text>
                  <TextInput value={gsc} onChangeText={setGsc} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Monthly revenue posts target</Text>
                  <TextInput value={postsTarget} onChangeText={setPostsTarget} placeholder="2" keyboardType="numeric" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-2">Technical SEO</Text>
                  <View className="flex-row items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                    <Text className="text-sm opacity-80">Enable technical SEO checks</Text>
                    <Switch value={technicalEnabled} onValueChange={setTechnicalEnabled} />
                  </View>
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

      <Modal visible={keywordOpen} transparent animationType="fade" onRequestClose={() => setKeywordOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setKeywordOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Add keyword">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Keyword phrase</Text>
                  <TextInput value={keywordPhrase} onChangeText={setKeywordPhrase} placeholder="e.g. best running shoes" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setKeywordOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable onPress={addKeyword} disabled={!canAddKeyword || busy} className={!canAddKeyword || busy ? "opacity-50" : ""}>
                    <Badge label={busy ? "Creating..." : "Create"} />
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={keywordEditOpen} transparent animationType="fade" onRequestClose={() => setKeywordEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setKeywordEditOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Edit keyword">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Keyword phrase</Text>
                  <TextInput value={keywordEditPhrase} onChangeText={setKeywordEditPhrase} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Status</Text>
                  <ChipSelect
                    value={keywordEditStatus}
                    onChange={setKeywordEditStatus}
                    options={[
                      { label: "Backlog", value: "backlog" },
                      { label: "Targeting", value: "targeting" },
                      { label: "Ranking", value: "ranking" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={keywordEditStatus} onChangeText={setKeywordEditStatus} placeholder="backlog" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setKeywordEditOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable onPress={saveKeywordEdits} disabled={!canSaveKeyword || busy} className={!canSaveKeyword || busy ? "opacity-50" : ""}>
                    <Badge label={busy ? "Saving..." : "Save"} />
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={contentOpen} transparent animationType="fade" onRequestClose={() => setContentOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setContentOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Add content piece">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Title</Text>
                  <TextInput value={contentTitle} onChangeText={setContentTitle} placeholder="e.g. Spring product roundup" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Content type</Text>
                  <ChipSelect
                    value={contentType}
                    onChange={setContentType}
                    options={[
                      { label: "Blog", value: "blog_post" },
                      { label: "Landing", value: "landing_page" },
                      { label: "Product", value: "product_page" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={contentType} onChangeText={setContentType} placeholder="blog_post" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Status</Text>
                  <ChipSelect
                    value={contentStatus}
                    onChange={setContentStatus}
                    options={[
                      { label: "Planned", value: "planned" },
                      { label: "Drafting", value: "drafting" },
                      { label: "Published", value: "published" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={contentStatus} onChangeText={setContentStatus} placeholder="planned" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <DateTimeField label="Planned publish date" mode="date" value={plannedDate} onChange={setPlannedDate} placeholder="Pick a date" />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setContentOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable onPress={addContentPiece} disabled={!canAddContent || busy} className={!canAddContent || busy ? "opacity-50" : ""}>
                    <Badge label={busy ? "Creating..." : "Create"} />
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={contentEditOpen} transparent animationType="fade" onRequestClose={() => setContentEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setContentEditOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Edit content piece">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Title</Text>
                  <TextInput value={contentEditTitle} onChangeText={setContentEditTitle} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Content type</Text>
                  <ChipSelect
                    value={contentEditType}
                    onChange={setContentEditType}
                    options={[
                      { label: "Blog", value: "blog_post" },
                      { label: "Landing", value: "landing_page" },
                      { label: "Product", value: "product_page" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={contentEditType} onChangeText={setContentEditType} placeholder="blog_post" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Status</Text>
                  <ChipSelect
                    value={contentEditStatus}
                    onChange={setContentEditStatus}
                    options={[
                      { label: "Planned", value: "planned" },
                      { label: "Drafting", value: "drafting" },
                      { label: "Published", value: "published" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={contentEditStatus} onChangeText={setContentEditStatus} placeholder="planned" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <DateTimeField
                    label="Planned publish date"
                    mode="date"
                    value={contentEditPlannedDate}
                    onChange={setContentEditPlannedDate}
                    placeholder="Pick a date"
                  />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setContentEditOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable onPress={saveContentEdits} disabled={!canSaveContent || busy} className={!canSaveContent || busy ? "opacity-50" : ""}>
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

// --- Change Summary ---
// Added an "Ask Copilot" button + modal that calls runMarketingTask() for SEO tasks.
