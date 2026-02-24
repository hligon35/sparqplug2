import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "../../App";
// import MarketingQuickActions from "../components/marketing/MarketingQuickActions";
import { Badge, Card, ChipSelect, DateTimeField, ListRow, ModalSurface, Screen, SectionHeader } from "../components/ui";
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
import {
  createEmailCampaign as createLegacyEmailCampaign,
  createEmailFlow,
  deleteEmailCampaign as deleteLegacyEmailCampaign,
  deleteEmailFlow,
  loadRetentionClientData,
  updateEmailCampaign as updateLegacyEmailCampaign,
  updateEmailFlow,
  updateRetentionSettings,
  type EmailCampaign as LegacyEmailCampaign,
  type EmailFlow,
  type RetentionSettings
} from "../services/marketingRetentionService";
import { runMarketingTask } from "../services/aiService";
import { useAdminGate } from "../components/useAdminGate";

export default function ClientEmailEngineScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ClientEmailEngine">>();
  const { clientId } = route.params;
  const clientIdNum = Number(clientId);

  const gate = useAdminGate("Email Engine");

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string>("");

  // ---- v2 email marketing ----
  const [providerSettings, setProviderSettings] = useState<EmailProviderSettings | null>(null);
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [audiences, setAudiences] = useState<EmailAudience[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);

  // Dashboard managers (replaces separate on-page sections)
  const [contactsManagerOpen, setContactsManagerOpen] = useState(false);
  const [audiencesManagerOpen, setAudiencesManagerOpen] = useState(false);
  const [templatesManagerOpen, setTemplatesManagerOpen] = useState(false);
  const [campaignsManagerOpen, setCampaignsManagerOpen] = useState(false);
  const [legacyManagerOpen, setLegacyManagerOpen] = useState(false);

  // ---- legacy retention planner ----
  const [engineId, setEngineId] = useState<number | null>(null);
  const [retentionSettings, setRetentionSettings] = useState<RetentionSettings | null>(null);
  const [legacyCampaigns, setLegacyCampaigns] = useState<LegacyEmailCampaign[]>([]);
  const [flows, setFlows] = useState<EmailFlow[]>([]);

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

  const quick = useMemo(() => {
    const haveProvider = !!providerSettings?.from_email;
    const haveContacts = contacts.length > 0;
    const haveAudience = audiences.length > 0;
    const haveMembers = audiences.some((a) => (a.member_count ?? 0) > 0);
    const haveTemplate = templates.length > 0;
    const haveCampaign = campaigns.length > 0;
    return {
      haveProvider,
      haveContacts,
      haveAudience,
      haveMembers,
      haveTemplate,
      haveCampaign
    };
  }, [providerSettings, contacts, audiences, templates, campaigns]);

  const progress = useMemo(() => {
    const steps = [
      quick.haveProvider,
      quick.haveContacts,
      quick.haveAudience,
      quick.haveMembers,
      quick.haveTemplate,
      quick.haveCampaign
    ];
    const doneCount = steps.filter(Boolean).length;

    type NextStep = { label: string; onPress: () => void };
    let next: NextStep | null = null;
    if (!quick.haveProvider) next = { label: "Configure sender", onPress: () => setProviderOpen(true) };
    else if (!quick.haveContacts) next = { label: "Add contacts", onPress: () => setContactsManagerOpen(true) };
    else if (!quick.haveAudience) next = { label: "Create audience", onPress: () => setAudiencesManagerOpen(true) };
    else if (!quick.haveMembers) next = { label: "Add members", onPress: () => setAudiencesManagerOpen(true) };
    else if (!quick.haveTemplate) next = { label: "Create template", onPress: () => setTemplatesManagerOpen(true) };
    else if (!quick.haveCampaign) next = { label: "Create campaign", onPress: () => setCampaignsManagerOpen(true) };
    else next = { label: "Review + send", onPress: () => setCampaignsManagerOpen(true) };

    return { doneCount, total: steps.length, next };
  }, [
    quick.haveProvider,
    quick.haveContacts,
    quick.haveAudience,
    quick.haveMembers,
    quick.haveTemplate,
    quick.haveCampaign
  ]);

  function wizardLock(title: string, message: string, goTo: () => void) {
    Alert.alert(title, message, [
      { text: "Not now", style: "cancel" },
      { text: "Take me there", onPress: goTo }
    ]);
  }

  const wizard = useMemo(() => {
    const canManageMembers = contacts.length > 0 && audiences.length > 0;
    const canLaunchCampaign = quick.haveProvider && quick.haveTemplate && quick.haveAudience && quick.haveMembers;

    const membersLockMessage =
      !contacts.length
        ? "Add at least one contact first. Then you can add that contact into an audience."
        : !audiences.length
          ? "Create an audience first. Then you can add contacts into it."
          : "Open an audience and add contacts as members.";

    const campaignMissing: string[] = [];
    if (!quick.haveProvider) campaignMissing.push("configure sender");
    if (!quick.haveAudience) campaignMissing.push("create an audience");
    if (!quick.haveMembers) campaignMissing.push("add audience members");
    if (!quick.haveTemplate) campaignMissing.push("create a template");
    const campaignLockMessage =
      campaignMissing.length === 0
        ? ""
        : `Before launching a campaign, you need to ${campaignMissing.join(", ")}.`;

    return {
      canManageMembers,
      canLaunchCampaign,
      membersLockMessage,
      campaignLockMessage
    };
  }, [audiences.length, contacts.length, quick.haveAudience, quick.haveMembers, quick.haveProvider, quick.haveTemplate]);

  async function askCopilot() {
    setAiOpen(true);
    setAiBusy(true);
    setAiError(null);
    setAiText("");

    const res = await runMarketingTask(clientIdNum, "email", "email_campaign_ideas", "markdown");
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

  async function refreshAll() {
    try {
      setStatus(null);
      const [settings, cts, aud, tpl, camp, retention] = await Promise.all([
        ensureEmailProviderSettings(clientIdNum),
        listEmailContacts(clientIdNum),
        listEmailAudiences(clientIdNum),
        listEmailTemplates(clientIdNum),
        listEmailCampaigns(clientIdNum),
        loadRetentionClientData(clientIdNum)
      ]);
      setProviderSettings(settings);
      setContacts(cts);
      setAudiences(aud);
      setTemplates(tpl);
      setCampaigns(camp);

      setEngineId(retention.engineId);
      setRetentionSettings(retention.settings);
      setLegacyCampaigns(retention.campaigns);
      setFlows(retention.flows);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to load email engine");
    }
  }

  useEffect(() => {
    if (!gate.enabled) return;
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, gate.enabled]);

  // -------------------- V2: Provider settings modal --------------------
  const [providerOpen, setProviderOpen] = useState(false);
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
      setProviderOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save provider settings");
    } finally {
      setBusy(false);
    }
  }

  // -------------------- V2: Contacts --------------------
  const [contactOpen, setContactOpen] = useState(false);
  const [contactEditOpen, setContactEditOpen] = useState(false);
  const [activeContact, setActiveContact] = useState<EmailContact | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");

  const canAddContact = useMemo(() => contactEmail.trim().length > 3, [contactEmail]);
  const canSaveContact = useMemo(
    () => (activeContact ? contactEmail.trim().length > 3 : false),
    [activeContact, contactEmail]
  );

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

  // -------------------- V2: Audiences --------------------
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [audienceEditOpen, setAudienceEditOpen] = useState(false);
  const [activeAudience, setActiveAudience] = useState<EmailAudience | null>(null);
  const [audienceName, setAudienceName] = useState("");
  const [audienceDesc, setAudienceDesc] = useState("");
  const [audienceMembers, setAudienceMembers] = useState<EmailAudienceMembership[]>([]);
  const [memberContactId, setMemberContactId] = useState<string>("");

  const canAddAudience = useMemo(() => audienceName.trim().length > 0, [audienceName]);
  const canSaveAudience = useMemo(
    () => (activeAudience ? audienceName.trim().length > 0 : false),
    [activeAudience, audienceName]
  );

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
        status: "subscribed",
        subscribed_at: null,
        unsubscribed_at: null
      });
      await refreshAudienceMembers();
      await refreshAll();
      setMemberContactId("");
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add member");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribeMember(m: EmailAudienceMembership) {
    try {
      setBusy(true);
      setStatus(null);
      await updateEmailAudienceMembership(m.id, clientIdNum, { status: "unsubscribed" });
      await refreshAudienceMembers();
      await refreshAll();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to update member");
    } finally {
      setBusy(false);
    }
  }

  async function resubscribeMember(m: EmailAudienceMembership) {
    try {
      setBusy(true);
      setStatus(null);
      await updateEmailAudienceMembership(m.id, clientIdNum, { status: "subscribed" });
      await refreshAudienceMembers();
      await refreshAll();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to update member");
    } finally {
      setBusy(false);
    }
  }

  async function toggleMemberStatus(m: EmailAudienceMembership) {
    if (m.status === "unsubscribed") {
      await resubscribeMember(m);
    } else {
      await unsubscribeMember(m);
    }
  }

  function removeAudienceMember(m: EmailAudienceMembership) {
    confirmDeleteAudienceMember(m);
  }

  function confirmDeleteAudienceMember(m: EmailAudienceMembership) {
    Alert.alert("Remove member?", "This removes the contact from the audience.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEmailAudienceMembership(m.id, clientIdNum);
            await refreshAudienceMembers();
            await refreshAll();
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to remove member");
          }
        }
      }
    ]);
  }

  async function addAudience() {
    if (!canAddAudience) return;
    try {
      setBusy(true);
      setStatus(null);
      const created = await createEmailAudience({
        client: clientIdNum,
        name: audienceName.trim(),
        description: audienceDesc.trim()
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
        description: audienceDesc.trim()
      });
      setAudiences((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setActiveAudience(null);
      setAudienceEditOpen(false);
      await refreshAll();
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

  // -------------------- V2: Templates --------------------
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateEditOpen, setTemplateEditOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");

  const canAddTemplate = useMemo(() => templateName.trim().length > 0, [templateName]);
  const canSaveTemplate = useMemo(
    () => (activeTemplate ? templateName.trim().length > 0 : false),
    [activeTemplate, templateName]
  );

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
        subject: templateSubject.trim(),
        preheader: "",
        html: templateHtml,
        text: ""
      });
      setTemplates((prev) => [created, ...prev]);
      setTemplateName("");
      setTemplateSubject("");
      setTemplateHtml("");
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
        subject: templateSubject.trim(),
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

  // -------------------- V2: Campaigns --------------------
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignEditOpen, setCampaignEditOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<EmailCampaign | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [campaignTemplateId, setCampaignTemplateId] = useState<string>("");
  const [campaignAudienceId, setCampaignAudienceId] = useState<string>("");
  const [campaignSubjectOverride, setCampaignSubjectOverride] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("draft");

  const canAddCampaign = useMemo(() => campaignName.trim().length > 0, [campaignName]);
  const canSaveCampaign = useMemo(
    () => (activeCampaign ? campaignName.trim().length > 0 : false),
    [activeCampaign, campaignName]
  );

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
      await refreshAll();
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to queue send");
    } finally {
      setBusy(false);
    }
  }

  // -------------------- Legacy: retention planner (settings/campaigns/flows) --------------------
  const [retentionOpen, setRetentionOpen] = useState(false);
  const [legacyProvider, setLegacyProvider] = useState("klaviyo");
  const [legacyAccountId, setLegacyAccountId] = useState("");
  const [legacyEmailsPerMonth, setLegacyEmailsPerMonth] = useState("2");
  const [legacyNotes, setLegacyNotes] = useState("");

  useEffect(() => {
    if (!retentionSettings) return;
    setLegacyProvider(retentionSettings.provider ?? "klaviyo");
    setLegacyAccountId(retentionSettings.account_id ?? "");
    setLegacyEmailsPerMonth(String(retentionSettings.promotional_emails_per_month ?? 2));
    setLegacyNotes(retentionSettings.notes ?? "");
  }, [retentionSettings]);

  async function saveRetentionSettings() {
    if (!retentionSettings) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateRetentionSettings(retentionSettings.id, {
        provider: legacyProvider,
        account_id: legacyAccountId,
        promotional_emails_per_month: Number(legacyEmailsPerMonth) || 2,
        notes: legacyNotes
      });
      setRetentionSettings(updated);
      setRetentionOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save retention settings");
    } finally {
      setBusy(false);
    }
  }

  const [legacyCampaignOpen, setLegacyCampaignOpen] = useState(false);
  const [legacyCampaignSubject, setLegacyCampaignSubject] = useState("");
  const [legacyCampaignSendAt, setLegacyCampaignSendAt] = useState("");

  const [legacyCampaignEditOpen, setLegacyCampaignEditOpen] = useState(false);
  const [activeLegacyCampaign, setActiveLegacyCampaign] = useState<LegacyEmailCampaign | null>(null);
  const [legacyCampaignEditSubject, setLegacyCampaignEditSubject] = useState("");
  const [legacyCampaignEditStatus, setLegacyCampaignEditStatus] = useState("planned");
  const [legacyCampaignEditSendAt, setLegacyCampaignEditSendAt] = useState("");

  // -------------------- Legacy -> v2 conversion --------------------
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertSource, setConvertSource] = useState<LegacyEmailCampaign | null>(null);
  const [convertV2CampaignName, setConvertV2CampaignName] = useState("");
  const [convertV2Subject, setConvertV2Subject] = useState("");
  const [convertV2AudienceId, setConvertV2AudienceId] = useState<string>("");
  const [convertV2TemplateName, setConvertV2TemplateName] = useState("");
  const [convertV2TemplateHtml, setConvertV2TemplateHtml] = useState("");

  function truncate255(s: string) {
    const str = s || "";
    return str.length > 255 ? str.slice(0, 255) : str;
  }

  function escapeHtml(s: string) {
    return (s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function buildConvertedHtml(subject: string, notes?: string) {
    const parts: string[] = [];
    const subj = (subject || "").trim();
    const n = (notes || "").trim();
    if (subj) parts.push(`<h2>${escapeHtml(subj)}</h2>`);
    if (n) parts.push(`<p>${escapeHtml(n).replace(/\n/g, "<br/>")}</p>`);
    return parts.join("\n");
  }

  function openConvertLegacyCampaign(c: LegacyEmailCampaign) {
    const subject = (c.subject || "").trim();
    const base = subject || `Planner campaign ${c.id}`;
    const name = truncate255(`Planner ${c.id}: ${base}`);

    setConvertSource(c);
    setConvertV2CampaignName(name);
    setConvertV2Subject(subject);
    setConvertV2TemplateName(name);
    setConvertV2TemplateHtml(buildConvertedHtml(subject, c.notes));

    // If there is exactly one audience, preselect it.
    setConvertV2AudienceId(audiences.length === 1 ? String(audiences[0].id) : "");
    setConvertOpen(true);
  }

  const canConvertLegacy = useMemo(
    () => convertV2CampaignName.trim().length > 0 && convertV2TemplateName.trim().length > 0,
    [convertV2CampaignName, convertV2TemplateName]
  );

  async function convertLegacyToV2() {
    if (!convertSource || !canConvertLegacy) return;
    try {
      setBusy(true);
      setStatus(null);

      const createdTemplate = await createEmailTemplate({
        client: clientIdNum,
        name: convertV2TemplateName.trim(),
        subject: convertV2Subject,
        preheader: "",
        html: convertV2TemplateHtml,
        text: (convertSource.notes || "").trim()
      });
      setTemplates((prev) => [createdTemplate, ...prev]);

      const createdCampaign = await createEmailCampaign({
        client: clientIdNum,
        name: convertV2CampaignName.trim(),
        status: "draft",
        template: createdTemplate.id,
        audience: convertV2AudienceId ? Number(convertV2AudienceId) : null,
        segment: null,
        subject_override: convertV2Subject,
        send_at: null,
        sent_at: null
      });
      setCampaigns((prev) => [createdCampaign, ...prev]);

      setConvertOpen(false);
      setStatus("Converted planner campaign to a v2 draft campaign.");
      openCampaignEditor(createdCampaign);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ??
        (typeof e?.response?.data === "object" ? JSON.stringify(e.response.data) : null) ??
        e?.message ??
        "Unable to convert planner campaign";
      setStatus(msg);
    } finally {
      setBusy(false);
    }
  }

  const canAddLegacyCampaign = useMemo(
    () => legacyCampaignSubject.trim().length > 0 && !!engineId,
    [legacyCampaignSubject, engineId]
  );
  const canSaveLegacyCampaign = useMemo(
    () => legacyCampaignEditSubject.trim().length > 0,
    [legacyCampaignEditSubject]
  );

  function openLegacyCampaignEditor(c: LegacyEmailCampaign) {
    setActiveLegacyCampaign(c);
    setLegacyCampaignEditSubject(c.subject ?? "");
    setLegacyCampaignEditStatus(c.status ?? "planned");
    setLegacyCampaignEditSendAt(c.send_at ?? "");
    setLegacyCampaignEditOpen(true);
  }

  async function addLegacyCampaign() {
    if (!engineId || !canAddLegacyCampaign) return;
    try {
      setStatus(null);
      setBusy(true);
      const created = await createLegacyEmailCampaign({
        engine: engineId,
        subject: legacyCampaignSubject.trim(),
        status: "planned",
        send_at: legacyCampaignSendAt || null,
        linked_task: null,
        linked_calendar_item: null,
        notes: ""
      });
      setLegacyCampaigns((prev) => [created, ...prev]);
      setLegacyCampaignSubject("");
      setLegacyCampaignSendAt("");
      setLegacyCampaignOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add planner campaign");
    } finally {
      setBusy(false);
    }
  }

  async function saveLegacyCampaignEdits() {
    if (!activeLegacyCampaign || !canSaveLegacyCampaign) return;
    try {
      setStatus(null);
      setBusy(true);
      const updated = await updateLegacyEmailCampaign(activeLegacyCampaign.id, {
        subject: legacyCampaignEditSubject.trim(),
        status: legacyCampaignEditStatus,
        send_at: legacyCampaignEditSendAt || null
      });
      setLegacyCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setLegacyCampaignEditOpen(false);
      setActiveLegacyCampaign(null);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save planner campaign");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteLegacyCampaign(c: LegacyEmailCampaign) {
    Alert.alert("Delete planner campaign?", c.subject, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteLegacyEmailCampaign(c.id);
            setLegacyCampaigns((prev) => prev.filter((x) => x.id !== c.id));
          } catch (e: any) {
            setStatus(e?.message ?? "Unable to delete planner campaign");
          }
        }
      }
    ]);
  }

  const [flowOpen, setFlowOpen] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [flowType, setFlowType] = useState("welcome");

  const [flowEditOpen, setFlowEditOpen] = useState(false);
  const [activeFlow, setActiveFlow] = useState<EmailFlow | null>(null);
  const [flowEditName, setFlowEditName] = useState("");
  const [flowEditType, setFlowEditType] = useState("welcome");
  const [flowEditStatus, setFlowEditStatus] = useState("active");

  const canAddFlow = useMemo(() => flowName.trim().length > 0 && !!engineId, [flowName, engineId]);
  const canSaveFlow = useMemo(() => flowEditName.trim().length > 0, [flowEditName]);

  function openFlowEditor(f: EmailFlow) {
    setActiveFlow(f);
    setFlowEditName(f.name ?? "");
    setFlowEditType(f.flow_type ?? "welcome");
    setFlowEditStatus(f.status ?? "active");
    setFlowEditOpen(true);
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
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to add flow");
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
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save flow");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteFlow(f: EmailFlow) {
    Alert.alert("Delete flow?", f.name, [
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
    <Screen subtitle="Email Engine" statusText={status}>
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
              subtitle="Email • email_campaign_ideas"
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
        Quick Actions (disabled)
        - Creates a linked Task + Calendar item for email work
        - Disabled to keep Email Engine focused on the send workflow
      */}
      {/*
      <MarketingQuickActions
        clientId={clientIdNum}
        defaultCalendarPlatform="email"
        defaultCalendarContentType="send"
      />
      */}

      <Card>
        <SectionHeader title="Email send dashboard" variant="card" />

        {/* Centered next-step pill */}
        <View className="mt-3 items-center">
          {progress.next ? (
            <Pressable onPress={progress.next.onPress}>
              <Badge label={`Next: ${progress.next.label}`} />
            </Pressable>
          ) : null}
        </View>

        {/* Progress meter */}
        <View className="mt-3">
          <View className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <View
              className="h-2 bg-emerald-600"
              style={{ width: `${Math.round((progress.doneCount / progress.total) * 100)}%` }}
            />
          </View>
          <View className="mt-2 items-center">
            <Text className="text-xs opacity-70">{progress.doneCount} of {progress.total} steps complete</Text>
          </View>
        </View>

        <View className="mt-3 gap-2">
          <ListRow
            title="1) Configure sender"
            subtitle={
              quick.haveProvider
                ? `From: ${providerSettings?.from_email || "Configured"}`
                : "Set From email + public base URL"
            }
            right={<Ionicons name={quick.haveProvider ? "checkmark-circle" : "chevron-forward"} size={20} color={quick.haveProvider ? "#059669" : "#111827"} />}
            onPress={() => setProviderOpen(true)}
          />
          <ListRow
            title="2) Build contacts"
            subtitle={contacts.length ? `${contacts.length} contacts ready` : "Add your first contact"}
            right={<Ionicons name={quick.haveContacts ? "checkmark-circle" : "chevron-forward"} size={20} color={quick.haveContacts ? "#059669" : "#111827"} />}
            onPress={() => setContactsManagerOpen(true)}
          />
          <ListRow
            title="3) Create an audience"
            subtitle={audiences.length ? `${audiences.length} audiences created` : "Create your first audience"}
            right={<Ionicons name={quick.haveAudience ? "checkmark-circle" : "chevron-forward"} size={20} color={quick.haveAudience ? "#059669" : "#111827"} />}
            onPress={() => setAudiencesManagerOpen(true)}
          />
          <ListRow
            title="4) Add members"
            subtitle={
              quick.haveMembers
                ? "Members added"
                : wizard.canManageMembers
                  ? "Open an audience → add contacts"
                  : "Locked until you have contacts + an audience"
            }
            titleClassName={wizard.canManageMembers || quick.haveMembers ? undefined : "text-base font-semibold opacity-50"}
            subtitleClassName={wizard.canManageMembers || quick.haveMembers ? undefined : "text-sm opacity-50 mt-1"}
            right={
              <Ionicons
                name={
                  quick.haveMembers
                    ? "checkmark-circle"
                    : wizard.canManageMembers
                      ? "chevron-forward"
                      : "lock-closed-outline"
                }
                size={20}
                color={quick.haveMembers ? "#059669" : wizard.canManageMembers ? "#111827" : "#6B7280"}
              />
            }
            onPress={() => {
              if (quick.haveMembers || wizard.canManageMembers) {
                if (audiences[0]) openAudienceEditor(audiences[0]);
                else setAudiencesManagerOpen(true);
                return;
              }

              if (!contacts.length) {
                wizardLock("Members are locked", wizard.membersLockMessage, () => setContactsManagerOpen(true));
                return;
              }
              wizardLock("Members are locked", wizard.membersLockMessage, () => setAudiencesManagerOpen(true));
            }}
          />
          <ListRow
            title="5) Design a template"
            subtitle={templates.length ? `${templates.length} templates ready` : "Create your first template"}
            right={<Ionicons name={quick.haveTemplate ? "checkmark-circle" : "chevron-forward"} size={20} color={quick.haveTemplate ? "#059669" : "#111827"} />}
            onPress={() => setTemplatesManagerOpen(true)}
          />
          <ListRow
            title="6) Launch campaign"
            subtitle={
              campaigns.length
                ? `${campaigns.length} campaigns created`
                : wizard.canLaunchCampaign
                  ? "Create a campaign → press Send"
                  : "Locked until sender + audience + members + template"
            }
            titleClassName={wizard.canLaunchCampaign || quick.haveCampaign ? undefined : "text-base font-semibold opacity-50"}
            subtitleClassName={wizard.canLaunchCampaign || quick.haveCampaign ? undefined : "text-sm opacity-50 mt-1"}
            right={
              <Ionicons
                name={
                  quick.haveCampaign
                    ? "checkmark-circle"
                    : wizard.canLaunchCampaign
                      ? "chevron-forward"
                      : "lock-closed-outline"
                }
                size={20}
                color={quick.haveCampaign ? "#059669" : wizard.canLaunchCampaign ? "#111827" : "#6B7280"}
              />
            }
            onPress={() => {
              if (wizard.canLaunchCampaign || quick.haveCampaign) {
                setCampaignsManagerOpen(true);
                return;
              }

              if (!quick.haveProvider) {
                wizardLock("Campaigns are locked", wizard.campaignLockMessage, () => setProviderOpen(true));
                return;
              }
              if (!quick.haveAudience) {
                wizardLock("Campaigns are locked", wizard.campaignLockMessage, () => setAudiencesManagerOpen(true));
                return;
              }
              if (!quick.haveMembers) {
                wizardLock("Campaigns are locked", wizard.campaignLockMessage, () => setAudiencesManagerOpen(true));
                return;
              }
              wizardLock("Campaigns are locked", wizard.campaignLockMessage, () => setTemplatesManagerOpen(true));
            }}
          />

          <ListRow
            title="Planner (legacy, optional)"
            subtitle="Plan flows + campaigns, then convert to sendable v2"
            right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
            onPress={() => setLegacyManagerOpen(true)}
          />
        </View>
      </Card>

      {/* -------- Managers (list/CRUD) -------- */}
      <Modal visible={contactsManagerOpen} transparent animationType="fade" onRequestClose={() => setContactsManagerOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setContactsManagerOpen(false)}>
          <View className="flex-1 justify-center py-10">
            <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
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
              <ScrollView className="mt-3" style={{ maxHeight: 420 }}>
                {contacts.length === 0 ? (
                  <Text className="text-sm opacity-70">No contacts yet.</Text>
                ) : (
                  contacts.slice(0, 200).map((c) => (
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
              </ScrollView>
              <View className="flex-row justify-end gap-2 mt-4">
                <Pressable onPress={() => setContactsManagerOpen(false)}>
                  <Badge label="Close" />
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={audiencesManagerOpen} transparent animationType="fade" onRequestClose={() => setAudiencesManagerOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setAudiencesManagerOpen(false)}>
          <View className="flex-1 justify-center py-10">
            <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
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
              <ScrollView className="mt-3" style={{ maxHeight: 420 }}>
                {audiences.length === 0 ? (
                  <Text className="text-sm opacity-70">No audiences yet.</Text>
                ) : (
                  audiences.slice(0, 200).map((a) => (
                    <ListRow
                      key={a.id}
                      title={a.name}
                      subtitle={`${a.member_count ?? 0} members`}
                      onPress={() => openAudienceEditor(a)}
                      right={
                        <View className="flex-row gap-2">
                          <Pressable onPress={() => openAudienceEditor(a)}>
                            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                              <Ionicons name="people-outline" size={18} color="#111827" />
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
              </ScrollView>
              <View className="flex-row justify-end gap-2 mt-4">
                <Pressable onPress={() => setAudiencesManagerOpen(false)}>
                  <Badge label="Close" />
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={templatesManagerOpen} transparent animationType="fade" onRequestClose={() => setTemplatesManagerOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setTemplatesManagerOpen(false)}>
          <View className="flex-1 justify-center py-10">
            <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
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
              <ScrollView className="mt-3" style={{ maxHeight: 420 }}>
                {templates.length === 0 ? (
                  <Text className="text-sm opacity-70">No templates yet.</Text>
                ) : (
                  templates.slice(0, 200).map((t) => (
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
              </ScrollView>
              <View className="flex-row justify-end gap-2 mt-4">
                <Pressable onPress={() => setTemplatesManagerOpen(false)}>
                  <Badge label="Close" />
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={campaignsManagerOpen} transparent animationType="fade" onRequestClose={() => setCampaignsManagerOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setCampaignsManagerOpen(false)}>
          <View className="flex-1 justify-center py-10">
            <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
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
              <ScrollView className="mt-3" style={{ maxHeight: 420 }}>
                {campaigns.length === 0 ? (
                  <Text className="text-sm opacity-70">No campaigns yet.</Text>
                ) : (
                  campaigns.slice(0, 200).map((c) => (
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
              </ScrollView>
              <View className="flex-row justify-end gap-2 mt-4">
                <Pressable onPress={() => setCampaignsManagerOpen(false)}>
                  <Badge label="Close" />
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={legacyManagerOpen} transparent animationType="fade" onRequestClose={() => setLegacyManagerOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setLegacyManagerOpen(false)}>
          <View className="flex-1 justify-center py-10">
            <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
              <SectionHeader
                title="Legacy planning"
                subtitle="Retention settings, planner campaigns, flows"
                action={
                  <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                    <Ionicons name="create-outline" size={18} color="#111827" />
                  </View>
                }
                onPressAction={() => setRetentionOpen(true)}
              />

              <View className="mt-3">
                <ListRow title="Planner provider" subtitle={retentionSettings?.provider || "Not set"} />
                <ListRow title="Promo emails/month" subtitle={String(retentionSettings?.promotional_emails_per_month ?? 2)} />
              </View>

              <View className="mt-4">
                <SectionHeader
                  title="Planner campaigns"
                  subtitle="Ideas + schedule (not sendable until converted)"
                  action={
                    <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                      <Ionicons name="add" size={22} color="#111827" />
                    </View>
                  }
                  onPressAction={() => setLegacyCampaignOpen(true)}
                />
                <ScrollView className="mt-3" style={{ maxHeight: 220 }}>
                  {legacyCampaigns.length === 0 ? (
                    <Text className="text-sm opacity-70">No planner campaigns yet.</Text>
                  ) : (
                    legacyCampaigns.slice(0, 100).map((c) => (
                      <ListRow
                        key={c.id}
                        title={c.subject}
                        subtitle={`${c.status || "status"} • ${c.send_at ? "scheduled" : "unscheduled"}`}
                        onPress={() => openLegacyCampaignEditor(c)}
                        right={
                          <View className="flex-row gap-2">
                            <Pressable onPress={() => openConvertLegacyCampaign(c)}>
                              <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                                <Ionicons name="swap-horizontal-outline" size={18} color="#111827" />
                              </View>
                            </Pressable>
                            <Pressable onPress={() => openLegacyCampaignEditor(c)}>
                              <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                                <Ionicons name="create-outline" size={18} color="#111827" />
                              </View>
                            </Pressable>
                            <Pressable onPress={() => confirmDeleteLegacyCampaign(c)}>
                              <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                                <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                              </View>
                            </Pressable>
                          </View>
                        }
                      />
                    ))
                  )}
                </ScrollView>
              </View>

              <View className="mt-4">
                <SectionHeader
                  title="Flows"
                  subtitle="Welcome, abandoned cart, post-purchase"
                  action={
                    <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
                      <Ionicons name="add" size={22} color="#111827" />
                    </View>
                  }
                  onPressAction={() => setFlowOpen(true)}
                />
                <ScrollView className="mt-3" style={{ maxHeight: 220 }}>
                  {flows.length === 0 ? (
                    <Text className="text-sm opacity-70">No flows yet.</Text>
                  ) : (
                    flows.slice(0, 100).map((f) => (
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
                </ScrollView>
              </View>

              <View className="flex-row justify-end gap-2 mt-4">
                <Pressable onPress={() => setLegacyManagerOpen(false)}>
                  <Badge label="Close" />
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* -------- V2 Provider modal -------- */}
      <Modal visible={providerOpen} transparent animationType="fade" onRequestClose={() => setProviderOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setProviderOpen(false)}>
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
              <TextInput value={fromEmail} onChangeText={setFromEmail} placeholder="noreply@yourdomain.com" autoCapitalize="none" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">From name</Text>
              <TextInput value={fromName} onChangeText={setFromName} placeholder="Your Company" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Reply-to</Text>
              <TextInput value={replyTo} onChangeText={setReplyTo} placeholder="support@yourdomain.com" autoCapitalize="none" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Physical address</Text>
              <TextInput value={physicalAddress} onChangeText={setPhysicalAddress} placeholder="123 Main St, City, ST" multiline className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Public base URL</Text>
              <TextInput value={publicBaseUrl} onChangeText={setPublicBaseUrl} placeholder="http://localhost" autoCapitalize="none" className="rounded-xl border border-gray-200 px-3 py-2" />
              <Text className="text-xs opacity-60 mt-1">Used for unsubscribe + tracking links.</Text>
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setProviderOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={saveProviderSettings} disabled={busy} className={busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Saving..." : "Save"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* -------- Contact add/edit -------- */}
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

      {/* -------- Audience add/edit -------- */}
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
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setAudienceEditOpen(false)}>
          <View className="flex-1 justify-center py-10">
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
          </View>
        </Pressable>
      </Modal>

      {/* -------- Template add/edit -------- */}
      <Modal visible={templateOpen} transparent animationType="fade" onRequestClose={() => setTemplateOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setTemplateOpen(false)}>
          <View className="flex-1 justify-center py-10">
            <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
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
                  <TextInput value={templateHtml} onChangeText={setTemplateHtml} multiline autoCapitalize="none" className="px-3 py-2" />
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

      {/* -------- Campaign add/edit -------- */}
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

      {/* -------- Legacy retention settings modal -------- */}
      <Modal visible={retentionOpen} transparent animationType="fade" onRequestClose={() => setRetentionOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setRetentionOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit automation planning</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Provider</Text>
              <ChipSelect
                value={legacyProvider}
                onChange={setLegacyProvider}
                options={[
                  { label: "Klaviyo", value: "klaviyo" },
                  { label: "Mailchimp", value: "mailchimp" },
                  { label: "HubSpot", value: "hubspot" }
                ]}
              />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Account ID</Text>
              <TextInput value={legacyAccountId} onChangeText={setLegacyAccountId} className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Promo emails/month</Text>
              <TextInput value={legacyEmailsPerMonth} onChangeText={setLegacyEmailsPerMonth} keyboardType="numeric" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Notes</Text>
              <TextInput value={legacyNotes} onChangeText={setLegacyNotes} multiline className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setRetentionOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={saveRetentionSettings} disabled={busy} className={busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Saving..." : "Save"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* -------- Legacy planner campaign add/edit -------- */}
      <Modal visible={legacyCampaignOpen} transparent animationType="fade" onRequestClose={() => setLegacyCampaignOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setLegacyCampaignOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Add planner campaign</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Subject</Text>
              <TextInput value={legacyCampaignSubject} onChangeText={setLegacyCampaignSubject} placeholder="e.g. Weekend sale" className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <DateTimeField label="Send at" mode="datetime" value={legacyCampaignSendAt} onChange={setLegacyCampaignSendAt} placeholder="Pick date & time" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setLegacyCampaignOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={addLegacyCampaign} disabled={!canAddLegacyCampaign || busy} className={!canAddLegacyCampaign || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Creating..." : "Create"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={legacyCampaignEditOpen} transparent animationType="fade" onRequestClose={() => setLegacyCampaignEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setLegacyCampaignEditOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit planner campaign</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Subject</Text>
              <TextInput value={legacyCampaignEditSubject} onChangeText={setLegacyCampaignEditSubject} className="rounded-xl border border-gray-200 px-3 py-2" />
            </View>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Status</Text>
              <ChipSelect
                value={legacyCampaignEditStatus}
                onChange={setLegacyCampaignEditStatus}
                options={[
                  { label: "Planned", value: "planned" },
                  { label: "Scheduled", value: "scheduled" },
                  { label: "Sent", value: "sent" }
                ]}
              />
            </View>

            <View className="mt-3">
              <DateTimeField label="Send at" mode="datetime" value={legacyCampaignEditSendAt} onChange={setLegacyCampaignEditSendAt} placeholder="Pick date & time" />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setLegacyCampaignEditOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={saveLegacyCampaignEdits} disabled={!canSaveLegacyCampaign || busy} className={!canSaveLegacyCampaign || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Saving..." : "Save"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={convertOpen} transparent animationType="fade" onRequestClose={() => setConvertOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setConvertOpen(false)}>
          <View className="flex-1 justify-center py-10">
            <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
              <Text className="text-base font-semibold">Convert to sendable campaign (v2)</Text>
              <Text className="text-xs opacity-60 mt-1">Creates a v2 Template + a v2 Campaign in Draft.</Text>

              <View className="mt-3">
                <Text className="text-xs opacity-70 mb-1">v2 campaign name</Text>
                <TextInput value={convertV2CampaignName} onChangeText={setConvertV2CampaignName} className="rounded-xl border border-gray-200 px-3 py-2" />
              </View>

              <View className="mt-3">
                <Text className="text-xs opacity-70 mb-1">Subject</Text>
                <TextInput value={convertV2Subject} onChangeText={setConvertV2Subject} className="rounded-xl border border-gray-200 px-3 py-2" />
              </View>

              <View className="mt-3">
                <Text className="text-xs opacity-70 mb-1">Audience</Text>
                <ChipSelect value={convertV2AudienceId} onChange={setConvertV2AudienceId} options={[{ label: "(none)", value: "" }, ...audienceOptions]} />
              </View>

              <View className="mt-3">
                <Text className="text-xs opacity-70 mb-1">v2 template name</Text>
                <TextInput value={convertV2TemplateName} onChangeText={setConvertV2TemplateName} className="rounded-xl border border-gray-200 px-3 py-2" />
              </View>

              <View className="mt-3">
                <Text className="text-xs opacity-70 mb-1">Template HTML</Text>
                <TextInput value={convertV2TemplateHtml} onChangeText={setConvertV2TemplateHtml} multiline className="rounded-xl border border-gray-200 px-3 py-2" />
                <Text className="text-xs opacity-60 mt-1">Tip: you can edit the template later.</Text>
              </View>

              <View className="flex-row justify-end gap-2 mt-4">
                <Pressable onPress={() => setConvertOpen(false)}>
                  <Badge label="Cancel" />
                </Pressable>
                <Pressable onPress={convertLegacyToV2} disabled={!canConvertLegacy || busy} className={!canConvertLegacy || busy ? "opacity-50" : ""}>
                  <Badge label={busy ? "Converting..." : "Convert"} />
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* -------- Flow add/edit -------- */}
      <Modal visible={flowOpen} transparent animationType="fade" onRequestClose={() => setFlowOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setFlowOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Add flow</Text>

            <View className="mt-3">
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
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setFlowOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={addFlow} disabled={!canAddFlow || busy} className={!canAddFlow || busy ? "opacity-50" : ""}>
                <Badge label={busy ? "Creating..." : "Create"} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={flowEditOpen} transparent animationType="fade" onRequestClose={() => setFlowEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setFlowEditOpen(false)}>
          <Pressable className="bg-white rounded-2xl border border-gray-200 p-4" onPress={() => {}}>
            <Text className="text-base font-semibold">Edit flow</Text>

            <View className="mt-3">
              <Text className="text-xs opacity-70 mb-1">Name</Text>
              <TextInput value={flowEditName} onChangeText={setFlowEditName} className="rounded-xl border border-gray-200 px-3 py-2" />
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
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable onPress={() => setFlowEditOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable onPress={saveFlowEdits} disabled={!canSaveFlow || busy} className={!canSaveFlow || busy ? "opacity-50" : ""}>
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
// Added an "Ask Copilot" button + modal that calls runMarketingTask() for Email tasks.
