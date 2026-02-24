import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, Modal, TextInput, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { endpoints } from "../services/endpoints";
import { listWithFallback } from "../services/safeApi";
import { mockCalendarItems, mockClients } from "../services/mockData";
import { Badge, Card, ListRow, Screen, SectionHeader, SelectField, MultiSelectField, type SelectOption } from "../components/ui";

type Item = {
  id: number;
  client?: number;
  title: string;
  description?: string;
  platform?: string;
  source_url?: string;
  scheduled_at?: string;
  status?: string;
  category?: string;
  attendees?: string[];
  recurrence_rrule?: string;
};

type Client = { id: number; name: string };

type TeamUser = {
  id: number;
  name: string;
  email: string;
  username?: string;
  google_linked?: boolean;
  google_email?: string;
};

type GoogleAccount = { id: number; email: string };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function safeDateFromISO(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function normalizeHeaderKey(key: string): string {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/g)
    .filter((l) => l.trim().length > 0);
  if (!lines.length) return [];

  function parseLine(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // Handle escaped quotes "" inside quoted fields.
        const next = line[i + 1];
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out.map((v) => v.trim());
  }

  for (const line of lines) rows.push(parseLine(line));
  const rawHeaders = rows.shift() ?? [];
  const headers = rawHeaders.map(normalizeHeaderKey);

  return rows
    .map((cols) => {
      const obj: Record<string, string> = {};
      for (let i = 0; i < headers.length; i++) {
        const k = headers[i];
        if (!k) continue;
        obj[k] = String(cols[i] ?? "").trim();
      }
      return obj;
    })
    .filter((r) => Object.keys(r).length > 0);
}

function parseTimeToMinutes(raw: string): number | null {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let hh = Number(m[1]);
  const mm = Number(m[2] ?? "0");
  const ap = (m[3] ?? "").toLowerCase();
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (mm < 0 || mm > 59 || hh < 0 || hh > 23) return null;
  if (ap) {
    if (hh === 12) hh = 0;
    if (ap === "pm") hh += 12;
  }
  return hh * 60 + mm;
}

