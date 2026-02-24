/*
LEGACY ClientsScreen.tsx

This file previously contained merged/duplicated code that broke `tsc --noEmit`.
The legacy implementation is temporarily kept here (commented out) so we can
refactor safely while keeping typecheck green.
*/

/*
// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, useWindowDimensions, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { endpoints } from "../services/endpoints";
import type { RootStackParamList } from "../../App";
import { listWithFallback } from "../services/safeApi";
import { mockClients } from "../services/mockData";
import { Badge, Card, FloatingLabelInput, ListRow, ModalSurface, Screen, SectionHeader, SelectField, StackModal, type SelectOption } from "../components/ui";
import { formatPhoneAsYouType } from "../utils/phone";
import { CLIENT_STATUS_OPTIONS, ROLE_OPTIONS, SERVICE_OPTIONS } from "../constants/options";

type Client = {
  id: number;
  name: string;
  industry?: string;
  status?: string;
  stage?: string;
  service?: string;
  monthlyCost?: number;
};

const INDUSTRIES = [
  "Accounting",
  "Construction",
  "Consulting",
  "Education",
  "E-commerce",
  "Finance",
  "Government",
  "Healthcare",
  "Hospitality",
  "Legal",
  "Manufacturing",
  "Marketing",
  "Nonprofit",
  "Real Estate",
  "Retail",
  "Technology",
  "Other"
] as const;

const CLIENT_STATUSES = ["Active", "Prospect", "Paused", "Archived"] as const;

const CONTACT_ROLES = [
  "Owner",
  "Founder",
  "CEO",
  "COO",
  "CFO",
  "CTO",
  "Manager",
  "Director",
  "Marketing",
  "Operations",
  "Finance",
  "HR",
  "Assistant",
  "Other"
] as const;

const SERVICE_OPTIONS = Array.from(
  new Set(
    [
      ...mockClientServices.map((s) => s.service_name),
      "Social media management",
      "Website refresh",
      "Email marketing",
      "SEO",
      "Content creation",
      "Paid ads",
      "Branding",
      "Other"
    ]
      .map((s) => String(s).trim())
      .filter(Boolean)
  )
);

function formatDateForApi(d: Date | null): string {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseApiDate(raw: string): Date | null {
  const v = String(raw || "").trim();
  if (!v) return null;
  const m = /^\d{4}-\d{2}-\d{2}$/.exec(v);
  if (!m) return null;
  const [y, mo, d] = v.split("-").map((n) => Number(n));
  const dt = new Date(y, mo - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
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

export default function ClientsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  function openClient(clientId: number) {
    navigation.navigate("ClientDetails", { clientId });
  }

  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [clients, setClients] = useState<Client[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [newIndustries, setNewIndustries] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [newBrandColorsCsv, setNewBrandColorsCsv] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRole, setContactRole] = useState("");

  const [serviceNames, setServiceNames] = useState<string[]>([]);
  const [serviceStartDate, setServiceStartDate] = useState<Date | null>(null);
  const [serviceEndDate, setServiceEndDate] = useState<Date | null>(null);

  const [industryPickerOpen, setIndustryPickerOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [datePicker, setDatePicker] = useState<null | "start" | "end">(null);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);

  const [logoUploading, setLogoUploading] = useState(false);
  const [creating, setCreating] = useState(false);

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

      // In mock/demo mode we just store the local URI for preview.
      if (shouldUseMock()) {
        setNewLogoUrl(uri);
        return;
      }

      // In real mode we can only upload after the client exists. Store the local URI for later.
      setNewLogoUrl(uri);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to pick image");
    }
  }

  const swipeRefs = useRef<Record<number, Swipeable | null>>({});

  const sortedClients = useMemo(() => {
    return clients.slice().sort((a, b) => Number(a.id) - Number(b.id));
  }, [clients]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedClients;
    return sortedClients.filter((c) => {
      const name = String(c.name ?? "").toLowerCase();
      const industry = String(c.industry ?? "").toLowerCase();
      const status = String(c.status ?? "").toLowerCase();
      return name.includes(q) || industry.includes(q) || status.includes(q);
    });
  }, [sortedClients, searchQuery]);

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");
  const [clientStatus, setClientStatus] = useState("");
  const [clientOwnerRole, setClientOwnerRole] = useState("Owner");
  const [clientLogoUrl, setClientLogoUrl] = useState("");
  const [clientPrimaryColor, setClientPrimaryColor] = useState("");

  const [primaryContactName, setPrimaryContactName] = useState("");
  const [primaryContactEmail, setPrimaryContactEmail] = useState("");
  const [primaryContactPhone, setPrimaryContactPhone] = useState("");

  const [serviceName, setServiceName] = useState("");
  const [serviceStartDate, setServiceStartDate] = useState("");

  const statusOptions: SelectOption[] = [{ label: "", value: "" }, ...CLIENT_STATUS_OPTIONS];
  const roleOptions: SelectOption[] = [...ROLE_OPTIONS];
  const serviceOptions: SelectOption[] = [{ label: "", value: "" }, ...SERVICE_OPTIONS];

  const canCreateClient = useMemo(() => clientName.trim().length > 0, [clientName]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus(null);
        const res = await listWithFallback<Client>(endpoints.clients.list, mockClients);
        if (!active) return;
        setClients(res.data);
        if (res.error) setStatus(res.error);
      } catch (e: any) {
        if (!active) return;
        setClients(mockClients);
        setStatus(e?.message ?? "Unable to load clients");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function openOnboarding() {
    setStatus(null);
    setOnboardingOpen(true);
  }

  function resetOnboardingForm() {
    setClientName("");
    setClientIndustry("");
    setClientStatus("");
    setClientOwnerRole("Owner");
    setClientLogoUrl("");
    setClientPrimaryColor("");
    setPrimaryContactName("");
    setPrimaryContactEmail("");
    setPrimaryContactPhone("");
    setServiceName("");
    setServiceStartDate("");
  }

  async function pickLogoImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setStatus("Permission required to pick an image");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85
      });

      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      setClientLogoUrl(uri);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to pick image");
    }
  }

  async function createClientOnboarding() {
    if (!canCreateClient) return;
    try {
      setStatus(null);
      setBusy(true);

      const brand_colors = clientPrimaryColor.trim()
        ? { primary: clientPrimaryColor.trim() }
        : {};

      const rawLogo = clientLogoUrl.trim();
      const logo_url = /^https?:\/\//i.test(rawLogo) ? rawLogo : "";

      const createdClientRes = await endpoints.clients.create({
        name: clientName.trim(),
        industry: clientIndustry.trim(),
        status: clientStatus.trim(),
        owner_role: clientOwnerRole.trim(),
        logo_url,
        brand_colors
      });

      const createdClient = createdClientRes.data as Client;
      if (!logo_url && rawLogo) {
        // Keep local image preview for this session even though the backend requires a real URL.
        (createdClient as any).logo_url = rawLogo;
      }

      const contactHasAny =
        primaryContactName.trim() ||
        primaryContactEmail.trim() ||
        primaryContactPhone.trim();

      if (contactHasAny) {
        if (!primaryContactName.trim()) {
          throw new Error("Primary contact name is required if you add contact info");
        }
        await endpoints.contacts.create({
          client: createdClient.id,
          name: primaryContactName.trim(),
          email: primaryContactEmail.trim(),
          phone: primaryContactPhone.trim(),
          role: clientOwnerRole.trim(),
          is_primary: true
        });
      }

      if (serviceName.trim()) {
        await endpoints.clientServices.create({
          client: createdClient.id,
          service_name: serviceName.trim(),
          start_date: serviceStartDate.trim() || null,
          end_date: null
        });
      }

      setClients((prev) => [createdClient, ...prev]);
      setOnboardingOpen(false);
      resetOnboardingForm();
      navigation.navigate("ClientDetails", { clientId: createdClient.id });
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to create client");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      subtitle="Tap a client to view details."
      statusText={status}
    >
      <Card>
        <SectionHeader
          title="All Clients"
          action={
            <View className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center">
              <Ionicons name="add" size={22} color="#111827" />
            </View>
          }
          onPressAction={openOnboarding}
        />
        <View className="mt-3">
          {clients.length ? (
            <View>
              {clients.map((item, idx) => (
                <View key={String(item.id)}>
                  {idx ? <View className="h-3" /> : null}
                  <ListRow
                    left={
                      <View className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 items-center justify-center">
                        <Text className="text-sm font-semibold opacity-80">
                          {getInitials(item.name)}
                        </Text>
                      </View>
                    }
                    title={item.name}
                    subtitle={`${item.industry ?? "Industry TBD"} • ${item.status ?? "status"}`}
                    right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                    onPress={() => navigation.navigate("ClientDetails", { clientId: item.id })}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View className="py-8">
              <Text className="opacity-70">No clients yet.</Text>
            </View>
          )}
        </View>
      </Card>

      <StackModal
        overlayKey="clients:onboarding"
        visible={onboardingOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setOnboardingOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center"
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
            paddingLeft: 16,
            paddingRight: 16
          }}
          onPress={() => setOnboardingOpen(false)}
        >
          <Pressable
            style={{
              alignSelf: "stretch",
              maxHeight: Math.max(320, windowHeight - (insets.top + insets.bottom + 32))
            }}
            onPress={() => {}}
          >
            <ModalSurface
              title="Add client"
              scroll={false}
              headerRight={
                <Pressable onPress={() => setOnboardingOpen(false)} hitSlop={10}>
                  <Ionicons name="close" size={22} color="#111827" />
                </Pressable>
              }
            >
            <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
              <View className="mt-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-semibold opacity-60">Client logo</Text>

                  <Pressable
                    onPress={() => {
                      setStatus(null);
                      pickLogoImage();
                    }}
                    hitSlop={10}
                    className={busy ? "opacity-50" : ""}
                    disabled={busy}
                  >
                    <View className="flex-row items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2">
                      <Ionicons name="cloud-upload-outline" size={18} color="#111827" />
                      <Text className="text-sm font-semibold">Upload</Text>
                    </View>
                  </Pressable>
                </View>

                <View className="mt-3 flex-row items-center gap-3">
                  <Pressable
                    onPress={() => {
                      setStatus(null);
                      pickLogoImage();
                    }}
                    hitSlop={10}
                    disabled={busy}
                  >
                    <View className="h-14 w-14 rounded-2xl border border-gray-200 bg-gray-50 items-center justify-center overflow-hidden">
                      {clientLogoUrl ? (
                        <Image source={{ uri: clientLogoUrl }} style={{ width: 56, height: 56 }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="image-outline" size={22} color="#6B7280" />
                      )}
                    </View>
                  </Pressable>

                  <View className="flex-1" style={{ minWidth: 0 }}>
                    <Text className="text-sm font-semibold" numberOfLines={1} ellipsizeMode="tail">
                      {clientLogoUrl ? "Logo selected" : "No logo yet"}
                    </Text>
                    <View className="flex-row items-center justify-between mt-1">
                      <Text className="text-xs opacity-70" numberOfLines={1} ellipsizeMode="middle">
                        {clientLogoUrl ? clientLogoUrl : "Tap upload to choose an image"}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3 mt-2">
                      {clientLogoUrl ? (
                        <Pressable onPress={() => setClientLogoUrl("")} hitSlop={10}>
                          <Text className="text-xs font-semibold text-red-600">Remove</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>

              <View className="mt-4">
                <FloatingLabelInput label="Client name" value={clientName} onChangeText={setClientName} placeholder="Client name" />
              </View>

              <View className="mt-3">
                <FloatingLabelInput
                  label="Industry"
                  value={clientIndustry}
                  onChangeText={setClientIndustry}
                  placeholder="e.g. Sports, Fitness"
                />
              </View>

              <View className="mt-3">
                <SelectField
                  label="Status"
                  value={clientStatus}
                  onChange={setClientStatus}
                  options={statusOptions}
                  placeholder="Select"
                />
              </View>

              <View className="mt-3">
                <SelectField
                  label="Role"
                  value={clientOwnerRole}
                  onChange={setClientOwnerRole}
                  options={roleOptions}
                  placeholder="Select"
                />
              </View>

              <View className="mt-3">
                <FloatingLabelInput
                  label="Brand primary color"
                  value={clientPrimaryColor}
                  onChangeText={setClientPrimaryColor}
                  placeholder="#111827"
                  autoCapitalize="none"
                />
              </View>

              <View className="mt-4">
                <Text className="text-xs font-semibold opacity-60">Primary contact (optional)</Text>
              </View>

              <View className="mt-2">
                <FloatingLabelInput
                  label="Name"
                  value={primaryContactName}
                  onChangeText={setPrimaryContactName}
                  placeholder="Full name"
                />
              </View>

              <View className="mt-3">
                <FloatingLabelInput
                  label="Email"
                  value={primaryContactEmail}
                  onChangeText={setPrimaryContactEmail}
                  placeholder="name@company.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View className="mt-3">
                <FloatingLabelInput
                  label="Phone"
                  value={primaryContactPhone}
                  onChangeText={(v) => setPrimaryContactPhone(formatPhoneAsYouType(v))}
                  placeholder="(555) 555-5555"
                  keyboardType="phone-pad"
                />
              </View>

              <View className="mt-4">
                <Text className="text-xs font-semibold opacity-60">Service (optional)</Text>
              </View>

              <View className="mt-2">
                <SelectField
                  label="Service name"
                  value={serviceName}
                  onChange={setServiceName}
                  options={serviceOptions}
                  placeholder="Select"
                />
              </View>

              <View className="mt-3">
                <FloatingLabelInput
                  label="Start date (YYYY-MM-DD)"
                  value={serviceStartDate}
                  onChangeText={setServiceStartDate}
                  placeholder="2026-01-14"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <View className="flex-row justify-end gap-2 p-4 border-t border-gray-100">
              <Pressable onPress={() => setOnboardingOpen(false)}>
                <Badge label="Cancel" />
              </Pressable>
              <Pressable
                onPress={createClientOnboarding}
                disabled={!canCreateClient || busy}
                className={!canCreateClient || busy ? "opacity-50" : ""}
              >
                <Badge label={busy ? "Creating..." : "Create"} />
              </Pressable>
            </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </StackModal>
    </Screen>
  );
}

*/

