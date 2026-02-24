import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { Badge, Card, ListRow, Screen, SectionHeader } from "../components/ui";
import { api } from "../services/api";
import {
  getMessage,
  listInboxMessages,
  listMailAccounts,
  sendMessage,
  startGoogleOAuth,
  trashMessage,
  type MailAccount,
  type MailAttachment,
  type MailInboxMessage,
  type MailMessage
} from "../services/mailApi";

export default function EmailScreen() {
  const isFocused = useIsFocused();
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MailInboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);

  const [connectOverlayOpen, setConnectOverlayOpen] = useState(false);

  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  async function refreshAccounts(opts?: { selectAccountId?: number }) {
    setLoadingAccounts(true);
    try {
      const list = await listMailAccounts();
      setAccounts(list);

      // Hide connect prompt once a mailbox exists.
      if (list.length) setConnectOverlayOpen(false);

      if (opts?.selectAccountId) {
        setSelectedAccountId(opts.selectAccountId);
      } else if (!selectedAccountId && list.length) {
        setSelectedAccountId(list[0].id);
      }
    } catch (e: any) {
      setStatusText(e?.message ? String(e.message) : "Failed to load accounts");
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function refreshMessages(accountId: number) {
    setLoadingMessages(true);
    try {
      const res = await listInboxMessages({ accountId, max: 25 });
      setMessages(res.messages);
    } catch (e: any) {
      setStatusText(e?.message ? String(e.message) : "Failed to load inbox");
    } finally {
      setLoadingMessages(false);
    }
  }

  function parseQueryParams(url: string): Record<string, string> {
    const q = url.split("?")[1] ?? "";
    const out: Record<string, string> = {};
    for (const part of q.split("&")) {
      if (!part) continue;
      const [kRaw, vRaw] = part.split("=");
      const k = decodeURIComponent(kRaw || "").trim();
      if (!k) continue;
      const v = decodeURIComponent(vRaw || "");
      out[k] = v;
    }
    return out;
  }

  async function handleDeepLink(url: string) {
    if (!url || !url.startsWith("sparqplug://mail-linked")) return;
    const params = parseQueryParams(url);
    const status = params.status;
    if (status === "success") {
      const accountId = Number(params.accountId);
      setStatusText("Mailbox linked.");
      await refreshAccounts({ selectAccountId: Number.isFinite(accountId) ? accountId : undefined });
      if (Number.isFinite(accountId)) {
        await refreshMessages(accountId);
      }
    } else if (status === "error") {
      setStatusText(params.error ? `Link failed: ${params.error}` : "Link failed");
    }
  }

  async function connectGmail() {
    try {
      setStatusText(null);
      const { authUrl } = await startGoogleOAuth({ return_to: "sparqplug://mail-linked" });
      await Linking.openURL(authUrl);
    } catch (e: any) {
      setStatusText(e?.message ? String(e.message) : "Failed to start Gmail linking");
    }
  }

  async function openMessage(accountId: number, messageId: string) {
    setLoadingMessage(true);
    try {
      const msg = await getMessage({ accountId, messageId });
      setSelectedMessage(msg);
    } catch (e: any) {
      setStatusText(e?.message ? String(e.message) : "Failed to load message");
    } finally {
      setLoadingMessage(false);
    }
  }

  async function onDeleteMessage(accountId: number, messageId: string) {
    try {
      setStatusText(null);
      await trashMessage({ accountId, messageId });
      setSelectedMessage(null);
      await refreshMessages(accountId);
    } catch (e: any) {
      setStatusText(e?.message ? String(e.message) : "Failed to delete message");
    }
  }

  function stripHtml(html: string): string {
    return String(html || "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function downloadAttachment(params: {
    accountId: number;
    messageId: string;
    attachment: MailAttachment;
  }) {
    const baseUrl = String(api.defaults.baseURL || "").replace(/\/+$/, "");
    const authHeader = String((api.defaults.headers.common as any)?.Authorization || "");
    if (!baseUrl || !authHeader) {
      setStatusText("Missing auth token; please sign in again.");
      return;
    }

    const url = `${baseUrl}/mail/accounts/${params.accountId}/messages/${params.messageId}/attachments/${params.attachment.attachmentId}`;
    const filename = (params.attachment.filename || "attachment").replace(/\s+/g, "_");
    const base = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const baseDir = base ? (base.endsWith("/") ? base : `${base}/`) : "";
    const outUri = `${baseDir}${encodeURIComponent(filename)}`;

    if (!outUri) {
      setStatusText("Cannot access device storage.");
      return;
    }

    try {
      setStatusText(null);
      const res = await FileSystem.downloadAsync(url, outUri, {
        headers: { Authorization: authHeader }
      });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        setStatusText("Downloaded, but sharing is unavailable on this device.");
        return;
      }
      await Sharing.shareAsync(res.uri);
    } catch (e: any) {
      setStatusText(e?.message ? String(e.message) : "Failed to download attachment");
    }
  }

  async function onSend() {
    if (!selectedAccountId) return;
    const to = composeTo
      .split(/[;,\n]/g)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!to.length) {
      setStatusText("To is required.");
      return;
    }

    try {
      setStatusText(null);
      await sendMessage({
        accountId: selectedAccountId,
        to,
        subject: composeSubject,
        bodyText: composeBody
      });
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      await refreshMessages(selectedAccountId);
      setStatusText("Sent.");
    } catch (e: any) {
      setStatusText(e?.message ? String(e.message) : "Failed to send");
    }
  }

  useEffect(() => {
    refreshAccounts();
  }, []);

  useEffect(() => {
    // When the Inbox tab is opened and no mailbox is linked, prompt the user to connect.
    if (!isFocused) return;
    if (loadingAccounts) return;
    if (accounts.length) return;
    setConnectOverlayOpen(true);
  }, [isFocused, loadingAccounts, accounts.length]);

  useEffect(() => {
    if (selectedAccountId) {
      refreshMessages(selectedAccountId);
    } else {
      setMessages([]);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    (async () => {
      const initial = await Linking.getInitialURL();
      if (initial) await handleDeepLink(initial);
    })();

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <Screen subtitle="Gmail (Google)" statusText={statusText}>
      <Modal
        visible={connectOverlayOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConnectOverlayOpen(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-5">
          <View className="w-full max-w-md rounded-2xl bg-white p-5">
            <Text className="text-lg font-semibold">Connect your Gmail</Text>
            <Text className="text-sm opacity-70 mt-2">
              To view your Inbox, connect your Gmail account.
            </Text>

            <View className="mt-4 gap-2">
              <Pressable
                onPress={async () => {
                  setConnectOverlayOpen(false);
                  await connectGmail();
                }}
                className="rounded-xl bg-white border border-gray-200 px-4 py-3 items-center"
                hitSlop={10}
              >
                <Text className="text-base font-semibold">Connect Gmail</Text>
              </Pressable>

              <Pressable
                onPress={() => setConnectOverlayOpen(false)}
                className="rounded-xl bg-white border border-gray-200 px-4 py-3 items-center"
                hitSlop={10}
              >
                <Text className="text-base font-semibold">Not now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Card>
        <SectionHeader
          title="Mailboxes"
          actionLabel={loadingAccounts ? "Loading…" : "Refresh"}
          onPressAction={() => refreshAccounts()}
        />
        <View className="mt-3">
          {loadingAccounts ? (
            <View className="py-4">
              <ActivityIndicator />
            </View>
          ) : accounts.length ? (
            accounts.map((a) => (
              <ListRow
                key={String(a.id)}
                title={a.email}
                subtitle={a.provider}
                right={a.id === selectedAccountId ? <Badge label="Selected" /> : null}
                onPress={() => {
                  setSelectedAccountId(a.id);
                  setSelectedMessage(null);
                }}
              />
            ))
          ) : (
            <View className="py-2">
              <Text className="text-sm opacity-70">No Gmail linked yet.</Text>
            </View>
          )}
        </View>

        <View className="mt-4 flex-row justify-between">
          <Pressable onPress={connectGmail} className="py-2">
            <Text className="text-sm font-semibold">Connect Gmail</Text>
          </Pressable>
          <Pressable
            onPress={() => setComposeOpen(true)}
            className="py-2"
            disabled={!selectedAccountId}
          >
            <Text className={`text-sm font-semibold ${!selectedAccountId ? "opacity-40" : ""}`}>
              Compose
            </Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}
