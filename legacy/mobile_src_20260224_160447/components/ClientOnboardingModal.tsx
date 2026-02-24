import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { endpoints } from "../services/endpoints";
import { Badge, FloatingLabelInput, ModalSurface, SelectField, StackModal, type SelectOption } from "./ui";
import { formatPhoneAsYouType } from "../utils/phone";
import { CLIENT_STATUS_OPTIONS, ROLE_OPTIONS, SERVICE_OPTIONS } from "../constants/options";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (result: { clientId: number; accountId: number | null }) => void;
  defaultAccountId?: number;
};

export function ClientOnboardingModal({ visible, onClose, onCreated, defaultAccountId }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [status, setStatus] = useState<string | null>(null);
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

  const title = defaultAccountId ? "Add business" : "Add client";

  const canCreateClient = useMemo(() => clientName.trim().length > 0, [clientName]);

  function resetForm() {
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
        quality: 0.85,
        base64: false
      });

      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri;
        if (uri) setClientLogoUrl(uri);
      }
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to pick image");
    }
  }

  async function createClient() {
    if (!canCreateClient || busy) return;

    setBusy(true);
    setStatus(null);

    try {
      const payload: any = {
        name: clientName.trim(),
        industry: clientIndustry || "",
        status: clientStatus || "",
        owner_role: clientOwnerRole || "",
        logo_url: clientLogoUrl || "",
        brand_colors: clientPrimaryColor ? { primary: clientPrimaryColor } : {},
        service: serviceName || "",
        stage: "",
        website: "",
        monthly_cost: null,
        domain_yearly_cost: null,
        email_monthly_cost: null,
        start_date: null,
        end_date: null
      };

      if (defaultAccountId) payload.account = defaultAccountId;

      const created = await endpoints.clients.create(payload);
      const clientId: number = created?.data?.id;
      const accountId: number | null = created?.data?.account ?? null;

      if (!clientId) throw new Error("Client creation failed");

      if (primaryContactName.trim()) {
        await endpoints.contacts.create({
          client: clientId,
          name: primaryContactName.trim(),
          email: primaryContactEmail || "",
          phone: primaryContactPhone || "",
          role: clientOwnerRole || "",
          is_primary: true
        });
      }

      if (serviceName.trim()) {
        await endpoints.clientServices.create({
          client: clientId,
          service_name: serviceName.trim(),
          start_date: serviceStartDate || null,
          end_date: null
        });
      }

      resetForm();
      onClose();
      onCreated?.({ clientId, accountId });
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to create client");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StackModal
      overlayKey={defaultAccountId ? `accounts:${defaultAccountId}:add-business` : "accounts:add-client"}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
          paddingLeft: 16,
          paddingRight: 16
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            alignSelf: "stretch",
            maxHeight: Math.max(320, windowHeight - (insets.top + insets.bottom + 32))
          }}
          onPress={() => {}}
        >
          <ModalSurface
            title={title}
            scroll={false}
            headerRight={
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color="#111827" />
              </Pressable>
            }
          >
            <ScrollView
              className="px-4"
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {status ? (
                <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                  <Text className="text-sm text-red-700">{status}</Text>
                </View>
              ) : null}

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
                    {clientLogoUrl ? (
                      <View className="flex-row items-center gap-3 mt-2">
                        <Pressable onPress={() => setClientLogoUrl("")} hitSlop={10}>
                          <Text className="text-xs font-semibold text-red-600">Remove</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View className="mt-4">
                <FloatingLabelInput label="Client name" value={clientName} onChangeText={setClientName} placeholder="Client name" />
              </View>

              <View className="mt-3">
                <FloatingLabelInput label="Industry" value={clientIndustry} onChangeText={setClientIndustry} placeholder="Industry" />
              </View>

              <View className="mt-3">
                <SelectField label="Status" value={clientStatus} onChange={setClientStatus} options={statusOptions} placeholder="Select" />
              </View>

              <View className="mt-3">
                <SelectField label="Role" value={clientOwnerRole} onChange={setClientOwnerRole} options={roleOptions} placeholder="Select" />
              </View>

              <View className="mt-3">
                <FloatingLabelInput label="Primary color (hex)" value={clientPrimaryColor} onChangeText={setClientPrimaryColor} placeholder="#111827" />
              </View>

              <View className="mt-6">
                <Text className="text-xs font-semibold opacity-60">Primary contact (optional)</Text>
                <View className="mt-3">
                  <FloatingLabelInput label="Name" value={primaryContactName} onChangeText={setPrimaryContactName} placeholder="Full name" />
                </View>
                <View className="mt-3">
                  <FloatingLabelInput label="Email" value={primaryContactEmail} onChangeText={setPrimaryContactEmail} placeholder="name@email.com" />
                </View>
                <View className="mt-3">
                  <FloatingLabelInput
                    label="Phone"
                    value={primaryContactPhone}
                    onChangeText={(v) => setPrimaryContactPhone(formatPhoneAsYouType(v))}
                    placeholder="(555) 123-4567"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View className="mt-6">
                <Text className="text-xs font-semibold opacity-60">Registered service (optional)</Text>
                <View className="mt-3">
                  <SelectField label="Service" value={serviceName} onChange={setServiceName} options={serviceOptions} placeholder="Select" />
                </View>
                <View className="mt-3">
                  <FloatingLabelInput label="Start date (YYYY-MM-DD)" value={serviceStartDate} onChangeText={setServiceStartDate} placeholder="2026-01-15" />
                </View>
              </View>

              <View className="flex-row justify-end gap-2 mt-6">
                <Pressable onPress={onClose} disabled={busy} className={busy ? "opacity-50" : ""}>
                  <Badge label="Cancel" />
                </Pressable>
                <Pressable onPress={createClient} disabled={!canCreateClient || busy} className={!canCreateClient || busy ? "opacity-50" : ""}>
                  <Badge label={busy ? "Saving..." : "Save"} />
                </Pressable>
              </View>
            </ScrollView>
          </ModalSurface>
        </Pressable>
      </Pressable>
    </StackModal>
  );
}