import React from "react";
import { View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "../../App";
import { Card, ListRow, Screen, SectionHeader } from "../components/ui";
import { endpoints } from "../services/endpoints";
import { listWithFallback } from "../services/safeApi";
import { mockClients } from "../services/mockData";

type Client = {
  id: number;
  name: string;
  industry?: string;
  status?: string;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ClientsScreen() {
  const navigation = useNavigation<Nav>();
  const [clients, setClients] = React.useState<Client[]>([]);
  const [status, setStatus] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const sorted = React.useMemo(
    () => clients.slice().sort((a, b) => Number(a.id) - Number(b.id)),
    [clients]
  );

  async function refresh() {
    if (busy) return;
    setBusy(true);
    try {
      setStatus(null);
      const res = await listWithFallback<Client>(endpoints.clients.list, mockClients);
      setClients(res.data);
      if (res.error) setStatus(res.error);
    } catch (e: any) {
      setClients(mockClients as any);
      setStatus(e?.message ?? "Unable to load clients");
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen subtitle="Tap a client to view details." statusText={status}>
      <Card>
        <SectionHeader
          title="Clients"
          actionLabel={busy ? "Loading…" : "Refresh"}
          onPressAction={refresh}
        />

        <View className="mt-3">
          {sorted.length ? (
            sorted.map((c) => (
              <ListRow
                key={String(c.id)}
                title={c.name}
                subtitle={[c.industry, c.status].filter(Boolean).join(" • ")}
                right={<Ionicons name="chevron-forward" size={20} color="#111827" />}
                onPress={() => navigation.navigate("ClientDetails", { clientId: Number(c.id) })}
              />
            ))
          ) : (
            <View className="py-6">
              <Text className="text-sm opacity-70">No clients yet.</Text>
            </View>
          )}
        </View>
      </Card>
    </Screen>
  );
}
