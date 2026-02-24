import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";

import { Screen, SectionHeader } from "../components/ui";
import { debugStore, type ApiFailure } from "../services/debugStore";

function formatTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleString();
}

function FailureCard({ item }: { item: ApiFailure }) {
  const [copied, setCopied] = React.useState<string | null>(null);

  async function copy(label: string, text: string) {
    await Clipboard.setStringAsync(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1200);
  }

  const requestId = item.requestId ?? "-";
  const errorId = item.errorId ?? "-";

  return (
    <View className="mb-3 rounded-2xl border border-gray-200 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold">{item.status ?? "(no status)"}</Text>
        <Text className="text-xs opacity-60">{formatTime(item.at)}</Text>
      </View>

      <Text className="mt-2 text-xs opacity-70">{item.method?.toUpperCase() ?? ""} {item.url ?? ""}</Text>

      {item.message ? (
        <Text className="mt-2 text-sm">{item.message}</Text>
      ) : null}

      <View className="mt-3">
        <Text selectable className="text-xs opacity-80">request_id: {requestId}</Text>
        <Text selectable className="text-xs opacity-80">error_id: {errorId}</Text>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <Pressable
          onPress={() =>
            copy(
              "IDs",
              `request_id=${requestId}\nerror_id=${errorId}`
            )
          }
          className="rounded-full border border-gray-200 bg-white px-3 py-2"
        >
          <Text className="text-xs font-semibold">Copy IDs</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            copy(
              "Details",
              JSON.stringify(
                {
                  status: item.status,
                  method: item.method,
                  url: item.url,
                  request_id: requestId,
                  error_id: errorId,
                  message: item.message,
                  at: item.at
                },
                null,
                2
              )
            )
          }
          className="rounded-full border border-gray-200 bg-white px-3 py-2"
        >
          <Text className="text-xs font-semibold">Copy Details</Text>
        </Pressable>

        {copied ? <Text className="text-xs opacity-60">Copied {copied}</Text> : null}
      </View>

      <Text selectable className="mt-3 text-[11px] opacity-60">
        Tip: when debugging a backend error, search server logs for request_id or error_id.
      </Text>
    </View>
  );
}

export default function DevDiagnosticsScreen() {
  const [failures, setFailures] = React.useState<ApiFailure[]>(() => debugStore.getApiFailures());
  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => debugStore.subscribe(() => setFailures(debugStore.getApiFailures())), []);

  async function copy(label: string, text: string) {
    await Clipboard.setStringAsync(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1200);
  }

  const latest = failures[0];

  return (
    <Screen subtitle="Dev-only diagnostics" statusText={null}>
      <SectionHeader title="Recent API Failures" subtitle="Captured from the axios client" />

      <View className="mb-3 flex-row gap-2">
        <Pressable
          onPress={() => debugStore.clearApiFailures()}
          className="rounded-full border border-gray-200 bg-white px-4 py-2"
        >
          <Text className="text-xs font-semibold">Clear</Text>
        </Pressable>

        <Pressable
          disabled={!latest}
          onPress={() =>
            latest
              ? copy(
                  "Latest IDs",
                  `request_id=${latest.requestId ?? "-"}\nerror_id=${latest.errorId ?? "-"}`
                )
              : undefined
          }
          className={`rounded-full border border-gray-200 bg-white px-4 py-2 ${!latest ? "opacity-40" : ""}`}
        >
          <Text className="text-xs font-semibold">Copy latest IDs</Text>
        </Pressable>

        <Pressable
          disabled={!latest}
          onPress={() =>
            latest
              ? copy(
                  "Latest Details",
                  JSON.stringify(
                    {
                      status: latest.status,
                      method: latest.method,
                      url: latest.url,
                      request_id: latest.requestId ?? "-",
                      error_id: latest.errorId ?? "-",
                      message: latest.message,
                      at: latest.at
                    },
                    null,
                    2
                  )
                )
              : undefined
          }
          className={`rounded-full border border-gray-200 bg-white px-4 py-2 ${!latest ? "opacity-40" : ""}`}
        >
          <Text className="text-xs font-semibold">Copy latest details</Text>
        </Pressable>
      </View>

      {copied ? <Text className="mb-3 text-xs opacity-60">Copied {copied}</Text> : null}

      {failures.length === 0 ? (
        <View className="rounded-2xl border border-gray-200 bg-white p-4">
          <Text className="text-sm">No API failures captured yet.</Text>
          <Text className="mt-1 text-xs opacity-60">
            Once a request fails, you’ll see request_id/error_id here.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {failures.map((f) => (
            <FailureCard key={f.id} item={f} />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

// --- Change Summary ---
// Added a Dev Diagnostics screen that displays recent API failures with request_id/error_id for faster debugging.
