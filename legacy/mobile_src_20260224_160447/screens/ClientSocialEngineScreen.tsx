import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "../../App";
// import MarketingQuickActions from "../components/marketing/MarketingQuickActions";
import { Badge, Card, ChipSelect, DateTimeField, ListRow, ModalSurface, Screen, SectionHeader } from "../components/ui";
import {
  disconnectMeta,
  getMetaConnectUrl,
  getMetaStatus,
  listMetaPages,
  selectMetaPage,
  type MetaConnectionStatus
} from "../services/marketingIntegrationsService";
import {
  createSocialCampaign,
  createSocialPost,
  deleteSocialCampaign,
  deleteSocialPost,
  loadSocialClientData,
  publishSocialPost,
  updateSocialCampaign,
  updateSocialPost,
  updateSocialSettings,
  type SocialCampaign,
  type SocialContentPost,
  type SocialSettings
} from "../services/marketingSocialService";
import { runMarketingTask } from "../services/aiService";
import { useAdminGate } from "../components/useAdminGate";

export default function ClientSocialEngineScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ClientSocialEngine">>();
  const { clientId } = route.params;

  const gate = useAdminGate("Social Media Management");

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string>("");
  const [engineId, setEngineId] = useState<number | null>(null);
  const [settings, setSettings] = useState<SocialSettings | null>(null);
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([]);
  const [posts, setPosts] = useState<SocialContentPost[]>([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [platformsRaw, setPlatformsRaw] = useState("");
  const [postsTarget, setPostsTarget] = useState("4");
  const [notes, setNotes] = useState("");

  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");

  const [campaignEditOpen, setCampaignEditOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<SocialCampaign | null>(null);
  const [campaignEditName, setCampaignEditName] = useState("");
  const [campaignEditTheme, setCampaignEditTheme] = useState("");

  const [postOpen, setPostOpen] = useState(false);
  const [postPlatform, setPostPlatform] = useState("instagram");
  const [postFormat, setPostFormat] = useState("feed");
  const [postCaption, setPostCaption] = useState("");
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [postScheduledAt, setPostScheduledAt] = useState("");

  const [postEditOpen, setPostEditOpen] = useState(false);
  const [activePost, setActivePost] = useState<SocialContentPost | null>(null);
  const [postEditPlatform, setPostEditPlatform] = useState("instagram");
  const [postEditStatus, setPostEditStatus] = useState("planned");
  const [postEditFormat, setPostEditFormat] = useState("feed");
  const [postEditCaption, setPostEditCaption] = useState("");
  const [postEditMediaUrl, setPostEditMediaUrl] = useState("");
  const [postEditScheduledAt, setPostEditScheduledAt] = useState("");

  const [metaStatus, setMetaStatus] = useState<MetaConnectionStatus | null>(null);
  const [metaPagesOpen, setMetaPagesOpen] = useState(false);
  const [metaPages, setMetaPages] = useState<Array<{ id: string; name: string; ig_business_account_id?: string | null }>>([]);

  const canAddCampaign = useMemo(() => campaignName.trim().length > 0, [campaignName]);
  const canAddPost = useMemo(() => postCaption.trim().length > 0, [postCaption]);
  const canSaveCampaign = useMemo(() => campaignEditName.trim().length > 0, [campaignEditName]);
  const canSavePost = useMemo(() => postEditCaption.trim().length > 0, [postEditCaption]);

  const enabledPlatforms = useMemo(
    () => (settings?.platforms ?? []).map((p) => String(p).trim().toLowerCase()).filter(Boolean),
    [settings]
  );

  const formatOptionsForPlatform = useMemo(() => {
    const p = String(postPlatform || "").trim().toLowerCase();
    if (p === "instagram") return [{ label: "Feed", value: "feed" }, { label: "Reel", value: "reel" }, { label: "Story", value: "story" }];
    if (p === "facebook") return [{ label: "Feed", value: "feed" }];
    if (p === "tiktok") return [{ label: "Post", value: "post" }];
    return [{ label: "Feed", value: "feed" }];
  }, [postPlatform]);

  const editFormatOptionsForPlatform = useMemo(() => {
    const p = String(postEditPlatform || "").trim().toLowerCase();
    if (p === "instagram") return [{ label: "Feed", value: "feed" }, { label: "Reel", value: "reel" }, { label: "Story", value: "story" }];
    if (p === "facebook") return [{ label: "Feed", value: "feed" }];
    if (p === "tiktok") return [{ label: "Post", value: "post" }];
    return [{ label: "Feed", value: "feed" }];
  }, [postEditPlatform]);

  async function askCopilot() {
    setAiOpen(true);
    setAiBusy(true);
    setAiError(null);
    setAiText("");

    const res = await runMarketingTask(Number(clientId), "social", "social_post_ideas", "markdown");
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

  async function refreshMetaStatus() {
    try {
      const s = await getMetaStatus(Number(clientId));
      setMetaStatus(s);
    } catch {
      // Keep UI quiet if server is unavailable.
      setMetaStatus(null);
    }
  }

  async function connectMeta() {
    try {
      setStatus(null);
      setBusy(true);
      const { authorization_url } = await getMetaConnectUrl(Number(clientId));
      await Linking.openURL(authorization_url);
      setStatus("Complete the connection in your browser, then return here and refresh.");
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to start Meta connection");
    } finally {
      setBusy(false);
    }
  }

  async function disconnectMetaAccount() {
    try {
      setStatus(null);
      setBusy(true);
      await disconnectMeta(Number(clientId));
      await refreshMetaStatus();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to disconnect Meta");
    } finally {
      setBusy(false);
    }
  }

  async function openMetaPagePicker() {
    try {
      setStatus(null);
      setBusy(true);
      const res = await listMetaPages(Number(clientId));
      setMetaPages(res.pages ?? []);
      setMetaPagesOpen(true);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to load Meta pages");
    } finally {
      setBusy(false);
    }
  }

  async function chooseMetaPage(pageId: string) {
    try {
      setStatus(null);
      setBusy(true);
      await selectMetaPage(Number(clientId), pageId);
      setMetaPagesOpen(false);
      await refreshMetaStatus();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to select page");
    } finally {
      setBusy(false);
    }
  }

  function openCampaignEditor(c: SocialCampaign) {
    setActiveCampaign(c);
    setCampaignEditName(c.name ?? "");
    setCampaignEditTheme(c.theme ?? "");
    setCampaignEditOpen(true);
  }

  function openPostEditor(p: SocialContentPost) {
    setActivePost(p);
    setPostEditPlatform(p.platform ?? "instagram");
    setPostEditStatus(p.status ?? "planned");
    setPostEditFormat((p.post_format ?? "feed") || "feed");
    setPostEditCaption(p.caption ?? "");
    setPostEditMediaUrl(p.media_url ?? "");
    setPostEditScheduledAt(p.scheduled_at ?? "");
    setPostEditOpen(true);
  }

  async function refresh() {
    try {
      setStatus(null);
      const res = await loadSocialClientData(Number(clientId));
      setEngineId(res.engineId);
      setSettings(res.settings);
      setCampaigns(res.campaigns);
      setPosts(res.posts);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to load social engine");
    }
  }

  useEffect(() => {
    if (!gate.enabled) return;
    refresh();
    refreshMetaStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, gate.enabled]);

  useEffect(() => {
    if (!settings) return;
    setPlatformsRaw((settings.platforms ?? []).join(","));
    setPostsTarget(String(settings.monthly_posts_target ?? 4));
    setNotes(settings.notes ?? "");
  }, [settings]);

  async function saveSettings() {
    if (!settings) return;
    try {
      setStatus(null);
      setBusy(true);
      const platforms = platformsRaw
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const updated = await updateSocialSettings(settings.id, {
        platforms,
        monthly_posts_target: Number(postsTarget) || 4,
        notes
      });

      setSettings(updated);
      setSettingsOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save social settings");
    } finally {
      setBusy(false);
    }
  }

  async function addCampaign() {
    if (!engineId || !canAddCampaign) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await createSocialCampaign({
        engine: engineId,
        name: campaignName.trim(),
        theme: "",
        season: "",
        start_date: null,
        end_date: null,
        notes: ""
      });
      setCampaigns((prev) => [created, ...prev]);
      setCampaignName("");
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
      const updated = await updateSocialCampaign(activeCampaign.id, {
        name: campaignEditName.trim(),
        theme: campaignEditTheme
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

  function confirmDeleteCampaign(c: SocialCampaign) {
    Alert.alert("Delete campaign?", c.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSocialCampaign(c.id);
            setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete campaign");
          }
        }
      }
    ]);
  }

  async function addPost() {
    if (!engineId || !canAddPost) return;
    try {
      setStatus(null);
      setBusy(true);
      const platformLower = String(postPlatform || "").trim().toLowerCase();
      if (enabledPlatforms.length > 0 && platformLower && !enabledPlatforms.includes(platformLower)) {
        setStatus(`Platform '${platformLower}' is not enabled in Social settings`);
        return;
      }
      const created = await createSocialPost({
        engine: engineId,
        campaign: null,
        platform: postPlatform,
        status: "planned",
        post_format: postFormat,
        caption: postCaption.trim(),
        media_url: postMediaUrl.trim(),
        scheduled_at: postScheduledAt || null,
        linked_task: null,
        linked_calendar_item: null
      });
      setPosts((prev) => [created, ...prev]);
      setPostCaption("");
      setPostMediaUrl("");
      setPostScheduledAt("");
      setPostFormat("feed");
      setPostOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add post");
    } finally {
      setBusy(false);
    }
  }

  async function savePostEdits() {
    if (!activePost || !canSavePost) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateSocialPost(activePost.id, {
        platform: postEditPlatform,
        status: postEditStatus,
        post_format: postEditFormat,
        caption: postEditCaption.trim(),
        media_url: postEditMediaUrl.trim(),
        scheduled_at: postEditScheduledAt || null
      });
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setPostEditOpen(false);
      setActivePost(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save post");
    } finally {
      setBusy(false);
    }
  }

  async function publishNow(p: SocialContentPost) {
    try {
      setStatus(null);
      setBusy(true);
      const updated = await publishSocialPost(p.id);
      setPosts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setActivePost((prev) => (prev?.id === updated.id ? updated : prev));
      setStatus("Published.");
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to publish");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeletePost(p: SocialContentPost) {
    Alert.alert("Delete post?", (p.caption ?? "").slice(0, 60) || "Post", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSocialPost(p.id);
            setPosts((prev) => prev.filter((x) => x.id !== p.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete post");
          }
        }
      }
    ]);
  }

  return gate.guard ?? (
    <Screen subtitle="Social Media Management" statusText={status}>
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
              subtitle="Social • social_post_ideas"
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
          onPressAction={refreshMetaStatus}
        />
        <View className="mt-3">
          <ListRow
            title="Meta (Facebook / Instagram)"
            subtitle={
              metaStatus?.connected
                ? `Connected${metaStatus?.page_name ? ` • ${metaStatus.page_name}` : ""}`
                : "Not connected"
            }
            right={
              <View className="flex-row gap-2">
                {metaStatus?.connected ? (
                  <Pressable onPress={disconnectMetaAccount} disabled={busy}>
                    <View className="h-9 px-3 rounded-full border border-gray-200 bg-white items-center justify-center">
                      <Text className="text-xs font-semibold">Disconnect</Text>
                    </View>
                  </Pressable>
                ) : (
                  <Pressable onPress={connectMeta} disabled={busy}>
                    <View className="h-9 px-3 rounded-full bg-black items-center justify-center">
                      <Text className="text-xs font-semibold text-white">Connect</Text>
                    </View>
                  </Pressable>
                )}
              </View>
            }
            onPress={metaStatus?.connected ? openMetaPagePicker : connectMeta}
          />

          {metaStatus?.connected ? (
            <Text className="text-xs opacity-60 mt-2">
              Tip: Tap to choose the page/IG account for posting.
            </Text>
          ) : null}
        </View>
      </Card>

      <Modal visible={metaPagesOpen} transparent animationType="slide" onRequestClose={() => setMetaPagesOpen(false)}>
        <View className="flex-1 bg-black/50 items-center justify-end">
          <View className="w-full bg-white rounded-t-2xl p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold">Select a Meta Page</Text>
              <Pressable onPress={() => setMetaPagesOpen(false)}>
                <Ionicons name="close" size={22} color="#111827" />
              </Pressable>
            </View>
            <View className="mt-3">
              {metaPages.length === 0 ? (
                <Text className="text-sm opacity-70">No pages found for this account.</Text>
              ) : (
                metaPages.slice(0, 50).map((p) => (
                  <ListRow
                    key={p.id}
                    title={p.name || "Page"}
                    subtitle={p.ig_business_account_id ? `IG: ${p.ig_business_account_id}` : ""}
                    onPress={() => chooseMetaPage(String(p.id))}
                    right={<Ionicons name="chevron-forward" size={18} color="#111827" />}
                  />
                ))
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/*
      Quick actions are intentionally disabled across the app.
      This widget created linked Task + Calendar items for common actions.

      <MarketingQuickActions
        clientId={Number(clientId)}
        defaultCalendarPlatform="social"
        defaultCalendarContentType="post"
      />
      */}

      <Card>
        <SectionHeader
          title="Social settings"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="create-outline" size={18} color="#111827" />
            </View>
          }
          onPressAction={() => setSettingsOpen(true)}
        />
        <View className="mt-3">
          <ListRow title="Platforms" subtitle={(settings?.platforms ?? []).join(", ") || "Not set"} />
          <ListRow title="Monthly posts target" subtitle={String(settings?.monthly_posts_target ?? 4)} />
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Campaigns"
          subtitle="Seasonal / sports-specific"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setCampaignOpen(true)}
        />
        <View className="mt-3">
          {campaigns.length === 0 ? (
            <Text className="text-sm opacity-70">No campaigns yet.</Text>
          ) : (
            campaigns.slice(0, 20).map((c) => (
              <ListRow
                key={c.id}
                title={c.name}
                subtitle={c.theme || "campaign"}
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
          title="Content posts"
          subtitle="3–4 posts/month"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setPostOpen(true)}
        />
        <View className="mt-3">
          {posts.length === 0 ? (
            <Text className="text-sm opacity-70">No posts yet.</Text>
          ) : (
            posts.slice(0, 20).map((p) => (
              <ListRow
                key={p.id}
                title={p.caption?.slice(0, 46) || "Post"}
                subtitle={`${p.platform || "platform"} • ${(p.post_format ?? "feed") || "feed"} • ${p.status || "status"}`}
                onPress={() => openPostEditor(p)}
                right={
                  <View className="flex-row gap-2">
                    {(String(p.platform || "").toLowerCase() === "instagram" ||
                      String(p.platform || "").toLowerCase() === "facebook") &&
                    String(p.status || "").toLowerCase() !== "posted" ? (
                      <Pressable onPress={() => publishNow(p)} disabled={busy}>
                        <View className="h-9 w-9 rounded-full bg-black items-center justify-center">
                          <Ionicons name="send" size={16} color="#FFFFFF" />
                        </View>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => openPostEditor(p)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeletePost(p)}>
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
            <ModalSurface title="Edit social settings">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Platforms (comma-separated)</Text>
                  <TextInput value={platformsRaw} onChangeText={setPlatformsRaw} placeholder="instagram,tiktok" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Monthly posts target</Text>
                  <TextInput value={postsTarget} onChangeText={setPostsTarget} placeholder="4" keyboardType="numeric" className="rounded-xl border border-gray-200 px-3 py-2" />
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
            <ModalSurface title="Add campaign">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Name</Text>
                  <TextInput value={campaignName} onChangeText={setCampaignName} placeholder="e.g. Spring launch" className="rounded-xl border border-gray-200 px-3 py-2" />
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
            <ModalSurface title="Edit campaign">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Name</Text>
                  <TextInput value={campaignEditName} onChangeText={setCampaignEditName} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Theme</Text>
                  <TextInput value={campaignEditTheme} onChangeText={setCampaignEditTheme} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
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

      <Modal visible={postOpen} transparent animationType="fade" onRequestClose={() => setPostOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setPostOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Add content post">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Platform</Text>
                  <ChipSelect
                    value={postPlatform}
                    onChange={setPostPlatform}
                    options={[
                      { label: "Instagram", value: "instagram" },
                      { label: "TikTok", value: "tiktok" },
                      { label: "Facebook", value: "facebook" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={postPlatform} onChangeText={setPostPlatform} placeholder="instagram" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Format</Text>
                  <ChipSelect value={postFormat} onChange={setPostFormat} options={formatOptionsForPlatform} />
                  <View className="mt-2" />
                  <TextInput value={postFormat} onChangeText={setPostFormat} placeholder="feed" className="rounded-xl border border-gray-200 px-3 py-2" />
                  <Text className="text-xs opacity-60 mt-2">Publishing: Instagram feed/reel/story; Facebook feed.</Text>
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Caption</Text>
                  <TextInput value={postCaption} onChangeText={setPostCaption} placeholder="Write the caption..." multiline className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Media URL (required for Instagram)</Text>
                  <TextInput
                    value={postMediaUrl}
                    onChangeText={setPostMediaUrl}
                    placeholder="https://..."
                    autoCapitalize="none"
                    className="rounded-xl border border-gray-200 px-3 py-2"
                  />
                </View>

                <View className="mt-3">
                  <DateTimeField
                    label="Scheduled at"
                    mode="datetime"
                    value={postScheduledAt}
                    onChange={setPostScheduledAt}
                    placeholder="Pick date & time"
                  />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setPostOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable onPress={addPost} disabled={!canAddPost || busy} className={!canAddPost || busy ? "opacity-50" : ""}>
                    <Badge label={busy ? "Creating..." : "Create"} />
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={postEditOpen} transparent animationType="fade" onRequestClose={() => setPostEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setPostEditOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Edit post">
              <View className="p-4">
                <View>
                  <Text className="text-xs opacity-70 mb-1">Platform</Text>
                  <ChipSelect
                    value={postEditPlatform}
                    onChange={setPostEditPlatform}
                    options={[
                      { label: "Instagram", value: "instagram" },
                      { label: "TikTok", value: "tiktok" },
                      { label: "Facebook", value: "facebook" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={postEditPlatform} onChangeText={setPostEditPlatform} placeholder="instagram" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Format</Text>
                  <ChipSelect value={postEditFormat} onChange={setPostEditFormat} options={editFormatOptionsForPlatform} />
                  <View className="mt-2" />
                  <TextInput value={postEditFormat} onChangeText={setPostEditFormat} placeholder="feed" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Status</Text>
                  <ChipSelect
                    value={postEditStatus}
                    onChange={setPostEditStatus}
                    options={[
                      { label: "Planned", value: "planned" },
                      { label: "Scheduled", value: "scheduled" },
                      { label: "Posted", value: "posted" }
                    ]}
                  />
                  <View className="mt-2" />
                  <TextInput value={postEditStatus} onChangeText={setPostEditStatus} placeholder="planned" className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Caption</Text>
                  <TextInput value={postEditCaption} onChangeText={setPostEditCaption} placeholder="Write the caption..." multiline className="rounded-xl border border-gray-200 px-3 py-2" />
                </View>

                <View className="mt-3">
                  <Text className="text-xs opacity-70 mb-1">Media URL</Text>
                  <TextInput
                    value={postEditMediaUrl}
                    onChangeText={setPostEditMediaUrl}
                    placeholder="https://..."
                    autoCapitalize="none"
                    className="rounded-xl border border-gray-200 px-3 py-2"
                  />
                  {activePost?.last_publish_error ? (
                    <Text className="text-xs text-red-700 mt-2">Last publish error: {activePost.last_publish_error}</Text>
                  ) : null}
                </View>

                <View className="mt-3">
                  <DateTimeField
                    label="Scheduled at"
                    mode="datetime"
                    value={postEditScheduledAt}
                    onChange={setPostEditScheduledAt}
                    placeholder="Pick date & time"
                  />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setPostEditOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  {(String(activePost?.platform || "").toLowerCase() === "instagram" ||
                    String(activePost?.platform || "").toLowerCase() === "facebook") &&
                  String(activePost?.status || "").toLowerCase() !== "posted" ? (
                    <Pressable
                      onPress={() => (activePost ? publishNow(activePost) : undefined)}
                      disabled={busy}
                      className={busy ? "opacity-50" : ""}
                    >
                      <Badge label={busy ? "Publishing..." : "Publish now"} />
                    </Pressable>
                  ) : null}
                  <Pressable onPress={savePostEdits} disabled={!canSavePost || busy} className={!canSavePost || busy ? "opacity-50" : ""}>
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
// Added an "Ask Copilot" button + modal that calls runMarketingTask() for Social tasks.
