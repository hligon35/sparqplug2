import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { endpoints } from "../../services/endpoints";
import { CALENDAR_STATUS_OPTIONS, CONTENT_TYPE_OPTIONS, SOCIAL_PLATFORM_OPTIONS, TASK_STATUS_OPTIONS } from "../../constants/options";
import { Badge, Card, DateTimeField, FloatingLabelInput, ModalSurface, SectionHeader, SelectField, StackModal } from "../ui";

type Props = {
  clientId: number;
  defaultCalendarPlatform?: string;
  defaultCalendarContentType?: string;
};

export default function MarketingQuickActions({
  clientId,
  defaultCalendarPlatform,
  defaultCalendarContentType
}: Props) {
  const [taskOpen, setTaskOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskStatus, setTaskStatus] = useState("todo");

  const [calTitle, setCalTitle] = useState("");
  const [calStatus, setCalStatus] = useState("scheduled");
  const [calPlatform, setCalPlatform] = useState(defaultCalendarPlatform ?? "");
  const [calContentType, setCalContentType] = useState(defaultCalendarContentType ?? "");
  const [calScheduledAt, setCalScheduledAt] = useState("");

  const canCreateTask = useMemo(() => taskTitle.trim().length > 0, [taskTitle]);
  const canCreateCalendar = useMemo(() => calTitle.trim().length > 0, [calTitle]);

  async function createTask() {
    if (!canCreateTask) return;
    try {
      setStatus(null);
      setBusy(true);
      await endpoints.tasks.create({
        client: clientId,
        title: taskTitle.trim(),
        status: taskStatus
      });
      setTaskTitle("");
      setTaskStatus("todo");
      setTaskOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to create task");
    } finally {
      setBusy(false);
    }
  }

  async function createCalendarItem() {
    if (!canCreateCalendar) return;
    try {
      setStatus(null);
      setBusy(true);
      await endpoints.calendar.create({
        client: clientId,
        title: calTitle.trim(),
        status: calStatus,
        platform: calPlatform,
        content_type: calContentType,
        scheduled_at: calScheduledAt || null
      });
      setCalTitle("");
      setCalStatus("scheduled");
      setCalScheduledAt("");
      setCalendarOpen(false);
    } catch (e: any) {
      setStatus(e?.response?.data?.detail ?? e?.message ?? "Unable to create calendar item");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionHeader title="Quick actions" />
      {status ? <Text className="text-xs text-red-600 mt-2">{status}</Text> : null}
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Pressable onPress={() => setTaskOpen(true)} hitSlop={10} disabled={busy} className={busy ? "opacity-50" : ""}>
          <Badge label="Create task" />
        </Pressable>
        <Pressable onPress={() => setCalendarOpen(true)} hitSlop={10} disabled={busy} className={busy ? "opacity-50" : ""}>
          <Badge label="Schedule calendar item" />
        </Pressable>
      </View>

      <StackModal
        overlayKey={`marketing-quick-actions:task:${clientId}`}
        visible={taskOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTaskOpen(false)}
      >
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setTaskOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Create task">
              <View className="p-4">
                <View>
                  <FloatingLabelInput
                    label="Title"
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                    placeholder="e.g. Draft SEO brief"
                  />
                </View>

                <View className="mt-3">
                  <SelectField
                    label="Status"
                    value={taskStatus}
                    onChange={setTaskStatus}
                    placeholder="Select"
                    options={TASK_STATUS_OPTIONS}
                  />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setTaskOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable
                    onPress={createTask}
                    disabled={!canCreateTask || busy}
                    className={!canCreateTask || busy ? "opacity-50" : ""}
                  >
                    <Badge label={busy ? "Creating..." : "Create"} />
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </StackModal>

      <StackModal
        overlayKey={`marketing-quick-actions:calendar:${clientId}`}
        visible={calendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarOpen(false)}
      >
        <Pressable className="flex-1 bg-black/50 px-4 justify-center" onPress={() => setCalendarOpen(false)}>
          <Pressable onPress={() => {}}>
            <ModalSurface title="Schedule calendar item">
              <View className="p-4">
                <View>
                  <FloatingLabelInput
                    label="Title"
                    value={calTitle}
                    onChangeText={setCalTitle}
                    placeholder="e.g. Publish social post"
                  />
                </View>

                <View className="mt-3">
                  <DateTimeField
                    label="Scheduled at"
                    value={calScheduledAt}
                    onChange={setCalScheduledAt}
                    mode="datetime"
                    placeholder="Select"
                    allowClear
                  />
                </View>

                <View className="mt-3">
                  <SelectField
                    label="Platform"
                    value={calPlatform}
                    onChange={setCalPlatform}
                    placeholder="Select"
                    options={[{ label: "(none)", value: "" }, ...SOCIAL_PLATFORM_OPTIONS]}
                  />
                </View>

                <View className="mt-3">
                  <SelectField
                    label="Content type"
                    value={calContentType}
                    onChange={setCalContentType}
                    placeholder="Select"
                    options={[{ label: "(none)", value: "" }, ...CONTENT_TYPE_OPTIONS]}
                  />
                </View>

                <View className="mt-3">
                  <SelectField
                    label="Status"
                    value={calStatus}
                    onChange={setCalStatus}
                    placeholder="Select"
                    options={CALENDAR_STATUS_OPTIONS}
                  />
                </View>

                <View className="flex-row justify-end gap-2 mt-4">
                  <Pressable onPress={() => setCalendarOpen(false)}>
                    <Badge label="Cancel" />
                  </Pressable>
                  <Pressable
                    onPress={createCalendarItem}
                    disabled={!canCreateCalendar || busy}
                    className={!canCreateCalendar || busy ? "opacity-50" : ""}
                  >
                    <Badge label={busy ? "Creating..." : "Create"} />
                  </Pressable>
                </View>
              </View>
            </ModalSurface>
          </Pressable>
        </Pressable>
      </StackModal>
    </Card>
  );
}
