/*
LEGACY ClientDetailsScreen.tsx

The previous implementation contained merged/duplicated code blocks which caused
extensive TypeScript errors. It's temporarily retained here (commented out) to
enable an incremental refactor while keeping `npm run typecheck` green.
*/

/*
// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Linking, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { digitsOnly, formatPhoneAsYouType } from "../utils/phone";
import { formatClientId } from "../utils/client";

import type { AppStackParamList } from "../navigation/types";
import { endpoints } from "../services/endpoints";
import TaskList from "../components/TaskList";
import FileManager from "../components/FileManager";
import NotesFeed from "../components/NotesFeed";
import { listWithFallback } from "../services/safeApi";
import { mockClients } from "../services/mockData";
import { Badge, Card, DateTimeField, FloatingLabelInput, ListRow, ModalSurface, Screen, SectionHeader, ServicePill, StackModal } from "../components/ui";
import { CLIENT_STATUS_OPTIONS, ROLE_OPTIONS, SERVICE_OPTIONS } from "../constants/options";
import { getEnabledMarketingModules, normalizeServiceLabel, splitServiceList } from "../utils/marketingModules";
import { useSession } from "../hooks/useSession";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Client = {
  id: number;
  name: string;
  industry?: string;
  status?: string;
  stage?: string;
  service?: string;
  monthlyCost?: number;
  ownerRole?: string;
  website?: string;
  domainYearlyCost?: number;
  emailMonthlyCost?: number;
  primaryContactName?: string;
  primaryContactRole?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  startDate?: string;
  endDate?: string;
};

type Contact = {
  id: number;
  client: number;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  is_primary?: boolean;
};

type ClientServiceRecord = {
  id: number;
  client: number;
  service_name: string;
  start_date?: string | null;
  end_date?: string | null;
};

function isActiveService(svc: ClientServiceRecord): boolean {
  const end = (svc.end_date ?? "").toString().trim();
  if (!end) return true;
  const t = Date.parse(end);
  if (!Number.isFinite(t)) return true;
  // Active through the end date.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return t >= today.getTime();
}

function toNumberOrUndefined(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function pickFirstDefined(obj: any, keys: string[]): any {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v) !== "") return v;
  }
  return undefined;
}

function normalizeClient(raw: any, primaryContact: Contact | null): Client {
  const base: any = { ...(raw ?? {}) };

  base.ownerRole = pickFirstDefined(raw, ["ownerRole", "owner_role"]) ?? base.ownerRole;
  base.website = pickFirstDefined(raw, ["website"]) ?? base.website;
  base.service = pickFirstDefined(raw, ["service"]) ?? base.service;
  base.stage = pickFirstDefined(raw, ["stage"]) ?? base.stage;

  base.monthlyCost =
    toNumberOrUndefined(pickFirstDefined(raw, ["monthlyCost", "monthly_cost"])) ?? base.monthlyCost;
  base.domainYearlyCost =
    toNumberOrUndefined(pickFirstDefined(raw, ["domainYearlyCost", "domain_yearly_cost"])) ?? base.domainYearlyCost;
  base.emailMonthlyCost =
    toNumberOrUndefined(pickFirstDefined(raw, ["emailMonthlyCost", "email_monthly_cost"])) ?? base.emailMonthlyCost;

  base.startDate = pickFirstDefined(raw, ["startDate", "start_date"]) ?? base.startDate;
  base.endDate = pickFirstDefined(raw, ["endDate", "end_date"]) ?? base.endDate;

  if (primaryContact) {
    base.primaryContactName = primaryContact.name;
    base.primaryContactRole = primaryContact.role ?? "";
    base.primaryContactPhone = formatPhoneAsYouType(primaryContact.phone ?? "");
    base.primaryContactEmail = primaryContact.email ?? "";
  }

  return base as Client;
}

function getInitials(name: string): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = (parts.length > 1 ? parts[parts.length - 1] : "")?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}

function formatMonthlyCost(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}/mo`;
}

function formatMoney(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

function formatCostLine(label: string, amount: unknown, suffix: string): string {
  const formatted = formatMoney(amount);
  if (formatted === "—") return `${label}: —`;
  return `${label}: $${formatted}${suffix}`;
}

type PickerOption = { label: string; value: string };

function PickerModal({
  open,
  title,
  options,
  onSelect,
  onClose,
  overlayKey
}: {
  open: boolean;
  title: string;
  options: PickerOption[];
  onSelect: (value: string) => void;
  onClose: () => void;
  overlayKey: string;
}) {
  return (
    <StackModal overlayKey={overlayKey} visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={onClose}>
        <Pressable onPress={() => {}}>
          <ModalSurface title={title}>
            <View className="p-4">
              <View>
                {options.map((o) => (
                  <Pressable
                    key={o.value}
                    onPress={() => {
                      onSelect(o.value);
                      onClose();
                    }}
                    className="py-4 border-b border-gray-100"
                  >
                    <Text className="text-base font-semibold">{o.label}</Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex-row justify-end mt-4">
                <Pressable onPress={onClose}>
                  <Badge label="Close" />
                </Pressable>
              </View>
            </View>
          </ModalSurface>
        </Pressable>
      </Pressable>
    </StackModal>
  );
}

function FieldBox({
  label,
  value,
  right,
  onPress,
  editable,
  onChangeText,
  keyboardType
}: {
  label: string;
  value: string;
  right?: React.ReactNode;
  onPress?: () => void;
  editable?: boolean;
  onChangeText?: (v: string) => void;
  keyboardType?: any;
}) {
  const Container: any = onPress ? Pressable : View;
  const shouldAutoCapitalizeNone = /website|email/i.test(label);

  return (
    <Container
      onPress={onPress}
      className="rounded-2xl border border-gray-200 bg-white"
      hitSlop={10}
    >
      <View className="flex-row items-center px-3" style={{ position: "relative" }}>
        <Text className="font-semibold" style={{ position: "absolute", left: 14, top: 7, fontSize: 11, opacity: 0.75 }}>
          {label}
        </Text>
        <View className="flex-1 pr-3" style={{ minWidth: 0, paddingTop: 22, paddingBottom: 10 }}>
          {editable ? (
            <TextInput
              value={value}
              onChangeText={onChangeText}
              keyboardType={keyboardType}
              autoCapitalize={shouldAutoCapitalizeNone ? "none" : "words"}
              className="text-sm font-semibold"
            />
          ) : (
            <Text className="text-sm font-semibold" numberOfLines={1} ellipsizeMode="tail">
              {value}
            </Text>
          )}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </Container>
  );
}

export default function ClientDetailsScreen() {
  const route = useRoute<RouteProp<AppStackParamList, "ClientDetails">>();
  const { clientId } = route.params;
  const navigation = useNavigation<Nav>();
  const { height: windowHeight } = useWindowDimensions();

  const { isAdmin } = useSession();

  const [client, setClient] = useState<Client | null>(null);
  const [primaryContact, setPrimaryContact] = useState<Contact | null>(null);
  const [services, setServices] = useState<ClientService[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [primaryContact, setPrimaryContact] = useState<Contact | null>(null);
  const [clientServices, setClientServices] = useState<ClientServiceRecord[]>([]);
  const [saving, setSaving] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [editIndustry, setEditIndustry] = useState("");
  const [editStatusValue, setEditStatusValue] = useState("");
  const [editOwnerRole, setEditOwnerRole] = useState("Owner");
  const [editService, setEditService] = useState("Social media management");
  const [editWebsite, setEditWebsite] = useState("");
  const [editPrimaryContactName, setEditPrimaryContactName] = useState("");
  const [editPrimaryContactPhone, setEditPrimaryContactPhone] = useState("");
  const [editPrimaryContactEmail, setEditPrimaryContactEmail] = useState("");
  const [editDomainYearlyCost, setEditDomainYearlyCost] = useState("12.00");
  const [editEmailMonthlyCost, setEditEmailMonthlyCost] = useState("8.40");
  const [editMonthlyRetainer, setEditMonthlyRetainer] = useState("250.00");
  const [editStartDate, setEditStartDate] = useState("2025-08-01");
  const [editEndDate, setEditEndDate] = useState("2026-12-31");

  const [ownerPickerOpen, setOwnerPickerOpen] = useState(false);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  const [invoiceTo, setInvoiceTo] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");

  const serviceRaw = useMemo(() => {
    const active = (clientServices ?? []).filter(isActiveService);
    const fromRegistered = active
      .map((s) => String(s.service_name ?? "").trim())
      .filter(Boolean);
      
    if (fromRegistered.length) return fromRegistered.join(", ");
    return String((client as any)?.service ?? "").trim();
  }, [clientServices, client]);

  const services = useMemo(() => {
    if (!serviceRaw) return [];
    return splitServiceList(serviceRaw);
  }, [serviceRaw]);

  const enabledModules = useMemo(() => getEnabledMarketingModules(serviceRaw), [serviceRaw]);

  function routeForServiceLabel(label: string) {
    const mods = getEnabledMarketingModules(label);
    if (!mods.length) return null;
    // If a label implies multiple modules (e.g. "SEO + Reporting"), default to the first one.
    return mods[0].route;
  }

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editIndustries, setEditIndustries] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState("");
  const [editBrandColorsCsv, setEditBrandColorsCsv] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [editContactName, setEditContactName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editContactRole, setEditContactRole] = useState("");

  const [industryPickerOpen, setIndustryPickerOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [datePicker, setDatePicker] = useState<null | "start" | "end">(null);

  const [logoUploading, setLogoUploading] = useState(false);

  const [metaConnection, setMetaConnection] = useState<ClientSocialConnection | null>(null);
  const [metaConnectOpen, setMetaConnectOpen] = useState(false);
  const [metaEnabled, setMetaEnabled] = useState(true);
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaIgUserId, setMetaIgUserId] = useState("");
  const [metaFbPageId, setMetaFbPageId] = useState("");
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaRefreshing, setMetaRefreshing] = useState(false);

  const firstService = (services ?? [])[0] ?? null;
  const [analyticsTab, setAnalyticsTab] = useState<"web" | "social">("web");

  const asMoney = (v: any): string => {
    if (v == null || v === "") return "Not set";
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return "Not set";
    return `$${n.toFixed(2)}`;
  };

  const [editServiceNames, setEditServiceNames] = useState<string[]>([]);
  const [editServiceStartDate, setEditServiceStartDate] = useState<Date | null>(null);
  const [editServiceEndDate, setEditServiceEndDate] = useState<Date | null>(null);
  const [editBusinessId, setEditBusinessId] = useState<number | null>(null);
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editDomainYearlyCost, setEditDomainYearlyCost] = useState("");
  const [editEmailMonthlyCost, setEditEmailMonthlyCost] = useState("");
  const [editMonthlyRetainer, setEditMonthlyRetainer] = useState("");

  const [billingBusy, setBillingBusy] = useState(false);

  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const [quickNoteTitle, setQuickNoteTitle] = useState("");
  const [quickNoteBody, setQuickNoteBody] = useState("");
  const [notesRefreshNonce, setNotesRefreshNonce] = useState(0);

  const canSaveQuickNote = useMemo(() => quickNoteTitle.trim().length > 0, [quickNoteTitle]);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceServiceIds, setInvoiceServiceIds] = useState<number[]>([]);
  const invoiceEligibleServices = useMemo(() => {
    const list = (services ?? []).filter((s) => {
      const raw = s?.monthly_retainer;
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(n) && n > 0;
    });
    return list;
  }, [services]);

  function loadServiceIntoEdit(svc: ClientService | null) {
    setEditBusinessId(svc?.id ?? null);
    const name = String(svc?.service_name ?? "").trim();
    setEditServiceNames(name ? [name] : []);
    setEditServiceStartDate(parseApiDate(svc?.start_date));
    setEditServiceEndDate(parseApiDate(svc?.end_date));
    setEditWebsiteUrl(String(svc?.website_url ?? ""));
    setEditDomainYearlyCost(
      svc?.domain_yearly_cost == null || svc?.domain_yearly_cost === ""
        ? ""
        : String(svc.domain_yearly_cost)
    );
    setEditEmailMonthlyCost(
      svc?.email_monthly_cost == null || svc?.email_monthly_cost === ""
        ? ""
        : String(svc.email_monthly_cost)
    );

    setEditMonthlyRetainer(
      svc?.monthly_retainer == null || svc?.monthly_retainer === ""
        ? ""
        : String(svc.monthly_retainer)
    );
  }

  async function createStripeInvoiceForClient() {
    if (shouldUseMock()) {
      setStatus("Invoicing is unavailable in demo mode");
      return;
    }

    try {
      if (billingBusy) return;
      setBillingBusy(true);
      setStatus(null);

      const res = await billing.createInvoice(Number(clientId), { finalize: true });
      const url = String(res?.data?.hosted_invoice_url ?? "").trim();

      if (url) {
        await Linking.openURL(url);
        setStatus("Invoice created.");
      } else {
        setStatus("Invoice created, but no hosted invoice URL was returned.");
      }
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        (typeof data?.detail === "string" && data.detail) ||
        (data ? JSON.stringify(data) : null) ||
        e?.message ||
        String(e);
      setStatus(msg);
    } finally {
      setBillingBusy(false);
    }
  }

  function openInvoiceModal() {
    const defaultIds = invoiceEligibleServices.map((s) => Number(s.id)).filter((n) => Number.isFinite(n));
    setInvoiceServiceIds(defaultIds);
    setInvoiceOpen(true);
  }

  async function createAndSendInvoice() {
    if (shouldUseMock()) {
      setStatus("Invoicing is unavailable in demo mode");
      return;
    }

    try {
      if (billingBusy) return;
      setBillingBusy(true);
      setStatus(null);

      const ids = (invoiceServiceIds ?? []).map((n) => Number(n)).filter((n) => Number.isFinite(n));
      const res = await billing.createInvoice(Number(clientId), {
        service_ids: ids.length ? ids : undefined,
        finalize: true,
        send: true
      });

      const url = String(res?.data?.hosted_invoice_url ?? "").trim();
      if (url) {
        setInvoiceOpen(false);
        await Linking.openURL(url);
        setStatus("Invoice created.");
      } else {
        setStatus("Invoice created, but no hosted invoice URL was returned.");
      }
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        (typeof data?.detail === "string" && data.detail) ||
        (data ? JSON.stringify(data) : null) ||
        e?.message ||
        String(e);
      setStatus(msg);
    } finally {
      setBillingBusy(false);
    }
  }

  function toggleInvoiceService(id: number) {
    setInvoiceServiceIds((prev) => {
      const has = prev.includes(id);
      return has ? prev.filter((v) => v !== id) : [...prev, id];
    });
  }

  async function onSaveQuickNote() {
    if (!canSaveQuickNote) return;
    try {
      await addClientNote({
        clientId: Number(clientId),
        title: quickNoteTitle,
        body: quickNoteBody
      });
      setQuickNoteOpen(false);
      setQuickNoteTitle("");
      setQuickNoteBody("");
      setNotesRefreshNonce((n) => n + 1);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to add note");
    }
  }

  function openEdit() {
    setEditName(client?.name ?? "");
    setEditLogoUrl(String(client?.logo_url ?? ""));
    const industries = String(client?.industry ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    setEditIndustries(industries);
    setEditStatus(String(client?.status ?? ""));
    setEditBrandColorsCsv(brandColorsToCsv(client?.brand_colors));

    // Load the single Edit Client notes field from the Notes store.
    (async () => {
      try {
        const list = await listClientNotes(Number(clientId));
        const existing = list.find((n) => n.title.trim().toLowerCase() === "client notes");
        setEditNotes(existing?.body ?? "");
      } catch {
        setEditNotes("");
      }
    })();

    setEditContactName(primaryContact?.name ?? "");
    setEditContactEmail(primaryContact?.email ?? "");
    setEditContactPhone(primaryContact?.phone ?? "");
    setEditContactRole(primaryContact?.role ?? "");

    const svc0 = services?.[0] ?? null;
    loadServiceIntoEdit(svc0);

    setEditOpen(true);
  }

  async function pickLogo() {
    try {
      if (logoUploading) return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.9
      });
      if ((res as any).canceled) return;
      const asset = (res as any).assets?.[0];
      const uri = String(asset?.uri ?? "");
      if (!uri) return;

      // Show preview immediately.
      setEditLogoUrl(uri);

      // In mock/demo mode there's no backend to upload to; just preview locally.
      if (shouldUseMock()) {
        return;
      }

      setLogoUploading(true);

      const rawName = String(asset?.fileName ?? "").trim();
      const fallbackName = String(uri.split("/").pop() ?? "").trim();
      const name = rawName || fallbackName || `client_${clientId}_logo.jpg`;
      const type = String(asset?.mimeType ?? "").trim() || "image/jpeg";

      const uploaded = await endpoints.clients.uploadLogo(Number(clientId), {
        uri,
        name,
        type
      });

      const newUrl = String(uploaded?.data?.logo_url ?? "").trim();
      if (newUrl) setEditLogoUrl(newUrl);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to pick image");
    } finally {
      setLogoUploading(false);
    }
  }

  function closeEdit() {
    setEditOpen(false);
    setIndustryPickerOpen(false);
    setStatusPickerOpen(false);
    setRolePickerOpen(false);
    setServicePickerOpen(false);
    setDatePicker(null);
    setMetaConnectOpen(false);
  }

  function openMetaConnect() {
    setMetaEnabled(Boolean(metaConnection?.enabled ?? true));
    // Token is write-only on the API, so we never prefill it.
    setMetaAccessToken("");
    setMetaIgUserId(String(metaConnection?.ig_user_id ?? ""));
    setMetaFbPageId(String(metaConnection?.fb_page_id ?? ""));
    setMetaConnectOpen(true);
  }

  async function saveMetaConnection() {
    if (shouldUseMock()) {
      setStatus("Meta connect is unavailable in demo mode");
      return;
    }

    try {
      if (metaSaving) return;
      setMetaSaving(true);
      setStatus(null);

      const payload: any = {
        client: Number(clientId),
        platform: "meta",
        enabled: Boolean(metaEnabled),
        ig_user_id: metaIgUserId.trim(),
        fb_page_id: metaFbPageId.trim()
      };
      const token = metaAccessToken.trim();
      if (token) payload.access_token = token;

      if (metaConnection?.id) {
        await endpoints.clientSocialConnections.update(Number(metaConnection.id), payload);
      } else {
        await endpoints.clientSocialConnections.create(payload);
      }

      setMetaConnectOpen(false);
      await load();
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        (typeof data?.detail === "string" && data.detail) ||
        (data ? JSON.stringify(data) : null) ||
        e?.message ||
        String(e);
      setStatus(msg);
    } finally {
      setMetaSaving(false);
    }
  }

  async function refreshMeta() {
    if (shouldUseMock()) {
      setStatus("Refresh is unavailable in demo mode");
      return;
    }

    if (!metaConnection?.id) {
      setStatus("Connect Meta first.");
      return;
    }

    try {
      if (metaRefreshing) return;
      setMetaRefreshing(true);
      setStatus(null);
      await endpoints.clientSocialConnections.refresh(Number(metaConnection.id));
      await load();
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        (typeof data?.detail === "string" && data.detail) ||
        (data ? JSON.stringify(data) : null) ||
        e?.message ||
        String(e);
      setStatus(msg);
    } finally {
      setMetaRefreshing(false);
    }
  }

  async function load() {
    setStatus(null);

    const foundRes = await endpoints.clients.get(Number(clientId));
    const found = (foundRes?.data as Client) ?? null;

    const contactsRes = await listWithFallback<Contact>(
      () => endpoints.contacts.list(Number(clientId)),
      mockContacts
    );

    const allContacts = (contactsRes.data ?? []).filter(
      (c: any) => Number(c.client) === Number(clientId)
    );
    const primary =
      allContacts.find((c: any) => Boolean(c.is_primary)) ?? allContacts[0] ?? null;

    const servicesRes = await listWithFallback<ClientService>(
      () => endpoints.clientServices.list(Number(clientId)),
      mockClientServices
    );

    const svc = (servicesRes.data ?? []).filter(
      (s: any) => Number(s.client) === Number(clientId)
    );

    if (!shouldUseMock()) {
      try {
        const connsRes = await endpoints.clientSocialConnections.list(Number(clientId));
        const conns = (connsRes?.data ?? []) as any[];
        const meta = conns.find((c) => Number(c.client) === Number(clientId) && c.platform === "meta") ?? null;
        setMetaConnection(meta);
      } catch {
        setMetaConnection(null);
      }
    } else {
      setMetaConnection(null);
    }

    setClient(found);
    setPrimaryContact(primary);
    setServices(svc);

    if (contactsRes.usingMock || servicesRes.usingMock) {
      setStatus("Showing demo data (API unavailable or unauthorized)");
    } else if (contactsRes.error) {
      setStatus(contactsRes.error);
    } else if (servicesRes.error) {
      setStatus(servicesRes.error);
    }
  }

  async function onSaveEdit() {
    const name = editName.trim();
    if (!name) {
      setStatus("Client name is required.");
      return;
    }

    const logo_url = editLogoUrl.trim();

    const brand_colors = {
      colors: editBrandColorsCsv
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    };

    const industry = editIndustries.join(", ");

    // In mock/demo mode, persist changes locally so the Save button does something useful.
    if (shouldUseMock()) {
      setStatus(null);
      setClient((prev) => {
        const base: Client = prev ?? { id: Number(clientId), name: "" };
        return {
          ...base,
          name,
          logo_url,
          industry,
          status: editStatus.trim(),
          brand_colors
        };
      });

      const cName = editContactName.trim();
      const cEmail = editContactEmail.trim();
      const cPhone = editContactPhone.trim();
      const cRole = editContactRole.trim();
      if (cName || cEmail || cPhone || cRole) {
        setPrimaryContact((prev) => {
          const base: Contact =
            prev ??
            ({
              id: Date.now(),
              client: Number(clientId),
              name: "Primary Contact",
              is_primary: true
            } as Contact);
          return {
            ...base,
            client: Number(clientId),
            name: cName || base.name,
            email: cEmail,
            phone: cPhone,
            role: cRole,
            is_primary: true
          };
        });
      }

      const selectedNames = editServiceNames.map((s) => s.trim()).filter(Boolean);
      const primaryName = selectedNames[0] ?? "";
      if (primaryName) {
        const domainRaw = editDomainYearlyCost.trim();
        const emailRaw = editEmailMonthlyCost.trim();
        const retainerRaw = editMonthlyRetainer.trim();
        const domainVal = domainRaw ? Number(domainRaw) : NaN;
        const emailVal = emailRaw ? Number(emailRaw) : NaN;
        const retainerVal = retainerRaw ? Number(retainerRaw) : NaN;

        setServices((prev) => {
          const list = prev ?? [];
          const existingIdx = list.findIndex((s) => Number(s.id) === Number(editBusinessId));
          const existing = existingIdx >= 0 ? list[existingIdx] : null;

          const nextSvc: ClientService = {
            id: existing?.id ?? Date.now(),
            client: Number(clientId),
            service_name: primaryName,
            start_date: formatDateForApi(editServiceStartDate) || null,
            end_date: formatDateForApi(editServiceEndDate) || null,
            website_url: editWebsiteUrl.trim(),
            website_analytics: existing?.website_analytics ?? {},
            social_analytics: existing?.social_analytics ?? {},
            domain_yearly_cost: Number.isFinite(domainVal) ? domainVal : null,
            email_monthly_cost: Number.isFinite(emailVal) ? emailVal : null,
            monthly_retainer: Number.isFinite(retainerVal) ? retainerVal : null
          };

          const next = list.slice();
          if (existingIdx >= 0) next[existingIdx] = nextSvc;
          else next.unshift(nextSvc);

          return next;
        });

        // Create any additional selected services (minimal defaults).
        if (selectedNames.length > 1) {
          setServices((prev) => {
            const list = prev ?? [];
            const existingNames = new Set(list.map((s) => String(s.service_name ?? "").trim().toLowerCase()));
            const additions: ClientService[] = selectedNames
              .slice(1)
              .filter((n) => !existingNames.has(n.trim().toLowerCase()))
              .map((n) => ({
                id: Date.now() + Math.floor(Math.random() * 1000),
                client: Number(clientId),
                service_name: n,
                start_date: formatDateForApi(editServiceStartDate) || null,
                end_date: formatDateForApi(editServiceEndDate) || null,
                website_url: "",
                website_analytics: {},
                social_analytics: {},
                domain_yearly_cost: null,
                email_monthly_cost: null,
                monthly_retainer: null
              }));
            return additions.length ? [...additions, ...list] : list;
          });
        }
      }

      // Save the Edit Client notes field.
      try {
        await upsertClientNote({ clientId: Number(clientId), title: "Client Notes", body: editNotes });
      } catch {
        // Best-effort.
      }

      closeEdit();
      return;
    }

    try {
      setStatus(null);
      await endpoints.clients.update(Number(clientId), {
        name,
        logo_url,
        industry,
        status: editStatus.trim(),
        brand_colors
      });

      // Save the Edit Client notes field.
      try {
        await upsertClientNote({ clientId: Number(clientId), title: "Client Notes", body: editNotes });
      } catch {
        // Best-effort.
      }

      const cName = editContactName.trim();
      const cEmail = editContactEmail.trim();
      const cPhone = editContactPhone.trim();
      const cRole = editContactRole.trim();

      // If any contact field is provided, upsert the primary contact.
      if (cName || cEmail || cPhone || cRole) {
        if (primaryContact?.id) {
          await endpoints.contacts.update(Number(primaryContact.id), {
            client: Number(clientId),
            name: cName,
            email: cEmail,
            phone: cPhone,
            role: cRole,
            is_primary: true
          });
        } else {
          await endpoints.contacts.create({
            client: Number(clientId),
            name: cName || "Primary Contact",
            email: cEmail,
            phone: cPhone,
            role: cRole,
            is_primary: true
          });
        }
      }

      // Upsert the selected business/service if provided.
      const selectedNames = editServiceNames.map((s) => s.trim()).filter(Boolean);
      const primaryName = selectedNames[0] ?? "";
      if (primaryName) {
        const existing = services.find((s) => Number(s.id) === Number(editBusinessId)) ?? null;
        const domainRaw = editDomainYearlyCost.trim();
        const emailRaw = editEmailMonthlyCost.trim();
        const retainerRaw = editMonthlyRetainer.trim();
        const domainVal = domainRaw ? Number(domainRaw) : NaN;
        const emailVal = emailRaw ? Number(emailRaw) : NaN;
        const retainerVal = retainerRaw ? Number(retainerRaw) : NaN;

        const payload = {
          client: Number(clientId),
          service_name: primaryName,
          start_date: formatDateForApi(editServiceStartDate) || null,
          end_date: formatDateForApi(editServiceEndDate) || null,
          website_url: editWebsiteUrl.trim(),
          website_analytics: existing?.website_analytics ?? {},
          social_analytics: existing?.social_analytics ?? {},
          domain_yearly_cost: Number.isFinite(domainVal) ? domainVal : null,
          email_monthly_cost: Number.isFinite(emailVal) ? emailVal : null,
          monthly_retainer: Number.isFinite(retainerVal) ? retainerVal : null
        };

        if (existing?.id) await endpoints.clientServices.update(Number(existing.id), payload);
        else await endpoints.clientServices.create(payload);

        // Create any additional selected services (minimal defaults).
        if (selectedNames.length > 1) {
          const existingNames = new Set(
            services.map((s) => String(s.service_name ?? "").trim().toLowerCase())
          );
          for (const name of selectedNames.slice(1)) {
            if (existingNames.has(name.trim().toLowerCase())) continue;
            await endpoints.clientServices.create({
              client: Number(clientId),
              service_name: name,
              start_date: formatDateForApi(editServiceStartDate) || null,
              end_date: formatDateForApi(editServiceEndDate) || null,
              website_url: "",
              website_analytics: {},
              social_analytics: {},
              domain_yearly_cost: null,
              email_monthly_cost: null,
              monthly_retainer: null
            });
          }
        }
      }

      closeEdit();
      await load();
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        (typeof data?.detail === "string" && data.detail) ||
        (data ? JSON.stringify(data) : null) ||
        e?.message ||
        String(e);
      setStatus(msg);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Clear previous client's data immediately to avoid stale UI when navigating between clients.
        setClient(null);
        setPrimaryContact(null);
        setServices([]);
        setMetaConnection(null);
        setStatus(null);
        const id = Number(clientId);

        let found: any = null;
        try {
          const res = await endpoints.clients.get(id);
          found = res.data;
        } catch {
          const list = await listWithFallback<Client>(endpoints.clients.list, mockClients);
          found = list.data.find((c: any) => Number(c.id) === id) ?? null;
          if (list.error) setStatus(list.error);
        }

        let primary: Contact | null = null;
        try {
          const contactsRes = await endpoints.contacts.listByClient(id);
          const all = (contactsRes.data ?? []) as Contact[];
          primary = all.find((c) => Boolean(c.is_primary)) ?? all[0] ?? null;
        } catch {
          primary = null;
        }

        let servicesList: ClientServiceRecord[] = [];
        try {
          const servicesRes = await endpoints.clientServices.listByClient(id);
          servicesList = (servicesRes.data ?? []) as ClientServiceRecord[];
        } catch {
          servicesList = [];
        }

        if (!active) return;
        setPrimaryContact(primary);
        setClientServices(servicesList);

        const normalized = normalizeClient(found, primary);
        setClient(normalized);

        const primaryRegisteredService = servicesList
          .filter(isActiveService)
          .map((s) => String(s.service_name ?? "").trim())
          .find(Boolean);

        setEditOwnerRole(String((normalized as any)?.ownerRole ?? "Owner"));
        setEditIndustry(String((normalized as any)?.industry ?? ""));
        setEditStatusValue(String((normalized as any)?.status ?? ""));
        setEditService(String(primaryRegisteredService ?? (normalized as any)?.service ?? "Social media management"));
        setEditWebsite(String((normalized as any)?.website ?? ""));

        setEditPrimaryContactName(String((normalized as any)?.primaryContactName ?? ""));
        setEditPrimaryContactPhone(String((normalized as any)?.primaryContactPhone ?? ""));
        setEditPrimaryContactEmail(String((normalized as any)?.primaryContactEmail ?? ""));

        setEditDomainYearlyCost(formatMoney((normalized as any)?.domainYearlyCost ?? 12));
        setEditEmailMonthlyCost(formatMoney((normalized as any)?.emailMonthlyCost ?? 8.4));
        setEditMonthlyRetainer(formatMoney((normalized as any)?.monthlyCost ?? 250));
        setEditStartDate(String((normalized as any)?.startDate ?? "2025-08-01"));
        setEditEndDate(String((normalized as any)?.endDate ?? "2026-12-31"));

        setInvoiceTo(String((normalized as any)?.primaryContactEmail ?? ""));
        setInvoiceAmount(formatMoney((normalized as any)?.monthlyCost ?? ""));
        setInvoiceDueDate(String((normalized as any)?.endDate ?? (normalized as any)?.startDate ?? ""));
      } catch (e: any) {
        if (!active) return;
        const found = mockClients.find((c) => Number((c as any).id) === Number(clientId)) ?? null;
        const normalized = normalizeClient(found, null);
        setClient(normalized as any);
        setPrimaryContact(null);
        setEditOwnerRole(String((normalized as any)?.ownerRole ?? "Owner"));
        setEditIndustry(String((normalized as any)?.industry ?? ""));
        setEditStatusValue(String((normalized as any)?.status ?? ""));
        setEditService(String((normalized as any)?.service ?? "Social media management"));
        setEditWebsite(String((normalized as any)?.website ?? ""));
        setEditPrimaryContactName(String((normalized as any)?.primaryContactName ?? ""));
        setEditPrimaryContactPhone(String((normalized as any)?.primaryContactPhone ?? ""));
        setEditPrimaryContactEmail(String((normalized as any)?.primaryContactEmail ?? ""));
        setEditDomainYearlyCost(formatMoney((normalized as any)?.domainYearlyCost ?? 12));
        setEditEmailMonthlyCost(formatMoney((normalized as any)?.emailMonthlyCost ?? 8.4));
        setEditMonthlyRetainer(formatMoney((normalized as any)?.monthlyCost ?? 250));
        setEditStartDate(String((normalized as any)?.startDate ?? "2025-08-01"));
        setEditEndDate(String((normalized as any)?.endDate ?? "2026-12-31"));
        setInvoiceTo(String((normalized as any)?.primaryContactEmail ?? ""));
        setInvoiceAmount(formatMoney((normalized as any)?.monthlyCost ?? ""));
        setInvoiceDueDate(String((normalized as any)?.endDate ?? (normalized as any)?.startDate ?? ""));
        setStatus(e?.message ?? "Unable to load client");
      }
    })();
    return () => {
      active = false;
    };
  }, [clientId]);

  async function onSendInvoiceEmail() {
    const to = invoiceTo.trim();
    const amount = invoiceAmount.trim();
    const due = invoiceDueDate.trim();
    const notes = invoiceNotes.trim();

    const subject = `Invoice for ${client?.name ?? "Client"}`;
    const lines = [
      `Client: ${client?.name ?? "—"}`,
      amount ? `Amount: $${amount}` : "Amount: —",
      due ? `Due date: ${due}` : "Due date: —",
      notes ? `Notes: ${notes}` : ""
    ].filter(Boolean);

    const body = lines.join("\n");
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      setStatus("Unable to open mail app on this device.");
      return;
    }

    await Linking.openURL(url);
    setIsInvoiceOpen(false);
  }

  async function onCallPrimaryContact() {
    const digits = digitsOnly((client as any)?.primaryContactPhone ?? "");
    if (!digits) {
      setStatus("No phone number available for this contact.");
      return;
    }

    const url = `tel:${digits}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      setStatus("Unable to open the phone app on this device.");
      return;
    }

    await Linking.openURL(url);
  }

  async function onEmailPrimaryContact() {
    const to = String((client as any)?.primaryContactEmail ?? "").trim();
    if (!to) {
      setStatus("No email address available for this contact.");
      return;
    }

    const subject = `Hello${client?.name ? ` ${client.name}` : ""}`;
    const body = "";
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      setStatus("Unable to open mail app on this device.");
      return;
    }

    await Linking.openURL(url);
  }

  return (
    <Screen
      subtitle={
        client
          ? `${client.industry ?? "Industry TBD"} • ${client.status ?? "status"}`
          : `Client ID: ${formatClientId(clientId)}`
      }
      statusText={status}
      contentInsetClassName="px-1"
    >
      <Card>
        <View>
          <View className="flex-row items-start">
            <View className="items-start">
              <View className="h-[90px] w-[90px]" style={{ position: "relative" }}>
                <View
                  className="absolute top-0 left-0 rounded-md bg-gray-900"
                  style={{ paddingHorizontal: 6, paddingVertical: 2 }}
                >
                  <Text className="text-[10px] font-semibold text-white">#{formatClientId(client?.id ?? clientId)}</Text>
                </View>

                <View className="h-[90px] w-[90px] rounded-full bg-gray-100 border border-gray-200 items-center justify-center">
                  <Text className="text-4xl font-semibold opacity-80">{getInitials(client?.name ?? "")}</Text>
                </View>
              </View>

              <Text className="text-xl font-semibold mt-4" numberOfLines={1}>
                {formatMonthlyCost((client as any)?.monthlyCost)}
              </Text>
              <Text className="text-xs opacity-70 mt-2">
                {formatCostLine("Domain", (client as any)?.domainYearlyCost, "/yr")}
              </Text>
              <Text className="text-xs opacity-70 mt-1">
                {formatCostLine("Email", (client as any)?.emailMonthlyCost, "/mo")}
              </Text>
            </View>

            <View className="flex-1 ml-4">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-xl font-semibold flex-1" numberOfLines={1}>
                  {client?.name ?? `Client ${formatClientId(clientId)}`}
                </Text>

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => navigation.navigate("ClientContract", { clientId: Number(clientId) })}
                    hitSlop={10}
                    className="h-10 w-10 rounded-full border border-gray-200 bg-white items-center justify-center"
                  >
                    <Ionicons name="document-text-outline" size={18} color="#111827" />
                  </Pressable>
                  {isAdmin ? (
                    <Pressable
                      onPress={() => setIsInvoiceOpen(true)}
                      hitSlop={10}
                      className="h-10 w-10 rounded-full border border-gray-200 bg-white items-center justify-center"
                    >
                      <Ionicons name="receipt-outline" size={18} color="#111827" />
                    </Pressable>
                  ) : null}
                  {isAdmin ? (
                    <Pressable
                      onPress={() => setIsEditOpen(true)}
                      hitSlop={10}
                      className="h-10 w-10 rounded-full border border-gray-200 bg-white items-center justify-center"
                    >
                      <Ionicons name="create-outline" size={18} color="#111827" />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View className="flex-row flex-wrap gap-2 mt-2">
                <Badge label={client?.status ?? "status"} />
                <Badge label={client?.stage ?? "Speaking"} />
              </View>

              <View className="mt-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2 pr-2">
                    {services.map((label) => (
                      <ServicePill
                        key={label}
                        label={normalizeServiceLabel(label)}
                        onPress={(() => {
                          if (!isAdmin) return undefined;
                          const route = routeForServiceLabel(label);
                          if (!route) return undefined;
                          return () => navigation.navigate(route as any, { clientId: Number(clientId) } as any);
                        })()}
                        disabled={!isAdmin || !routeForServiceLabel(label)}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className="mt-2 rounded-2xl border border-gray-200 bg-white p-3">
                <View className="flex-row items-start justify-between" style={{ minWidth: 0 }}>
                  <Text className="text-xs font-semibold opacity-70">Primary contact</Text>
                  {String((client as any)?.primaryContactRole ?? (client as any)?.ownerRole ?? "").trim() ? (
                    <Badge label={String((client as any)?.primaryContactRole ?? (client as any)?.ownerRole ?? "").trim()} />
                  ) : null}
                </View>

                <Text className="text-sm font-semibold mt-2" numberOfLines={1}>
                  {(client as any)?.primaryContactName ?? "TBD"}
                </Text>

                <View className="mt-2 gap-3">
                  <View className="flex-row items-center" style={{ minWidth: 0 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Call primary contact"
                      hitSlop={10}
                      onPress={onCallPrimaryContact}
                      disabled={!digitsOnly((client as any)?.primaryContactPhone ?? "")}
                      className={
                        digitsOnly((client as any)?.primaryContactPhone ?? "")
                          ? "h-8 w-8 rounded-full border border-gray-200 bg-white items-center justify-center"
                          : "h-8 w-8 rounded-full border border-gray-200 bg-white items-center justify-center opacity-40"
                      }
                    >
                      <Ionicons name="call-outline" size={16} color="#111827" />
                    </Pressable>
                    <Text
                      className="text-xs font-semibold opacity-80 ml-3"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{ flex: 1 }}
                    >
                      {formatPhoneAsYouType((client as any)?.primaryContactPhone ?? "") || "TBD"}
                    </Text>
                  </View>
                  <View className="flex-row items-center" style={{ minWidth: 0 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Email primary contact"
                      hitSlop={10}
                      onPress={onEmailPrimaryContact}
                      disabled={!String((client as any)?.primaryContactEmail ?? "").trim()}
                      className={
                        String((client as any)?.primaryContactEmail ?? "").trim()
                          ? "h-8 w-8 rounded-full border border-gray-200 bg-white items-center justify-center"
                          : "h-8 w-8 rounded-full border border-gray-200 bg-white items-center justify-center opacity-40"
                      }
                    >
                      <Ionicons name="mail-outline" size={16} color="#111827" />
                    </Pressable>
                    <Text
                      className="text-xs font-semibold opacity-80 ml-3"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{ flex: 1 }}
                    >
                      {(client as any)?.primaryContactEmail ?? "TBD"}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-3 rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <ListRow
                  title="Expenses & fees"
                  subtitle="Overhead, pass-through costs, processing fee"
                  right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                  onPress={() => navigation.navigate("ClientExpenses", { clientId: Number(clientId) })}
                />
              </View>
            </View>
          </View>
        </View>

        <View className="mt-4">
          <View className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <View className="px-4 py-3">
              <NotesFeed clientId={Number(clientId)} compact />
            </View>

            <View className="mt-3">
              {(services ?? []).length ? (
                <View className="flex-row flex-wrap gap-2">
                  {(services ?? []).map((s) => (
                    <Badge key={String(s.id)} label={s.service_name || "Service"} />
                  ))}
                </View>
              ) : (
                <Text className="text-sm opacity-70">Services: Not set</Text>
              )}
            </View>

            <Text className="text-sm opacity-70 mt-3">{String(client?.address ?? "Not set")}</Text>
            <Text className="text-sm opacity-70 mt-1">{String(client?.phone ?? "Not set")}</Text>

            <View className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
              <Text className="text-sm font-semibold">Primary contact</Text>
              <Text className="text-sm font-semibold mt-1">{String(primaryContact?.name ?? "Not set")}</Text>
              {primaryContact?.role ? (
                <Text className="text-xs opacity-70 mt-1">{String(primaryContact?.role)}</Text>
              ) : null}

              <View className="mt-3" style={{ gap: 8 }}>
                <View className="flex-row items-center" style={{ gap: 10 }}>
                  <Ionicons name="call-outline" size={16} />
                  <Text className="text-sm opacity-70">{String(primaryContact?.phone ?? "Not set")}</Text>
                </View>
                <View className="flex-row items-center" style={{ gap: 10 }}>
                  <Ionicons name="mail-outline" size={16} />
                  <Text className="text-sm opacity-70">{String(primaryContact?.email ?? "Not set")}</Text>
                </View>
              </View>
            </View>

            <View className="mt-3">
              <Text className="text-[10px] opacity-70" numberOfLines={1}>
                {(() => {
                  const v = asMoney(firstService?.domain_yearly_cost);
                  return `Domain: ${v}${v !== "Not set" ? "/yr" : ""}`;
                })()}
              </Text>
              <Text className="text-[10px] opacity-70 mt-1" numberOfLines={1}>
                {(() => {
                  const v = asMoney(firstService?.email_monthly_cost);
                  return `Email: ${v}${v !== "Not set" ? "/mo" : ""}`;
                })()}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <Modal
        visible={quickNoteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickNoteOpen(false)}
      >
        <Pressable className="flex-1 bg-black/40 px-4 justify-center" onPress={() => setQuickNoteOpen(false)}>
          <Pressable
            className="rounded-2xl border border-gray-200 bg-white p-4"
            onPress={(e) => {
              e.stopPropagation();
            }}
          >
            <Text className="text-base font-semibold">Add note</Text>

            <View className="mt-3">
              <FloatingLabelInput
                label="Title"
                value={quickNoteTitle}
                onChangeText={setQuickNoteTitle}
                placeholder="e.g. Kickoff recap"
              />
            </View>

            <View className="mt-3">
              <FloatingLabelInput
                label="Details"
                value={quickNoteBody}
                onChangeText={setQuickNoteBody}
                placeholder="Optional"
                multiline
                className="min-h-[80px]"
              />
            </View>

            <View className="mt-4 flex-row justify-between gap-3">
              <Pressable
                onPress={() => setQuickNoteOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 items-center"
              >
                <Text className="text-sm font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onSaveQuickNote}
                disabled={!canSaveQuickNote}
                className={`flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 items-center ${
                  !canSaveQuickNote ? "opacity-60" : ""
                }`}
              >
                <Text className="text-sm font-semibold">Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Card>
        <SectionHeader title="Contracts" variant="card" />
        <View className="mt-2">
          <ListRow
            title="Contract workflow"
            subtitle="Templates → placeholders → send → status"
            right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
            onPress={() => navigation.navigate("ClientContract", { clientId: Number(clientId) })}
          />
        </View>
      </Card>

      {isAdmin && enabledModules.length ? (
        <Card>
          <SectionHeader title="Marketing Engine" variant="card" />
          <View className="mt-2">
            <Text className="text-sm opacity-70 mb-3">
              Modules enabled for this client.
            </Text>

            <View>
              {enabledModules.some((m) => m.key === "seo") ? (
                <ListRow
                  title="SEO Revenue Engine"
                  subtitle="Keywords, content strategy, technical SEO"
                  right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                  onPress={() => navigation.navigate("ClientSEOEngine", { clientId: Number(clientId) })}
                />
              ) : null}

              {enabledModules.some((m) => m.key === "social") ? (
                <ListRow
                  title="Social Media Management"
                  subtitle="Posts, campaigns, community"
                  right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                  onPress={() => navigation.navigate("ClientSocialEngine", { clientId: Number(clientId) })}
                />
              ) : null}

              {enabledModules.some((m) => m.key === "ads") ? (
                <ListRow
                  title="Paid Ads Management"
                  subtitle="Meta/TikTok, creative testing"
                  right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                  onPress={() => navigation.navigate("ClientAdsEngine", { clientId: Number(clientId) })}
                />
              ) : null}

              {enabledModules.some((m) => m.key === "email") ? (
                <ListRow
                  title="Email Engine"
                  subtitle="Contacts → audiences → templates → campaigns → automations"
                  right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                  onPress={() => navigation.navigate("ClientEmailEngine", { clientId: Number(clientId) })}
                />
              ) : null}

              {enabledModules.some((m) => m.key === "retention") ? (
                <ListRow
                  title="Retention Engine"
                  subtitle="Retention offers, flows, and winback"
                  right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                  onPress={() => navigation.navigate("ClientRetentionEngine", { clientId: Number(clientId) })}
                />
              ) : null}

              {enabledModules.some((m) => m.key === "reporting") ? (
                <ListRow
                  title="Reporting & Strategy"
                  subtitle="Reports, insights, action plans"
                  right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                  onPress={() => navigation.navigate("ClientReporting", { clientId: Number(clientId) })}
                />
              ) : null}
            </View>
          </View>
        </Card>
      ) : null}

      <Card>
        <SectionHeader
          title="Analytics"
          right={
            analyticsTab === "social" ? (
              <View className="flex-row gap-2">
                <Pressable
                  onPress={openMetaConnect}
                  className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
                >
                  <Text className="text-sm font-semibold">{metaConnection ? "Edit" : "Connect"}</Text>
                </Pressable>
                <Pressable
                  onPress={refreshMeta}
                  disabled={!metaConnection?.id || metaRefreshing}
                  className={`rounded-lg border border-gray-200 px-3 py-2 ${
                    !metaConnection?.id || metaRefreshing ? "bg-gray-100 opacity-60" : "bg-white"
                  }`}
                >
                  <Text className="text-sm font-semibold">{metaRefreshing ? "Refreshing..." : "Refresh"}</Text>
                </Pressable>
              </View>
            ) : null
          }
        />

        <View className="mt-3">
          <View className="rounded-xl border border-gray-200 bg-gray-100 p-1 flex-row">
            <Pressable
              onPress={() => setAnalyticsTab("web")}
              className={`flex-1 rounded-lg px-3 py-2 items-center ${analyticsTab === "web" ? "bg-white" : ""}`}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="globe-outline" size={16} />
                <Text className="text-sm font-semibold">Web</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setAnalyticsTab("social")}
              className={`flex-1 rounded-lg px-3 py-2 items-center ${analyticsTab === "social" ? "bg-white" : ""}`}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="people-outline" size={16} />
                <Text className="text-sm font-semibold">Social</Text>
              </View>
            </Pressable>
          </View>

          <View className="mt-3">
            {analyticsTab === "social" ? (
              <View className="rounded-xl border border-gray-200 bg-white p-3 mb-4">
                <View className="flex-row items-center justify-between">
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text className="text-sm font-semibold">Meta (Instagram + Facebook)</Text>
                    <Text className="text-xs opacity-70 mt-1" numberOfLines={2}>
                      {metaConnection
                        ? metaConnection.enabled
                          ? "Connected"
                          : "Disabled"
                        : "Not connected"}
                      {metaConnection?.last_synced_at
                        ? ` • Last sync ${new Date(String(metaConnection.last_synced_at)).toLocaleString()}`
                        : ""}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {(services ?? []).length ? (
              <View className="gap-3">
                {(services ?? []).map((svc) => (
                  <View
                    key={String(svc.id)}
                    className="rounded-xl border border-gray-200 bg-white p-3"
                  >
                    <Text className="text-sm font-semibold">{svc.service_name || "Service"}</Text>
                    {svc.website_url ? (
                      <Text className="text-xs opacity-70 mt-1" numberOfLines={2}>
                        {String(svc.website_url)}
                      </Text>
                    ) : null}

                    <View className="mt-3">
                      {analyticsTab === "web" ? (
                        <View>
                          <ListRow
                            title="Visitors (30d)"
                            subtitle={String(
                              svc.website_analytics?.visitors_30d ??
                                svc.website_analytics?.users_30d ??
                                "Not set"
                            )}
                          />
                          <ListRow
                            title="Pageviews (30d)"
                            subtitle={String(svc.website_analytics?.pageviews_30d ?? "Not set")}
                          />

                          {(() => {
                            const raw =
                              svc.website_analytics?.top_links ??
                              svc.website_analytics?.topLinks ??
                              svc.website_analytics?.top_links_30d ??
                              null;
                            const arr = Array.isArray(raw) ? raw : [];
                            const normalized = arr
                              .map((item: any) => {
                                const url = String(item?.url ?? item?.href ?? item?.link ?? item?.path ?? "").trim();
                                const clicksRaw = item?.clicks ?? item?.count ?? item?.click_count;
                                const clicks = typeof clicksRaw === "number" ? clicksRaw : Number(clicksRaw);
                                return { url, clicks };
                              })
                              .filter((x: any) => x.url && Number.isFinite(x.clicks))
                              .sort((a: any, b: any) => Number(b.clicks) - Number(a.clicks))
                              .slice(0, 5);

                            if (!normalized.length) return null;

                            return (
                              <View className="mt-2">
                                <Text className="text-xs opacity-70 mt-2">Top links (clicks)</Text>
                                <View className="mt-1">
                                  {normalized.map((x: any) => (
                                    <ListRow
                                      key={x.url}
                                      title={x.url}
                                      subtitle={String(x.clicks)}
                                    />
                                  ))}
                                </View>
                              </View>
                            );
                          })()}
                        </View>
                      ) : (
                        <View>
                          <ListRow
                            title="Followers"
                            subtitle={String(
                              svc.social_analytics?.followers ??
                                svc.social_analytics?.meta?.instagram?.followers ??
                                svc.social_analytics?.meta?.facebook?.followers ??
                                "Not set"
                            )}
                          />
                          <ListRow
                            title="Impressions (30d)"
                            subtitle={String(
                              svc.social_analytics?.impressions_30d ??
                                svc.social_analytics?.meta?.instagram?.impressions_30d ??
                                svc.social_analytics?.meta?.facebook?.impressions_30d ??
                                "Not set"
                            )}
                          />
                          <ListRow
                            title="Engagement rate (30d)"
                            subtitle={
                              svc.social_analytics?.engagement_rate_30d != null
                                ? `${Math.round(Number(svc.social_analytics.engagement_rate_30d) * 1000) / 10}%`
                                : "Not set"
                            }
                          />
                        </View>
                      )}
                    </View>
                  </View>
                ))}

                {analyticsTab === "web" &&
                !(services ?? []).some((s) => Boolean(String(s.website_url ?? "").trim())) ? (
                  <View className="py-6">
                    <Text className="opacity-70">No websites saved yet.</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View className="py-6">
                <Text className="opacity-70">No services yet.</Text>
              </View>
            )}
          </View>
        </View>
      </Card>

      <Card>
        <FileManager clientId={Number(clientId)} />
      </Card>

      <StackModal
        overlayKey="client-details:edit"
        visible={isEditOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditOpen(false)}
      >
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setIsEditOpen(false)}>
          <KeyboardAvoidingView
            behavior="padding"
            className="flex-1 justify-center py-10"
          >
            <Pressable
              style={{ maxHeight: Math.max(420, windowHeight * 0.88) }}
              className="bg-white rounded-3xl border border-gray-200 w-full overflow-hidden"
              onPress={() => {}}
            >
              <View className="px-5 pt-5 pb-3 border-b border-gray-100">
                <Text className="text-xl font-semibold">Edit Client</Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}
              >
                <View className="gap-3">
                  <FieldBox
                    label="Industry"
                    value={editIndustry}
                    editable
                    onChangeText={setEditIndustry}
                  />

                  <FieldBox
                    label="Status"
                    value={editStatusValue || ""}
                    onPress={() => setStatusPickerOpen(true)}
                    right={<Ionicons name="chevron-down" size={18} color="#6B7280" />}
                  />

                  <FieldBox
                    label="Role"
                    value={editOwnerRole}
                    onPress={() => setOwnerPickerOpen(true)}
                    right={<Ionicons name="chevron-down" size={18} color="#6B7280" />}
                  />

                  <FieldBox
                    label="Service"
                    value={editService}
                    onPress={() => setServicePickerOpen(true)}
                    right={<Ionicons name="chevron-down" size={18} color="#6B7280" />}
                  />

                  <FieldBox
                    label="Website"
                    value={editWebsite}
                    editable
                    onChangeText={setEditWebsite}
                  />

                  <FieldBox
                    label="Primary contact"
                    value={editPrimaryContactName}
                    editable
                    onChangeText={setEditPrimaryContactName}
                  />

                  <FieldBox
                    label="Primary contact phone"
                    value={editPrimaryContactPhone}
                    editable
                    onChangeText={(v) => setEditPrimaryContactPhone(formatPhoneAsYouType(v))}
                    keyboardType="phone-pad"
                  />

                  <FieldBox
                    label="Primary contact email"
                    value={editPrimaryContactEmail}
                    editable
                    onChangeText={setEditPrimaryContactEmail}
                    keyboardType="email-address"
                  />

                  <FieldBox
                    label="Domain yearly cost"
                    value={editDomainYearlyCost}
                    editable
                    onChangeText={setEditDomainYearlyCost}
                    keyboardType="decimal-pad"
                  />

                  <FieldBox
                    label="Email monthly cost"
                    value={editEmailMonthlyCost}
                    editable
                    onChangeText={setEditEmailMonthlyCost}
                    keyboardType="decimal-pad"
                  />

                  <FieldBox
                    label="Monthly retainer"
                    value={editMonthlyRetainer}
                    editable
                    onChangeText={setEditMonthlyRetainer}
                    keyboardType="decimal-pad"
                  />

                  <DateTimeField
                    label="Start date"
                    mode="date"
                    value={editStartDate}
                    onChange={setEditStartDate}
                    placeholder="Select"
                    allowClear={false}
                  />

                  <DateTimeField
                    label="End date"
                    mode="date"
                    value={editEndDate}
                    onChange={setEditEndDate}
                    placeholder="Select"
                    allowClear={false}
                  />
                </View>
              </ScrollView>

              <View className="flex-row gap-3 px-5 py-4 border-t border-gray-100">
                <Pressable
                  onPress={() => setIsEditOpen(false)}
                  className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 py-4 items-center"
                  hitSlop={10}
                >
                  <Text className="text-base font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    (async () => {
                      if (!client) return;
                      try {
                        setStatus(null);
                        setSaving(true);

                        const nextMonthly = Number(editMonthlyRetainer);
                        const nextDomain = Number(editDomainYearlyCost);
                        const nextEmail = Number(editEmailMonthlyCost);

                        const nextClientPayload: any = {
                          name: client.name,
                          logo_url: (client as any).logo_url ?? "",
                          brand_colors: (client as any).brand_colors ?? {},
                          industry: editIndustry,
                          status: editStatusValue,
                          stage: client.stage ?? "",
                          service: editService,
                          owner_role: editOwnerRole,
                          website: editWebsite,
                          monthly_cost: Number.isFinite(nextMonthly) ? nextMonthly : null,
                          domain_yearly_cost: Number.isFinite(nextDomain) ? nextDomain : null,
                          email_monthly_cost: Number.isFinite(nextEmail) ? nextEmail : null,
                          start_date: editStartDate || null,
                          end_date: editEndDate || null
                        };

                        const updatedClientRes = await endpoints.clients.update(Number(clientId), nextClientPayload);
                        const updatedRaw = updatedClientRes.data;

                        const contactHasAny =
                          editPrimaryContactName.trim() ||
                          editPrimaryContactEmail.trim() ||
                          editPrimaryContactPhone.trim();

                        let updatedPrimary: Contact | null = primaryContact;

                        if (contactHasAny) {
                          if (!editPrimaryContactName.trim()) {
                            throw new Error("Primary contact name is required if you add contact info");
                          }

                          if (primaryContact?.id) {
                            const upd = await endpoints.contacts.update(primaryContact.id, {
                              id: primaryContact.id,
                              client: Number(clientId),
                              name: editPrimaryContactName.trim(),
                              email: editPrimaryContactEmail.trim(),
                              phone: editPrimaryContactPhone.trim(),
                              role: String(primaryContact.role ?? "").trim(),
                              is_primary: true
                            });
                            updatedPrimary = upd.data as Contact;
                          } else {
                            const created = await endpoints.contacts.create({
                              client: Number(clientId),
                              name: editPrimaryContactName.trim(),
                              email: editPrimaryContactEmail.trim(),
                              phone: editPrimaryContactPhone.trim(),
                              role: editOwnerRole.trim(),
                              is_primary: true
                            });
                            updatedPrimary = created.data as Contact;
                          }
                        }

                        setPrimaryContact(updatedPrimary);
                        const normalized = normalizeClient(updatedRaw, updatedPrimary);
                        setClient(normalized);

                        // Keep registered services (ClientService) in sync with the edited service.
                        try {
                          const id = Number(clientId);
                          const nextServiceName = String(editService ?? "").trim();
                          if (nextServiceName) {
                            const existing = (clientServices ?? []).filter(isActiveService);
                            const toUpdate = existing[0] ?? (clientServices ?? [])[0];
                            if (toUpdate?.id) {
                              const upd = await endpoints.clientServices.update(toUpdate.id, {
                                id: toUpdate.id,
                                client: id,
                                service_name: nextServiceName,
                                start_date: toUpdate.start_date ?? null,
                                end_date: toUpdate.end_date ?? null
                              });
                              const updated = upd.data as ClientServiceRecord;
                              setClientServices((prev) => {
                                const rest = (prev ?? []).filter((s) => s.id !== updated.id);
                                return [...rest, updated].sort((a, b) => a.id - b.id);
                              });
                            } else {
                              const created = await endpoints.clientServices.create({
                                client: id,
                                service_name: nextServiceName,
                                start_date: editStartDate.trim() || null,
                                end_date: null
                              });
                              const createdSvc = created.data as ClientServiceRecord;
                              setClientServices((prev) => [...(prev ?? []), createdSvc].sort((a, b) => a.id - b.id));
                            }
                          }
                        } catch {
                          // Non-fatal: client save succeeded even if service sync fails.
                        }

                        setInvoiceTo(String((normalized as any)?.primaryContactEmail ?? ""));
                        setInvoiceAmount(formatMoney((normalized as any)?.monthlyCost ?? ""));
                        setInvoiceDueDate(String((normalized as any)?.endDate ?? (normalized as any)?.startDate ?? ""));

                        setIsEditOpen(false);
                      } catch (e: any) {
                        setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to save client");
                      } finally {
                        setSaving(false);
                      }
                    })();
                  }}
                  disabled={saving}
                  className={`flex-1 rounded-2xl border border-gray-200 bg-white py-4 items-center ${saving ? "opacity-60" : ""}`}
                  hitSlop={10}
                >
                  <Text className="text-base font-semibold">Save</Text>
                </Pressable>
              </View>

            <PickerModal
              open={statusPickerOpen}
              title="Status"
              options={[{ label: "", value: "" }, ...(CLIENT_STATUS_OPTIONS as any)]}
              onSelect={setEditStatusValue}
              onClose={() => setStatusPickerOpen(false)}
              overlayKey="client-details:edit-status"
            />

            <PickerModal
              open={ownerPickerOpen}
              title="Role"
              options={ROLE_OPTIONS as any}
              onSelect={setEditOwnerRole}
              onClose={() => setOwnerPickerOpen(false)}
              overlayKey="client-details:edit-owner-role"
            />

            <PickerModal
              open={servicePickerOpen}
              title="Service"
              options={SERVICE_OPTIONS as any}
              onSelect={setEditService}
              onClose={() => setServicePickerOpen(false)}
              overlayKey="client-details:edit-service"
            />
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </StackModal>

      <StackModal
        overlayKey="client-details:invoice"
        visible={isInvoiceOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsInvoiceOpen(false)}
      >
        <Pressable className="flex-1 bg-black/50 px-4" onPress={() => setIsInvoiceOpen(false)}>
          <KeyboardAvoidingView behavior="padding" className="flex-1 justify-center py-10">
            <Pressable
              style={{ maxHeight: Math.max(420, windowHeight * 0.82) }}
              className="bg-white rounded-3xl border border-gray-200 w-full overflow-hidden"
              onPress={() => {}}
            >
              <View className="px-5 pt-5 pb-3 border-b border-gray-100">
                <Text className="text-xl font-semibold">Invoice Portal</Text>
                <Text className="text-xs opacity-70 mt-1">Create & send an invoice (Stripe later)</Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}
              >
                <View className="gap-3">
                  <FieldBox
                    label="Send to (email)"
                    value={invoiceTo}
                    editable
                    onChangeText={setInvoiceTo}
                    keyboardType="email-address"
                  />

                  <FieldBox
                    label="Amount"
                    value={invoiceAmount}
                    editable
                    onChangeText={setInvoiceAmount}
                    keyboardType="decimal-pad"
                  />

                  <DateTimeField
                    label="Due date"
                    mode="date"
                    value={invoiceDueDate}
                    onChange={setInvoiceDueDate}
                    placeholder="Select"
                    allowClear
                  />

                  <FloatingLabelInput
                    label="Notes"
                    value={invoiceNotes}
                    onChangeText={setInvoiceNotes}
                    placeholder="Optional"
                    multiline
                    style={{ minHeight: 90, textAlignVertical: "top" }}
                  />
                </View>
              </ScrollView>

              <View className="flex-row gap-3 px-5 py-4 border-t border-gray-100">
                <Pressable
                  onPress={() => setIsInvoiceOpen(false)}
                  className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 py-4 items-center"
                  hitSlop={10}
                >
                  <Text className="text-base font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onSendInvoiceEmail}
                  className="flex-1 rounded-2xl border border-gray-200 bg-white py-4 items-center"
                  hitSlop={10}
                >
                  <Text className="text-base font-semibold">Send</Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </StackModal>
    </Screen>
  );
}

*/

