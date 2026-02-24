import React from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card, ListRow, Screen, SectionHeader } from "../components/ui";
import {
  createContractTemplate,
  createServiceScheduleTemplate,
  listContractTemplates,
  listServiceScheduleTemplates,
  type ContractTemplate,
  type ServiceScheduleTemplate
} from "../services/contractTemplateService";

const SERVICE_KEY_OPTIONS = [
  { key: "website", label: "Website" },
  { key: "seo", label: "SEO" },
  { key: "social", label: "Social" },
  { key: "ads", label: "Ads" }
] as const;

export default function ContractTemplateManagerScreen() {
  const [status, setStatus] = React.useState<string | null>(null);

  const [templates, setTemplates] = React.useState<ContractTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<number | null>(null);
  const [schedules, setSchedules] = React.useState<ServiceScheduleTemplate[]>([]);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("master");
  const [version, setVersion] = React.useState("1.0");
  const [body, setBody] = React.useState("");

  const [createScheduleOpen, setCreateScheduleOpen] = React.useState(false);
  const [serviceKey, setServiceKey] = React.useState("");
  const [serviceKeyDropdownOpen, setServiceKeyDropdownOpen] = React.useState(false);
  const [serviceTitle, setServiceTitle] = React.useState("");
  const [serviceDesc, setServiceDesc] = React.useState("");
  const [serviceTerms, setServiceTerms] = React.useState("");

  const refreshTemplates = React.useCallback(async () => {
    const list = await listContractTemplates();
    setTemplates(list);
    if (!selectedTemplateId && list[0]?.id) setSelectedTemplateId(list[0].id);
  }, [selectedTemplateId]);

  const refreshSchedules = React.useCallback(async (templateId: number) => {
    const list = await listServiceScheduleTemplates(templateId);
    setSchedules(list);
  }, []);

  React.useEffect(() => {
    let active = true;

    (async () => {
      try {
        setStatus(null);
        await refreshTemplates();
      } catch (e: any) {
        if (!active) return;
        setStatus(e?.message ?? "Unable to load templates");
      }
    })();

    return () => {
      active = false;
    };
  }, [refreshTemplates]);

  React.useEffect(() => {
    let active = true;

    (async () => {
      if (!selectedTemplateId) return;
      try {
        setStatus(null);
        const list = await listServiceScheduleTemplates(selectedTemplateId);
        if (!active) return;
        setSchedules(list);
      } catch (e: any) {
        if (!active) return;
        setSchedules([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedTemplateId]);

  async function onCreateTemplate() {
    try {
      setStatus(null);
      const created = await createContractTemplate({
        template_name: name.trim() || "New Template",
        category: category.trim(),
        version: version.trim(),
        template_body: body
      });
      setCreateOpen(false);
      setName("");
      setBody("");
      await refreshTemplates();
      setSelectedTemplateId(created.id);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to create template");
    }
  }

  async function onCreateSchedule() {
    if (!selectedTemplateId) return;

    try {
      setStatus(null);
      await createServiceScheduleTemplate({
        template: selectedTemplateId,
        service_key: serviceKey.trim(),
        service_title: serviceTitle.trim() || serviceKey.trim(),
        service_description: serviceDesc,
        default_price: "0.00",
        default_terms: serviceTerms
      });
      setCreateScheduleOpen(false);
      setServiceKey("");
      setServiceTitle("");
      setServiceDesc("");
      setServiceTerms("");
      await refreshSchedules(selectedTemplateId);
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to create schedule" );
    }
  }

  return (
    <Screen statusText={status}>
      <Card>
        <SectionHeader
          title="Contract Template Manager"
          subtitle="Templates and service schedule modules"
          variant="card"
          action={
            <Pressable
              onPress={() => setCreateOpen(true)}
              hitSlop={10}
              className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#111827" />
            </Pressable>
          }
        />

        <View className="mt-2">
          {(templates ?? []).map((t) => (
            <ListRow
              key={t.id}
              title={t.template_name}
              subtitle={`${t.category ?? ""}${t.version ? ` • v${t.version}` : ""}`.trim()}
              left={<Ionicons name={selectedTemplateId === t.id ? "radio-button-on" : "radio-button-off"} size={18} color="#111827" />}
              right={<Ionicons name="chevron-forward" size={18} color="#111827" />}
              onPress={() => {
                setSelectedTemplateId(t.id);
                refreshSchedules(t.id);
              }}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Service Schedule Templates"
          subtitle="Modular sections attachable per client"
          variant="card"
          action={
            <Pressable
              onPress={() => {
                setStatus(null);
                setServiceKeyDropdownOpen(false);
                setCreateScheduleOpen(true);
              }}
              hitSlop={10}
              className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#111827" />
            </Pressable>
          }
        />

        <View className="mt-2">
          {(schedules ?? []).length === 0 ? (
            <Text className="text-sm opacity-70">No service modules yet for this template.</Text>
          ) : (
            (schedules ?? []).map((s) => (
              <ListRow
                key={s.id}
                title={`${s.service_title}`}
                subtitle={`${s.service_key} • default $${Number(s.default_price ?? 0).toFixed(2)}`}
                left={<Ionicons name="layers-outline" size={18} color="#111827" />}
              />
            ))
          )}
        </View>
      </Card>

      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setCreateOpen(false)}>
          <Pressable className="bg-white rounded-3xl border border-gray-200 w-full overflow-hidden" onPress={() => {}}>
            <View className="px-5 pt-5 pb-3 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-lg font-semibold">New Template</Text>
              <Pressable onPress={() => setCreateOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#111827" />
              </Pressable>
            </View>

            <View className="p-5 gap-3">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Template name"
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
              />
              <View className="flex-row gap-2">
                <TextInput
                  value={category}
                  onChangeText={setCategory}
                  placeholder="Category"
                  className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
                />
                <TextInput
                  value={version}
                  onChangeText={setVersion}
                  placeholder="Version"
                  className="w-24 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
                />
              </View>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Template body (supports {{placeholders}})"
                multiline
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
                style={{ minHeight: 160, textAlignVertical: "top" }}
              />

              <Pressable onPress={onCreateTemplate} className="rounded-xl bg-gray-900 px-4 py-3 items-center">
                <Text className="text-sm font-semibold text-white">Create</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={createScheduleOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setServiceKeyDropdownOpen(false);
          setCreateScheduleOpen(false);
        }}
      >
        <Pressable
          className="flex-1 bg-black/50 px-4 justify-center"
          onPress={() => {
            setServiceKeyDropdownOpen(false);
            setCreateScheduleOpen(false);
          }}
        >
          <Pressable className="bg-white rounded-3xl border border-gray-200 w-full overflow-hidden" onPress={() => {}}>
            <View className="px-5 pt-5 pb-3 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-lg font-semibold">New Service Module</Text>
              <Pressable
                onPress={() => {
                  setServiceKeyDropdownOpen(false);
                  setCreateScheduleOpen(false);
                }}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color="#111827" />
              </Pressable>
            </View>

            <View className="p-5 gap-3">
              <View>
                <Text className="text-xs font-semibold opacity-60 mb-2">Service key</Text>
                <Pressable
                  onPress={() => setServiceKeyDropdownOpen((v) => !v)}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 flex-row items-center justify-between"
                >
                  <Text className={serviceKey ? "text-sm" : "text-sm opacity-50"}>
                    {serviceKey || "Select a service key"}
                  </Text>
                  <Ionicons name={serviceKeyDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="#111827" />
                </Pressable>

                {serviceKeyDropdownOpen ? (
                  <View className="mt-2 rounded-2xl border border-gray-200 bg-white overflow-hidden">
                    {SERVICE_KEY_OPTIONS.map((opt, idx) => (
                      <Pressable
                        key={opt.key}
                        onPress={() => {
                          setServiceKey(opt.key);
                          if (!serviceTitle.trim()) setServiceTitle(opt.label);
                          setServiceKeyDropdownOpen(false);
                        }}
                        className={
                          idx === SERVICE_KEY_OPTIONS.length - 1
                            ? "px-4 py-3"
                            : "px-4 py-3 border-b border-gray-100"
                        }
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-semibold">{opt.label}</Text>
                          <Text className="text-xs opacity-60">{opt.key}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              <TextInput
                value={serviceTitle}
                onChangeText={setServiceTitle}
                placeholder="Title"
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
              />
              <TextInput
                value={serviceDesc}
                onChangeText={setServiceDesc}
                placeholder="Description"
                multiline
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
              <TextInput
                value={serviceTerms}
                onChangeText={setServiceTerms}
                placeholder="Default terms"
                multiline
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
                style={{ minHeight: 120, textAlignVertical: "top" }}
              />

              <Pressable onPress={onCreateSchedule} className="rounded-xl bg-gray-900 px-4 py-3 items-center">
                <Text className="text-sm font-semibold text-white">Create module</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
