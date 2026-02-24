import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../App";
import { Card, Screen, SectionHeader } from "../components/ui";
import { getClientContract, updateClientContract } from "../services/clientContractService";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ContractSignatureScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ContractSignature">>();
  const { contractId } = route.params;
  const navigation = useNavigation<Nav>();

  const [status, setStatus] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"typed" | "drawn">("typed");
  const [typedName, setTypedName] = React.useState("");
  const [typedSignature, setTypedSignature] = React.useState("");

  React.useEffect(() => {
    let active = true;

    (async () => {
      try {
        const c = await getClientContract(Number(contractId));
        if (!active) return;
        setTypedName(String(c.client_name ?? ""));
      } catch (e: any) {
        if (!active) return;
        setStatus(e?.message ?? "Unable to load contract");
      }
    })();

    return () => {
      active = false;
    };
  }, [contractId]);

  async function onMarkSigned() {
    try {
      setStatus(null);
      const signedAtIso = new Date().toISOString();
      const current = await getClientContract(Number(contractId));
      const mergedBaseFields = {
        ...(current.base_fields ?? {}),
        signed_at: signedAtIso,
        signed_name: typedName,
        signature_mode: mode,
        typed_signature: typedSignature
      };

      await updateClientContract(Number(contractId), {
        signature_status: "signed",
        base_fields: mergedBaseFields as any
      });
      navigation.goBack();
    } catch (e: any) {
      setStatus(e?.message ?? "Unable to save signature");
    }
  }

  return (
    <Screen statusText={status}>
      <Card>
        <SectionHeader title="Signature" subtitle="Typed or drawn signature (drawn is stubbed for now)" variant="card" />

        <View className="mt-3">
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setMode("typed")}
              className={`flex-1 rounded-xl border border-gray-200 px-4 py-3 items-center ${
                mode === "typed" ? "bg-gray-900" : "bg-white"
              }`}
            >
              <Text className={`text-sm font-semibold ${mode === "typed" ? "text-white" : "text-gray-900"}`}>Typed</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("drawn")}
              className={`flex-1 rounded-xl border border-gray-200 px-4 py-3 items-center ${
                mode === "drawn" ? "bg-gray-900" : "bg-white"
              }`}
            >
              <Text className={`text-sm font-semibold ${mode === "drawn" ? "text-white" : "text-gray-900"}`}>Drawn</Text>
            </Pressable>
          </View>

          {mode === "typed" ? (
            <View className="gap-3 mt-4">
              <View>
                <Text className="text-xs font-semibold opacity-60 mb-2">Name</Text>
                <TextInput
                  value={typedName}
                  onChangeText={setTypedName}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold opacity-60 mb-2">Typed signature</Text>
                <TextInput
                  value={typedSignature}
                  onChangeText={setTypedSignature}
                  placeholder="Type your signature"
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
                />
              </View>
            </View>
          ) : (
            <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="construct-outline" size={18} color="#111827" />
                <Text className="text-sm font-semibold">Drawn signature is coming next</Text>
              </View>
              <Text className="text-sm opacity-70 mt-2">
                This screen is ready for a future signature pad integration. For now, use Typed.
              </Text>
            </View>
          )}

          <Pressable onPress={onMarkSigned} className="rounded-xl bg-gray-900 px-4 py-3 items-center mt-5">
            <Text className="text-sm font-semibold text-white">Mark as signed</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}
