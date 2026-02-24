import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "../../App";
import { Badge, Card, ChipSelect, ListRow, Screen, SectionHeader } from "../components/ui";
import { useAdminGate } from "../components/useAdminGate";
import {
  createEmailAudienceMembership,
  createEmailAudience,
  createEmailCampaign,
  createEmailContact,
  createEmailTemplate,
  deleteEmailAudienceMembership,
  deleteEmailAudience,
  deleteEmailCampaign,
  deleteEmailContact,
  deleteEmailTemplate,
  ensureEmailProviderSettings,
  listEmailAudiences,
  listEmailAudienceMemberships,
  listEmailCampaigns,
  listEmailContacts,
  listEmailTemplates,
  sendEmailCampaignNow,
  updateEmailAudience,
  updateEmailAudienceMembership,
  updateEmailCampaign,
  updateEmailContact,
  updateEmailProviderSettings,
  updateEmailTemplate,
  type EmailAudienceMembership,
  type EmailAudience,
  type EmailCampaign,
  type EmailContact,
  type EmailProviderSettings,
  type EmailTemplate
} from "../services/emailMarketingService";

export default function ClientEmailMarketingScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ClientEmailMarketing">>();
  const { clientId } = route.params;
  const clientIdNum = Number(clientId);

  const gate = useAdminGate("Email Marketing");

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [providerSettings, setProviderSettings] = useState<EmailProviderSettings | null>(null);
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [audiences, setAudiences] = useState<EmailAudience[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);

  const templateOptions = useMemo(
    () => templates.map((t) => ({ label: t.name, value: String(t.id) })),
    [templates]
  );
  const audienceOptions = useMemo(
    () => audiences.map((a) => ({ label: a.name, value: String(a.id) })),
    [audiences]
  );
  const contactOptions = useMemo(
    () => contacts.map((c) => ({ label: c.email, value: String(c.id) })),
    [contacts]
  );

  async function refresh() {
    try {
      setStatus(null);
      const [settings, cts, aud, tpl, camp] = await Promise.all([
        ensureEmailProviderSettings(clientIdNum),
        listEmailContacts(clientIdNum),
        listEmailAudiences(clientIdNum),
        listEmailTemplates(clientIdNum),
        listEmailCampaigns(clientIdNum)
      ]);
      setProviderSettings(settings);
      setContacts(cts);
      setAudiences(aud);
      setTemplates(tpl);
      setCampaigns(camp);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to load Email Marketing");
    }
  }

  useEffect(() => {
    if (!gate.enabled) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, gate.enabled]);

  // ----- Provider settings modal -----
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [provider, setProvider] = useState("smtp");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [publicBaseUrl, setPublicBaseUrl] = useState("http://localhost");

  useEffect(() => {
    if (!providerSettings) return;
    setProvider(providerSettings.provider || "smtp");
    setFromEmail(providerSettings.from_email || "");
    setFromName(providerSettings.from_name || "");
    setReplyTo(providerSettings.reply_to || "");
    setPhysicalAddress(providerSettings.physical_address || "");
    setPublicBaseUrl(providerSettings.public_base_url || "http://localhost");
  }, [providerSettings]);

  async function saveProviderSettings() {
    if (!providerSettings) return;
    try {
      setBusy(true);
      setStatus(null);
      const updated = await updateEmailProviderSettings(providerSettings.id, clientIdNum, {
        provider,
        from_email: fromEmail,
        from_name: fromName,
        reply_to: replyTo,
        physical_address: physicalAddress,
        public_base_url: publicBaseUrl
      });
      setProviderSettings(updated);
      setSettingsOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save provider settings");
    } finally {
      setBusy(false);
    }
  }

  // ----- Contact modals -----
  const [contactOpen, setContactOpen] = useState(false);
  const [contactEditOpen, setContactEditOpen] = useState(false);
  const [activeContact, setActiveContact] = useState<EmailContact | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");

  const canAddContact = useMemo(() => contactEmail.trim().length > 3, [contactEmail]);
  const canSaveContact = useMemo(() => (activeContact ? contactEmail.trim().length > 3 : false), [activeContact, contactEmail]);

  function openContactEditor(c: EmailContact) {
    setActiveContact(c);
    setContactEmail(c.email || "");
    setContactFirst(c.first_name || "");
    setContactLast(c.last_name || "");
    setContactEditOpen(true);
  }

  async function addContact() {
    if (!canAddContact) return;
    try {
      setBusy(true);
      setStatus(null);
      const created = await createEmailContact({
        client: clientIdNum,
        email: contactEmail.trim(),
        first_name: contactFirst.trim(),
        last_name: contactLast.trim(),
        phone: "",
        company: "",
        custom_fields: {},
        is_suppressed: false,
        suppressed_reason: ""
      });
      setContacts((prev) => [created, ...prev]);
      setContactEmail("");
      setContactFirst("");
      setContactLast("");
      setContactOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add contact");
    } finally {
      setBusy(false);
    }
  }

  async function saveContactEdits() {
    if (!activeContact || !canSaveContact) return;
    try {
      setBusy(true);
      setStatus(null);
      const updated = await updateEmailContact(activeContact.id, clientIdNum, {
        email: contactEmail.trim(),
        first_name: contactFirst.trim(),
        last_name: contactLast.trim()
      });
      setContacts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setActiveContact(null);
      setContactEditOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save contact");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteContact(c: EmailContact) {
    Alert.alert("Delete contact?", c.email, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEmailContact(c.id, clientIdNum);
            setContacts((prev) => prev.filter((x) => x.id !== c.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete contact");
          }
        }
      }
    ]);
  }

  // ----- Audience modals -----
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [audienceEditOpen, setAudienceEditOpen] = useState(false);
  const [activeAudience, setActiveAudience] = useState<EmailAudience | null>(null);
  const [audienceName, setAudienceName] = useState("");
  const [audienceDesc, setAudienceDesc] = useState("");
  const [audienceMembers, setAudienceMembers] = useState<EmailAudienceMembership[]>([]);
  const [memberContactId, setMemberContactId] = useState<string>("");

  const canAddAudience = useMemo(() => audienceName.trim().length > 0, [audienceName]);
  const canSaveAudience = useMemo(() => (activeAudience ? audienceName.trim().length > 0 : false), [activeAudience, audienceName]);

  async function openAudienceEditor(a: EmailAudience) {
    setActiveAudience(a);
    setAudienceName(a.name || "");
    setAudienceDesc(a.description || "");
    setMemberContactId("");
    try {
      const memberships = await listEmailAudienceMemberships(clientIdNum, a.id);
      setAudienceMembers(memberships);
    } catch {
      setAudienceMembers([]);
    }
    setAudienceEditOpen(true);
  }

  async function refreshAudienceMembers() {
    if (!activeAudience) return;
    const memberships = await listEmailAudienceMemberships(clientIdNum, activeAudience.id);
    setAudienceMembers(memberships);
  }

  async function addAudienceMember() {
    if (!activeAudience || !memberContactId) return;
    try {
      setBusy(true);
      setStatus(null);
      await createEmailAudienceMembership({
        client: clientIdNum,
        audience: activeAudience.id,
        contact: Number(memberContactId),
        status: "subscribed"
      });
      await refreshAudienceMembers();
      await refresh();
      setMemberContactId("");
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add member");
    } finally {
      setBusy(false);
    }
  }

  async function toggleMemberStatus(m: EmailAudienceMembership) {
    try {
      setBusy(true);
      const nextStatus = m.status === "subscribed" ? "unsubscribed" : "subscribed";
      await updateEmailAudienceMembership(m.id, clientIdNum, { status: nextStatus });
      await refreshAudienceMembers();
      await refresh();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to update member");
    } finally {
      setBusy(false);
    }
  }

  async function removeAudienceMember(m: EmailAudienceMembership) {
    try {
      setBusy(true);
      await deleteEmailAudienceMembership(m.id, clientIdNum);
      await refreshAudienceMembers();
      await refresh();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to remove member");
    } finally {
      setBusy(false);
    }
  }

  async function addAudience() {
    if (!canAddAudience) return;
    try {
      setBusy(true);
      setStatus(null);
      const created = await createEmailAudience({
        client: clientIdNum,
        name: audienceName.trim(),
        description: audienceDesc
      });
      setAudiences((prev) => [created, ...prev]);
      setAudienceName("");
      setAudienceDesc("");
      setAudienceOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add audience");
    } finally {
      setBusy(false);
    }
  }

  async function saveAudienceEdits() {
    if (!activeAudience || !canSaveAudience) return;
    try {
      setBusy(true);
      setStatus(null);
      const updated = await updateEmailAudience(activeAudience.id, clientIdNum, {
        name: audienceName.trim(),
        description: audienceDesc
      });
      setAudiences((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setActiveAudience(null);
      setAudienceEditOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save audience");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteAudience(a: EmailAudience) {
    Alert.alert("Delete audience?", a.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEmailAudience(a.id, clientIdNum);
            setAudiences((prev) => prev.filter((x) => x.id !== a.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete audience");
          }
        }
      }
    ]);
  }

  // ----- Template modals -----
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateEditOpen, setTemplateEditOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateHtml, setTemplateHtml] = useState("<h1>Hello</h1><p>Welcome to SparQPlug.</p>");

  const canAddTemplate = useMemo(() => templateName.trim().length > 0, [templateName]);
  const canSaveTemplate = useMemo(() => (activeTemplate ? templateName.trim().length > 0 : false), [activeTemplate, templateName]);

  function openTemplateEditor(t: EmailTemplate) {
    setActiveTemplate(t);
    setTemplateName(t.name || "");
    setTemplateSubject(t.subject || "");
    setTemplateHtml(t.html || "");
    setTemplateEditOpen(true);
  }

  async function addTemplate() {
    if (!canAddTemplate) return;
    try {
      setBusy(true);
      setStatus(null);
      const created = await createEmailTemplate({
        client: clientIdNum,
        name: templateName.trim(),
        subject: templateSubject,
        preheader: "",
        html: templateHtml,
        text: ""
      });
      setTemplates((prev) => [created, ...prev]);
      setTemplateName("");
      setTemplateSubject("");
      setTemplateHtml("<h1>Hello</h1><p>Welcome to SparQPlug.</p>");
      setTemplateOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add template");
    } finally {
      setBusy(false);
    }
  }

  async function saveTemplateEdits() {
    if (!activeTemplate || !canSaveTemplate) return;
    try {
      setBusy(true);
      setStatus(null);
      const updated = await updateEmailTemplate(activeTemplate.id, clientIdNum, {
        name: templateName.trim(),
        subject: templateSubject,
        html: templateHtml
      });
      setTemplates((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setActiveTemplate(null);
      setTemplateEditOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save template");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteTemplate(t: EmailTemplate) {
    Alert.alert("Delete template?", t.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEmailTemplate(t.id, clientIdNum);
            setTemplates((prev) => prev.filter((x) => x.id !== t.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete template");
          }
        }
      }
    ]);
  }

  // ----- Campaign modals -----
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignEditOpen, setCampaignEditOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<EmailCampaign | null>(null);

  const [campaignName, setCampaignName] = useState("");
  const [campaignTemplateId, setCampaignTemplateId] = useState<string>("");
  const [campaignAudienceId, setCampaignAudienceId] = useState<string>("");
  const [campaignSubjectOverride, setCampaignSubjectOverride] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("draft");

  const canAddCampaign = useMemo(() => campaignName.trim().length > 0, [campaignName]);
  const canSaveCampaign = useMemo(() => (activeCampaign ? campaignName.trim().length > 0 : false), [activeCampaign, campaignName]);

  function openCampaignEditor(c: EmailCampaign) {
    setActiveCampaign(c);
    setCampaignName(c.name || "");
    setCampaignTemplateId(c.template ? String(c.template) : "");
    setCampaignAudienceId(c.audience ? String(c.audience) : "");
    setCampaignSubjectOverride(c.subject_override || "");
    setCampaignStatus(c.status || "draft");
    setCampaignEditOpen(true);
  }

  async function addCampaign() {
    if (!canAddCampaign) return;
    try {
      setBusy(true);
      setStatus(null);
      const created = await createEmailCampaign({
        client: clientIdNum,
        name: campaignName.trim(),
        status: "draft",
        template: campaignTemplateId ? Number(campaignTemplateId) : null,
        audience: campaignAudienceId ? Number(campaignAudienceId) : null,
        segment: null,
        subject_override: campaignSubjectOverride,
        send_at: null,
        sent_at: null
      });
      setCampaigns((prev) => [created, ...prev]);
      setCampaignName("");
      setCampaignTemplateId("");
      setCampaignAudienceId("");
      setCampaignSubjectOverride("");
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
      setBusy(true);
      setStatus(null);
      const updated = await updateEmailCampaign(activeCampaign.id, clientIdNum, {
        name: campaignName.trim(),
        template: campaignTemplateId ? Number(campaignTemplateId) : null,
        audience: campaignAudienceId ? Number(campaignAudienceId) : null,
        subject_override: campaignSubjectOverride,
        status: campaignStatus
      });
      setCampaigns((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setActiveCampaign(null);
      setCampaignEditOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save campaign");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteCampaign(c: EmailCampaign) {
    Alert.alert("Delete campaign?", c.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEmailCampaign(c.id, clientIdNum);
            setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete campaign");
          }
        }
      }
    ]);
  }

  async function sendNow(c: EmailCampaign) {
    try {
      setBusy(true);
      setStatus(null);
      await sendEmailCampaignNow(c.id, clientIdNum);
      setStatus("Queued send. Make sure the Celery worker is running.");
      refresh();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to queue send");
    } finally {
      setBusy(false);
    }
  }

  return gate.guard ?? (
    <Screen subtitle="Email Marketing" statusText={status}>
      <Card>
        <SectionHeader
          title="Provider & Compliance"
          subtitle="From address, footer, tracking base URL"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="create-outline" size={18} color="#111827" />
            </View>
          }
          onPressAction={() => setSettingsOpen(true)}
        />
        <View className="mt-3">
          <ListRow title="Provider" subtitle={providerSettings?.provider || "smtp"} />
          <ListRow title="From" subtitle={providerSettings?.from_email || "Not set"} />
          <ListRow title="Public base URL" subtitle={providerSettings?.public_base_url || "Not set"} />
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Contacts"
          subtitle="People you can email"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setContactOpen(true)}
        />
        <View className="mt-3">
          {contacts.length === 0 ? (
            <Text className="text-sm opacity-70">No contacts yet.</Text>
          ) : (
            contacts.slice(0, 25).map((c) => (
              <ListRow
                key={c.id}
                title={c.email}
                subtitle={`${c.first_name || ""} ${c.last_name || ""}`.trim() || "contact"}
                onPress={() => openContactEditor(c)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => openContactEditor(c)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeleteContact(c)}>
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
          title="Audiences"
          subtitle="Lists (who to send to)"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setAudienceOpen(true)}
        />
        <View className="mt-3">
          {audiences.length === 0 ? (
            <Text className="text-sm opacity-70">No audiences yet.</Text>
          ) : (
            audiences.slice(0, 20).map((a) => (
              <ListRow
                key={a.id}
                title={a.name}
                subtitle={`${a.member_count ?? 0} members`}
                onPress={() => openAudienceEditor(a)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => openAudienceEditor(a)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeleteAudience(a)}>
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
          title="Templates"
          subtitle="Email content"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={() => setTemplateOpen(true)}
        />
        <View className="mt-3">
          {templates.length === 0 ? (
            <Text className="text-sm opacity-70">No templates yet.</Text>
          ) : (
            templates.slice(0, 20).map((t) => (
              <ListRow
                key={t.id}
                title={t.name}
                subtitle={t.subject || "(no subject)"}
                onPress={() => openTemplateEditor(t)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => openTemplateEditor(t)}>
                      <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                        <Ionicons name="create-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
                    <Pressable onPress={() => confirmDeleteTemplate(t)}>
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
          title="Campaigns"
          subtitle="Send to an audience"
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
                subtitle={`${c.status} • queued ${c.stats?.queued ?? 0} • sent ${c.stats?.sent ?? 0}`}
                onPress={() => openCampaignEditor(c)}
                right={
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => sendNow(c)} disabled={busy}>
                      <View className={`h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center ${busy ? "opacity-50" : ""}`}>
                        <Ionicons name="paper-plane-outline" size={18} color="#111827" />
                      </View>
                    </Pressable>
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

      {/* Provider settings modal */}
      <Modal visible={settingsOpen} transparent animationType="fade" onRequestClose={() => setSettingsOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setSettingsOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit provider & compliance</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Provider</Text>
              <ChipSelect
                value={provider}
                onChange={setProvider}
                options={[
                  { label: "SMTP", value: "smtp" },
                  { label: "SendGrid", value: "sendgrid" },
                  { label: "Mailgun", value: "mailgun" }
                ]}
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">From email</Text>
              <TextInput value={fromEmail} onChangeText={setFromEmail} placeholder="noreply@yourdomain.com" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">From name</Text>
              <TextInput value={fromName} onChangeText={setFromName} placeholder="Your Company" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Reply-to</Text>
              <TextInput value={replyTo} onChangeText={setReplyTo} placeholder="support@yourdomain.com" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Physical address</Text>
              <TextInput value={physicalAddress} onChangeText={setPhysicalAddress} placeholder="123 Main St, City, ST" multiline className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Public base URL</Text>
              <TextInput value={publicBaseUrl} onChangeText={setPublicBaseUrl} placeholder="http://localhost" className="rounded-xl border border-gray-200 px-3 py-2" />
              <Text className="text-xs opacity-60 mt-1">Used for unsubscribe + tracking links.</Text>
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setSettingsOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={saveProviderSettings} disabled={busy} className={busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Saving..." : "Save"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Contact add */}
      <Modal visible={contactOpen} transparent animationType="fade" onRequestClose={() => setContactOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setContactOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Add contact</Text>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Email</Text>
              <TextInput value={contactEmail} onChangeText={setContactEmail} placeholder="name@domain.com" autoCapitalize="none" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">First name</Text>
              <TextInput value={contactFirst} onChangeText={setContactFirst} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Last name</Text>
              <TextInput value={contactLast} onChangeText={setContactLast} placeholder="" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>
            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setContactOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={addContact} disabled={!canAddContact || busy} className={!canAddContact || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Creating..." : "Create"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Contact edit */}
      <Modal visible={contactEditOpen} transparent animationType="fade" onRequestClose={() => setContactEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setContactEditOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit contact</Text>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Email</Text>
              <TextInput value={contactEmail} onChangeText={setContactEmail} autoCapitalize="none" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">First name</Text>
              <TextInput value={contactFirst} onChangeText={setContactFirst} className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Last name</Text>
              <TextInput value={contactLast} onChangeText={setContactLast} className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>
            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setContactEditOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={saveContactEdits} disabled={!canSaveContact || busy} className={!canSaveContact || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Saving..." : "Save"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Audience add/edit */}
      <Modal visible={audienceOpen} transparent animationType="fade" onRequestClose={() => setAudienceOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setAudienceOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Add audience</Text>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Name</Text>
              <TextInput value={audienceName} onChangeText={setAudienceName} className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Description</Text>
              <TextInput value={audienceDesc} onChangeText={setAudienceDesc} multiline className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>
            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setAudienceOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={addAudience} disabled={!canAddAudience || busy} className={!canAddAudience || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Creating..." : "Create"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={audienceEditOpen} transparent animationType="fade" onRequestClose={() => setAudienceEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setAudienceEditOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit audience</Text>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Name</Text>
              <TextInput value={audienceName} onChangeText={setAudienceName} className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Description</Text>
              <TextInput value={audienceDesc} onChangeText={setAudienceDesc} multiline className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold">Members</Text>
              <View className="mt-2">
                <Text className="text-xs opacity-70 mb-1">Add contact</Text>
                <ChipSelect
                  value={memberContactId}
                  onChange={setMemberContactId}
                  options={[{ label: "Select contact", value: "" }, ...contactOptions]}
                />
                <View className="flex-row justify-end mt-2">
                  <Pressable onPress={addAudienceMember} disabled={!memberContactId || busy} className={!memberContactId || busy ? "opacity-50" : ""}>
                    <Badge label={busy ? "Adding..." : "Add"} />
                  </Pressable>
                </View>
              </View>

              <View className="mt-3 rounded-xl border border-gray-100 overflow-hidden">
                {audienceMembers.length === 0 ? (
                  <View className="px-3 py-3">
                    <Text className="text-sm opacity-70">No members yet.</Text>
                  </View>
                ) : (
                  audienceMembers.slice(0, 40).map((m) => {
                    const email = contacts.find((c) => c.id === m.contact)?.email ?? `Contact #${m.contact}`;
                    return (
                      <ListRow
                        key={m.id}
                        title={email}
                        subtitle={m.status}
                        onPress={() => toggleMemberStatus(m)}
                        right={
                          <Pressable onPress={() => removeAudienceMember(m)}>
                            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                              <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                            </View>
                          </Pressable>
                        }
                      />
                    );
                  })
                )}
              </View>
              <Text className="text-xs opacity-60 mt-2">Tap a member to toggle subscribed/unsubscribed.</Text>
            </View>
            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setAudienceEditOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={saveAudienceEdits} disabled={!canSaveAudience || busy} className={!canSaveAudience || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Saving..." : "Save"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Template add/edit */}
      <Modal visible={templateOpen} transparent animationType="fade" onRequestClose={() => setTemplateOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setTemplateOpen(false)}>
          <View className="flex-1 justify-center py-10">
            <Pressable className="bg-white rounded-2xl border border-gray-200 p-4 mx-0" onPress={() => {}}>
              <Text className="text-base font-semibold">Add template</Text>
              <View className="mt-3">
                <Text className="text-xs opacity-70 mb-1">Name</Text>
                <TextInput value={templateName} onChangeText={setTemplateName} className="rounded-xl border border-gray-200 px-3 py-2" />
              </View>
              <View className="mt-3">
                <Text className="text-xs opacity-70 mb-1">Subject</Text>
                <TextInput value={templateSubject} onChangeText={setTemplateSubject} className="rounded-xl border border-gray-200 px-3 py-2" />
              </View>
              <View className="mt-3">
                <Text className="text-xs opacity-70 mb-1">HTML</Text>
                <ScrollView style={{ maxHeight: 220 }} className="rounded-xl border border-gray-200">
                  <TextInput
                    value={templateHtml}
                    onChangeText={setTemplateHtml}
                    multiline
                    autoCapitalize="none"
                    className="px-3 py-2"
                  />
                </ScrollView>
              </View>
              <View className="flex-row justify-end gap-2 mt-4">
                <Pressable onPress={() => setTemplateOpen(false)}>
                  <Badge label="Cancel" />
                </Pressable>
                <Pressable onPress={addTemplate} disabled={!canAddTemplate || busy} className={!canAddTemplate || busy ? "opacity-50" : ""}>
                  <Badge label={busy ? "Creating..." : "Create"} />
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={templateEditOpen} transparent animationType="fade" onRequestClose={() => setTemplateEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setTemplateEditOpen(false)}>
          <View className="flex-1 justify-center py-10">
            <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
              <Text className="text-base font-semibold">Edit template</Text>
              <View className="mt-3">
                <Text className="text-xs opacity-70 mb-1">Name</Text>
                <TextInput value={templateName} onChangeText={setTemplateName} className="rounded-xl border border-gray-200 px-3 py-2" />
              </View>
              <View className="mt-3">
                <Text className="text-xs opacity-70 mb-1">Subject</Text>
                <TextInput value={templateSubject} onChangeText={setTemplateSubject} className="rounded-xl border border-gray-200 px-3 py-2" />
              </View>
              <View className="mt-3">
                <Text className="text-xs opacity-70 mb-1">HTML</Text>
                <ScrollView style={{ maxHeight: 220 }} className="rounded-xl border border-gray-200">
                  <TextInput value={templateHtml} onChangeText={setTemplateHtml} multiline autoCapitalize="none" className="px-3 py-2" />
                </ScrollView>
              </View>
              <View className="flex-row justify-end gap-2 mt-4">
                <Pressable onPress={() => setTemplateEditOpen(false)}>
                  <Badge label="Cancel" />
                </Pressable>
                <Pressable onPress={saveTemplateEdits} disabled={!canSaveTemplate || busy} className={!canSaveTemplate || busy ? "opacity-50" : ""}>
                  <Badge label={busy ? "Saving..." : "Save"} />
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Campaign add/edit */}
      <Modal visible={campaignOpen} transparent animationType="fade" onRequestClose={() => setCampaignOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setCampaignOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Add campaign</Text>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Name</Text>
              <TextInput value={campaignName} onChangeText={setCampaignName} className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Template</Text>
              <ChipSelect value={campaignTemplateId} onChange={setCampaignTemplateId} options={[{ label: "(none)", value: "" }, ...templateOptions]} />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Audience</Text>
              <ChipSelect value={campaignAudienceId} onChange={setCampaignAudienceId} options={[{ label: "(none)", value: "" }, ...audienceOptions]} />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Subject override</Text>
              <TextInput value={campaignSubjectOverride} onChangeText={setCampaignSubjectOverride} className="rounded-xl border border-gray-200 px-3 py-2" />
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
            <Text className="text-base font-semibold">Edit campaign</Text>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Name</Text>
              <TextInput value={campaignName} onChangeText={setCampaignName} className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Status</Text>
              <ChipSelect
                value={campaignStatus}
                onChange={setCampaignStatus}
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Scheduled", value: "scheduled" },
                  { label: "Sending", value: "sending" },
                  { label: "Sent", value: "sent" },
                  { label: "Paused", value: "paused" }
                ]}
              />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Template</Text>
              <ChipSelect value={campaignTemplateId} onChange={setCampaignTemplateId} options={[{ label: "(none)", value: "" }, ...templateOptions]} />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Audience</Text>
              <ChipSelect value={campaignAudienceId} onChange={setCampaignAudienceId} options={[{ label: "(none)", value: "" }, ...audienceOptions]} />
            </View>
            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Subject override</Text>
              <TextInput value={campaignSubjectOverride} onChangeText={setCampaignSubjectOverride} className="rounded-xl border border-gray-200 px-3 py-2" />
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
    </Screen>
  );
}