import React from "react";
import { View, Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "../../App";
import { Card, ListRow, Screen, SectionHeader } from "../components/ui";
import { endpoints } from "../services/endpoints";
import { listWithFallback } from "../services/safeApi";
import { mockClients } from "../services/mockData";
import NotesFeed from "../components/NotesFeed";
import FileManager from "../components/FileManager";

type Client = {
  id: number;
  name: string;
  industry?: string;
  status?: string;
  website?: string;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ClientRoute = RouteProp<RootStackParamList, "ClientDetails">;

export default function ClientDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ClientRoute>();
  const clientId = Number(route.params?.clientId);

  const [client, setClient] = React.useState<Client | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function refresh() {
    if (!Number.isFinite(clientId)) return;
    if (busy) return;
    setBusy(true);
    try {
      setStatus(null);
      const res = await endpoints.clients.get(clientId);
      const data = res?.data ?? null;
      if (data) {
        setClient({
          id: Number((data as any).id ?? clientId),
          name: String((data as any).name ?? `Client #${clientId}`),
          industry: (data as any).industry,
          status: (data as any).status,
          website: (data as any).website
        });
      } else {
        setClient(null);
      }
    } catch (e: any) {
      // Fallback to local mock data (useful in demo/offline mode)
      const fallbackRes = await listWithFallback<any>(endpoints.clients.list, mockClients);
      const list: any[] = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
      const found = list.find((c) => Number(c?.id) === clientId) ?? null;
      setClient(
        found
          ? {
              id: Number(found.id),
              name: String(found.name ?? `Client #${clientId}`),
              industry: found.industry,
              status: found.status,
              website: found.website
            }
          : null
      );
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to load client");
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const title = client?.name ?? `Client #${clientId}`;
  const subtitle = [client?.industry, client?.status].filter(Boolean).join(" • ");

  return (
    <Screen subtitle={subtitle} statusText={status}>
      <Card>
        <SectionHeader
          title={title}
          actionLabel={busy ? "Loading…" : "Refresh"}
          onPressAction={refresh}
        />

        <View className="mt-3">
          <ListRow
            title="Tasks"
            subtitle="View and manage tasks"
            right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
            onPress={() => navigation.navigate("Tasks")}
          />
          <ListRow
            title="Expenses"
            subtitle="Client expenses"
            right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
            onPress={() => navigation.navigate("ClientExpenses", { clientId })}
          />
          <ListRow
            title="Reporting"
            subtitle="Client reporting"
            right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
            onPress={() => navigation.navigate("ClientReporting", { clientId })}
          />
          <ListRow
            title="Contract"
            subtitle="Contract templates & signature"
            right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
            onPress={() => navigation.navigate("ClientContract", { clientId })}
          />
        </View>
      </Card>

      <Card title="Notes">
        <NotesFeed clientId={clientId} />
      </Card>

      <Card title="Files">
        <FileManager clientId={clientId} />
      </Card>
    </Screen>
  );
}