function parseRowDate(row: Record<string, string>): Date | null {
  const dtRaw =
    row.scheduled_at ||
    row.datetime ||
    row.date_time ||
    row.start ||
    row.start_time ||
    row.event_time ||
    "";
  const dateRaw = row.date || row.day || row.event_date || "";
  const timeRaw = row.time || row.start_time || row.start || "";

  const tryDt = String(dtRaw || "").trim();
  if (tryDt) {
    const d = new Date(tryDt);
    if (!Number.isNaN(d.getTime())) return d;
    // Handle YYYY-MM-DD without time.
    const m = tryDt.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const da = Number(m[3]);
      const base = new Date(y, mo - 1, da, 12, 0, 0);
      if (!Number.isNaN(base.getTime())) return base;
    }
  }

  const dRaw = String(dateRaw || "").trim();
  if (!dRaw) return null;
  const baseDate = new Date(dRaw);
  if (Number.isNaN(baseDate.getTime())) {
    const m = dRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const da = Number(m[3]);
    const mins = parseTimeToMinutes(timeRaw) ?? 12 * 60;
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const dt = new Date(y, mo - 1, da, hh, mm, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const mins = parseTimeToMinutes(timeRaw);
  if (mins != null) {
    baseDate.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  } else {
    baseDate.setHours(12, 0, 0, 0);
  }
  return baseDate;
}

function icsEscape(text: string): string {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function toIcsDateTimeUtc(dt: Date): string {
  const iso = dt.toISOString();
  // YYYY-MM-DDTHH:mm:ss.sssZ -> YYYYMMDDTHHMMSSZ
  return iso
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")
    .replace("T", "T");
}

function formatTime(iso?: string): string {
  const d = safeDateFromISO(iso);
  if (!d) return "";
  try {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDateLong(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map((v) => Number(v));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  try {
    return dt.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  } catch {
    return dateKey;
  }
}

function monthLabel(year: number, monthIndex: number): string {
  const dt = new Date(year, monthIndex, 1);
  try {
    return dt.toLocaleDateString([], { month: "long", year: "numeric" });
  } catch {
    return `${year}-${pad2(monthIndex + 1)}`;
  }
}

function formatDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatTimeInput(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function roundUpMinutes(d: Date, intervalMinutes: number): Date {
  const ms = d.getTime();
  const intervalMs = intervalMinutes * 60 * 1000;
  return new Date(Math.ceil(ms / intervalMs) * intervalMs);
}

function parseLocalDateTime(dateRaw: string, timeRaw: string): Date | null {
  const d = String(dateRaw || "").trim();
  const t = String(timeRaw || "").trim();

  const dm = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dm) return null;

  const tm = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!tm) return null;

  const y = Number(dm[1]);
  const mo = Number(dm[2]);
  const da = Number(dm[3]);
  const hh = Number(tm[1]);
  const mm = Number(tm[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;

  const dt = new Date(y, mo - 1, da, hh, mm, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function normalizeCategory(item: Item): string {
  if (item.category) return item.category;
  const title = (item.title ?? "").toLowerCase();
  if (title.includes("client")) return "client";
  if (title.includes("standup") || title.includes("meeting") || title.includes("call")) return "meeting";
  if (title.includes("post") || title.includes("instagram") || title.includes("linkedin")) return "content";
  if (title.includes("report")) return "report";
  return "general";
}

function eventColorClass(item: Item): string {
  const status = (item.status ?? "").toLowerCase();
  const cat = normalizeCategory(item);

  if (status === "done" || status === "completed") return "bg-gray-500";
  if (status === "draft") return "bg-amber-500";

  switch (cat) {
    case "meeting":
      return "bg-indigo-500";
    case "client":
      return "bg-emerald-500";
    case "content":
      return "bg-sky-500";
    case "report":
      return "bg-violet-500";
    default:
      return "bg-blue-500";
  }
}

export default function CalendarScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [busyImport, setBusyImport] = useState(false);
  const [busyExport, setBusyExport] = useState(false);

  const [meetVisible, setMeetVisible] = useState(false);
  const [meetBusy, setMeetBusy] = useState(false);
  const [meetClientId, setMeetClientId] = useState<number | null>(null);
  const [meetTitle, setMeetTitle] = useState<string>("Google Meet");
  const [meetDate, setMeetDate] = useState<string>(formatDateInput(new Date()));
  const [meetTime, setMeetTime] = useState<string>(formatTimeInput(roundUpMinutes(new Date(Date.now() + 15 * 60000), 5)));
  const [meetNotes, setMeetNotes] = useState<string>("");
  const [meetAttendees, setMeetAttendees] = useState<string[]>([]);
  const [meetRecurrence, setMeetRecurrence] = useState<string>("none");

  async function refreshCalendar(activeRef?: { active: boolean }) {
    const res = await listWithFallback<Item>(endpoints.calendar.list, mockCalendarItems);
    if (activeRef && !activeRef.active) return;
    setItems(res.data);
    if (res.error) setStatus(res.error);
  }

  async function importCalendarFile() {
    if (busyImport) return;
    setBusyImport(true);
    try {
      setStatus("Calendar import is not wired up yet.");
    } finally {
      setBusyImport(false);
    }
  }

  async function exportToICalendar() {
    if (busyExport) return;
    setBusyExport(true);
    try {
      setStatus("Calendar export is not wired up yet.");
    } finally {
      setBusyExport(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus(null);
        const [calendarRes, clientsRes] = await Promise.all([
          listWithFallback<Item>(endpoints.calendar.list, mockCalendarItems),
          listWithFallback<any>(endpoints.clients.list, mockClients)
        ]);

        if (!active) return;
        setItems(calendarRes.data);
        const clientList: Client[] = (clientsRes.data as any[])
          .map((c) => ({ id: Number(c?.id), name: String(c?.name ?? "") }))
          .filter((c) => Number.isFinite(c.id) && !!c.name);
        setClients(clientList);
        setMeetClientId((prev) => prev ?? clientList?.[0]?.id ?? null);

        // Best-effort: coworker directory + linked Google accounts
        try {
          const [teamRes, acctRes] = await Promise.all([endpoints.users.team(), endpoints.google.accounts()]);
          if (active) {
            setTeam((teamRes?.data as any[]) || []);
            setGoogleAccounts((acctRes?.data as any[]) || []);
          }
        } catch {
          // Non-fatal (e.g. offline, mock mode)
        }

        if (calendarRes.error || clientsRes.error) setStatus(calendarRes.error || clientsRes.error);
      } catch (e: any) {
        if (!active) return;
        setItems(mockCalendarItems);
        const clientList: Client[] = (mockClients as any[])
          .map((c) => ({ id: Number(c?.id), name: String(c?.name ?? "") }))
          .filter((c) => Number.isFinite(c.id) && !!c.name);
        setClients(clientList);
        setMeetClientId((prev) => prev ?? clientList?.[0]?.id ?? null);
        setStatus(e?.message ?? "Unable to load calendar");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function openMeetModal() {
    const start = roundUpMinutes(new Date(Date.now() + 15 * 60000), 5);
    setMeetTitle("Google Meet");
    setMeetDate(formatDateInput(start));
    setMeetTime(formatTimeInput(start));
    setMeetNotes("");
    setMeetAttendees([]);
    setMeetRecurrence("none");
    setMeetVisible(true);
  }

  async function refreshGoogleLinkStatus() {
    try {
      const acctRes = await endpoints.google.accounts();
      setGoogleAccounts((acctRes?.data as any[]) || []);
    } catch {
      // ignore
    }
  }

  async function linkGoogle() {
    try {
      setStatus(null);
      const res = await endpoints.google.oauthStart({ return_to: "sparqplug://google-linked" });
      const authUrl = String((res as any)?.data?.authUrl ?? "").trim();
      if (!authUrl) {
        setStatus("Google linking is not configured on the server.");
        return;
      }
      await Linking.openURL(authUrl);
    } catch (e: any) {
      setStatus(e?.message ? String(e.message) : "Failed to start Google linking");
    }
  }

  function recurrenceToRrule(v: string): string {
    switch ((v || "").toLowerCase()) {
      case "daily":
        return "RRULE:FREQ=DAILY";
      case "weekly":
        return "RRULE:FREQ=WEEKLY";
      case "monthly":
        return "RRULE:FREQ=MONTHLY";
      default:
        return "";
    }
  }

  async function createMeet() {
    if (meetBusy) return;

    const when = parseLocalDateTime(meetDate, meetTime);
    if (!when) {
      setStatus("Invalid date/time. Use YYYY-MM-DD and HH:MM.");
      return;
    }

    const clientId = meetClientId ?? clients?.[0]?.id ?? null;
    if (!clientId) {
      setStatus("Create at least one client before scheduling a meeting.");
      return;
    }

    const title = String(meetTitle || "").trim() || "Google Meet";
    const attendees = (meetAttendees || []).map((e) => String(e).trim()).filter(Boolean);
    const recurrence_rrule = recurrenceToRrule(meetRecurrence);

    setMeetBusy(true);
    setStatus(null);
    try {
      await endpoints.calendar.scheduleGoogleMeet({
        client: clientId,
        title,
        description: String(meetNotes || "").trim(),
        scheduled_at: when.toISOString(),
        attendees,
        recurrence_rrule
      });

      setMeetVisible(false);
      await refreshCalendar();
      setStatus("Meeting scheduled.");
    } catch (e: any) {
      setStatus(e?.message ? String(e.message) : "Failed to schedule meeting");
    } finally {
      setMeetBusy(false);
    }
  }

  const clientOptions: SelectOption[] = (clients || []).map((c) => ({ label: c.name, value: String(c.id) }));
  const googleLinkedEmail = googleAccounts?.[0]?.email ? String(googleAccounts[0].email) : "";
  const linkedLabel = googleLinkedEmail ? `Linked: ${googleLinkedEmail}` : "Not linked";

  const teamOptions: SelectOption[] = (team || [])
    .filter((u) => Boolean(u.google_linked) && String(u.google_email || "").trim())
    .map((u) => ({
      label: `${u.name || u.username || u.google_email} (${u.google_email})`,
      value: String(u.google_email)
    }));

  const recurrenceOptions: SelectOption[] = [
    { label: "Does not repeat", value: "none" },
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" }
  ];

  const todayKey = dateKeyFromDate(new Date());
  const eventsByDay = items.reduce<Record<string, Item[]>>((acc, item) => {
    const dt = safeDateFromISO(item.scheduled_at);
    if (!dt) return acc;
    const key = dateKeyFromDate(dt);
    (acc[key] ||= []).push(item);
    return acc;
  }, {});

  const todaysEvents = (eventsByDay[todayKey] ?? []).slice().sort((a, b) => {
    const da = safeDateFromISO(a.scheduled_at)?.getTime() ?? 0;
    const db = safeDateFromISO(b.scheduled_at)?.getTime() ?? 0;
    return da - db;
  });

  const now = new Date();
  const monthIndex = now.getMonth();
  const year = now.getFullYear();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const totalCells = 42;
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedEvents = selectedDateKey ? eventsByDay[selectedDateKey] ?? [] : [];
  const closeOverlay = () => setOverlayVisible(false);
  const openOverlayForDate = (key: string) => {
    setSelectedDateKey(key);
    setOverlayVisible(true);
  };

  return (
    <Screen
      subtitle="Upcoming items and reminders."
      statusText={status}
    >
      <Card>
        <SectionHeader title="Today's Events" subtitle={formatDateLong(todayKey)} />
        <View className="mt-3">
          <FlatList
            data={todaysEvents}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8 }}
            renderItem={({ item }) => {
              const time = formatTime(item.scheduled_at);
              const color = eventColorClass(item);
              return (
                <Pressable
                  onPress={() => openOverlayForDate(todayKey)}
                  className="mr-3"
                >
                  <View className="w-64 rounded-2xl border border-gray-200 bg-white p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className={`h-2 w-2 rounded-full ${color}`} />
                        <Text className="text-xs opacity-70 ml-2">{time || "Today"}</Text>
                      </View>
                      <Badge label={(item.status ?? "event").toUpperCase()} />
                    </View>
                    <Text className="text-base font-semibold mt-3" numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text className="text-sm opacity-70 mt-1" numberOfLines={1}>
                      {normalizeCategory(item)}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View className="py-8">
                <Text className="opacity-70">No events scheduled for today.</Text>
              </View>
            }
          />
        </View>
      </Card>

      <Card>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            <Pressable
              onPress={openMeetModal}
              hitSlop={10}
              className="h-9 w-9 rounded-full border border-gray-200 bg-white items-center justify-center mr-3"
            >
              <Ionicons name="videocam-outline" size={18} color="#111827" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-base font-semibold">Calendar</Text>
              <Text className="text-sm opacity-70 mt-1">{monthLabel(year, monthIndex)}</Text>
            </View>
          </View>
        </View>
        <View className="mt-3">
          <View className="flex-row">
            {weekdayLabels.map((label) => (
              <View key={label} className="flex-1 items-center py-2">
                <Text className="text-xs opacity-60">{label}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {Array.from({ length: totalCells }).map((_, idx) => {
              const dayNum = idx - leadingBlanks + 1;
              const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
              const key = inMonth ? `${year}-${pad2(monthIndex + 1)}-${pad2(dayNum)}` : `blank-${idx}`;
              const isToday = inMonth && key === todayKey;
              const dayEvents = inMonth ? eventsByDay[key] ?? [] : [];

              return (
                <View key={key} style={{ width: `${100 / 7}%` }}>
                  <Pressable
                    disabled={!inMonth}
                    onPress={() => inMonth && openOverlayForDate(key)}
                    className={`aspect-square p-1 ${inMonth ? "" : "opacity-30"}`}
                  >
                    <View
                      className={`flex-1 rounded-xl border border-gray-100 px-2 pt-2 pb-2 ${
                        isToday ? "bg-gray-100" : "bg-white"
                      }`}
                    >
                      <Text className={`text-sm ${isToday ? "font-semibold" : ""}`}>
                        {inMonth ? dayNum : ""}
                      </Text>

                      {dayEvents.length ? (
                        <View className="flex-row items-center mt-1">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <View
                              key={ev.id}
                              className={`h-1.5 w-1.5 rounded-full mr-1 ${eventColorClass(ev)}`}
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={importCalendarFile}
              disabled={busyImport}
              className="flex-1 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 items-center"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="cloud-upload-outline" size={18} />
                <Text className="text-sm font-semibold">{busyImport ? "Importing…" : "Import"}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={exportToICalendar}
              disabled={busyExport}
              className="flex-1 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 items-center"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="download-outline" size={18} />
                <Text className="text-sm font-semibold">{busyExport ? "Exporting…" : "Export"}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Card>

      <Modal
        visible={meetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMeetVisible(false)}
      >
        <Pressable className="flex-1 bg-black/40 px-4 justify-center" onPress={() => setMeetVisible(false)}>
          <Pressable
            className="rounded-2xl border border-gray-200 bg-white p-4"
            onPress={(e) => {
              e.stopPropagation();
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="pr-3 flex-1">
                <Text className="text-base font-semibold">Schedule Google Meet</Text>
                <Text className="text-sm opacity-70 mt-1">Creates a real Google Meet and saves it to your calendar.</Text>
              </View>
              <Pressable onPress={() => setMeetVisible(false)} className="px-3 py-2" hitSlop={10}>
                <Text className="text-sm font-semibold">Close</Text>
              </Pressable>
            </View>

            <View className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-xs font-semibold opacity-70">Google</Text>
                  <Text className="text-sm font-semibold mt-1">{linkedLabel}</Text>
                </View>
                <View className="flex-row gap-2">
                  <Pressable onPress={refreshGoogleLinkStatus} className="rounded-xl border border-gray-200 bg-white px-3 py-2" hitSlop={10}>
                    <Text className="text-xs font-semibold">Refresh</Text>
                  </Pressable>
                  <Pressable onPress={linkGoogle} className="rounded-xl border border-gray-900 bg-gray-900 px-3 py-2" hitSlop={10}>
                    <Text className="text-xs font-semibold text-white">Link Google</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <SelectField
                  label="Client"
                  value={meetClientId ? String(meetClientId) : ""}
                  options={clientOptions}
                  onChange={(v) => setMeetClientId(Number(v))}
                  placeholder={clients.length ? "Select a client" : "No clients"}
                  disabled={!clients.length}
                />
              </View>
              <View className="flex-1">
                <MultiSelectField
                  label="Team"
                  values={meetAttendees}
                  options={teamOptions}
                  onChange={(vals) => setMeetAttendees(Array.from(new Set((vals || []).map((v) => String(v).trim()).filter(Boolean))))}
                  placeholder={teamOptions.length ? "Select admins" : "No linked admins"}
                  disabled={!teamOptions.length}
                />
              </View>
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold opacity-70">Title</Text>
              <TextInput
                value={meetTitle}
                onChangeText={setMeetTitle}
                placeholder="Google Meet"
                className="mt-2 rounded-xl border border-gray-200 bg-white px-3 py-3"
              />
            </View>

            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold opacity-70">Date (YYYY-MM-DD)</Text>
                <TextInput
                  value={meetDate}
                  onChangeText={setMeetDate}
                  placeholder="2026-01-18"
                  autoCapitalize="none"
                  className="mt-2 rounded-xl border border-gray-200 bg-white px-3 py-3"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold opacity-70">Time (HH:MM)</Text>
                <TextInput
                  value={meetTime}
                  onChangeText={setMeetTime}
                  placeholder="14:30"
                  autoCapitalize="none"
                  className="mt-2 rounded-xl border border-gray-200 bg-white px-3 py-3"
                />
              </View>
            </View>

            <View className="mt-3">
              <SelectField
                label="Repeat"
                value={meetRecurrence}
                options={recurrenceOptions}
                onChange={setMeetRecurrence}
              />
            </View>

            <View className="mt-3">
              {meetAttendees.length ? (
                <View className="flex-row flex-wrap">
                  {meetAttendees.map((email) => (
                    <Pressable
                      key={email}
                      onPress={() => setMeetAttendees((prev) => prev.filter((e) => e !== email))}
                      className="mr-2 mb-2 rounded-full border border-gray-200 bg-white px-3 py-2"
                    >
                      <Text className="text-xs font-semibold">{email} · Remove</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text className="text-xs opacity-60">No teammates added.</Text>
              )}
            </View>

            <View className="mt-3">
              <Text className="text-xs font-semibold opacity-70">Notes (optional)</Text>
              <TextInput
                value={meetNotes}
                onChangeText={setMeetNotes}
                placeholder="Agenda, attendees, etc."
                multiline
                className="mt-2 rounded-xl border border-gray-200 bg-white px-3 py-3"
              />
            </View>

            <View className="mt-4 flex-row gap-3">
              <Pressable
                onPress={() => setMeetVisible(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 items-center"
              >
                <Text className="text-sm font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={createMeet}
                disabled={meetBusy}
                className={`flex-1 rounded-xl border px-4 py-3 items-center ${
                  meetBusy ? "bg-gray-200 border-gray-200" : "bg-gray-900 border-gray-900"
                }`}
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="videocam" size={18} color={meetBusy ? "#111827" : "#FFFFFF"} />
                  <Text className={`text-sm font-semibold ${meetBusy ? "text-gray-900" : "text-white"}`}>
                    {meetBusy ? "Scheduling…" : "Schedule"}
                  </Text>
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={overlayVisible}
        transparent
        animationType="fade"
        onRequestClose={closeOverlay}
      >
        <Pressable className="flex-1 bg-black/40 px-4 justify-center" onPress={closeOverlay}>
          <Pressable
            className="rounded-2xl border border-gray-200 bg-white p-4"
            onPress={(e) => {
              e.stopPropagation();
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="pr-3 flex-1">
                <Text className="text-base font-semibold">Overview</Text>
                {selectedDateKey ? (
                  <Text className="text-sm opacity-70 mt-1">{formatDateLong(selectedDateKey)}</Text>
                ) : null}
              </View>
              <Pressable onPress={closeOverlay} className="px-3 py-2">
                <Text className="text-sm font-semibold">Close</Text>
              </Pressable>
            </View>

            <View className="mt-3">
              {selectedDateKey && selectedEvents.length ? (
                <View>
                  {selectedEvents
                    .slice()
                    .sort((a, b) => {
                      const da = safeDateFromISO(a.scheduled_at)?.getTime() ?? 0;
                      const db = safeDateFromISO(b.scheduled_at)?.getTime() ?? 0;
                      return da - db;
                    })
                    .map((ev) => (
                      <ListRow
                        key={ev.id}
                        title={ev.title}
                        subtitle={`${formatTime(ev.scheduled_at)} • ${normalizeCategory(ev)}`}
                        right={
                          <View className="flex-row items-center">
                            <View className={`h-2 w-2 rounded-full mr-2 ${eventColorClass(ev)}`} />
                            <Badge label={(ev.status ?? "event").toUpperCase()} />
                          </View>
                        }
                      />
                    ))}
                </View>
              ) : (
                <View className="py-6">
                  <Text className="opacity-70">No events for this day.</Text>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
