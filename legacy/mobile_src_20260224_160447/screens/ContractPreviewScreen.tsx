import React from "react";
import { Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import type { RootStackParamList } from "../../App";
import { Card, Screen, SectionHeader } from "../components/ui";
import { getClientContract, renderClientContract } from "../services/clientContractService";

export default function ContractPreviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ContractPreview">>();
  const { contractId } = route.params;

  const [status, setStatus] = React.useState<string | null>(null);
  const [rendered, setRendered] = React.useState<string>("");

  React.useEffect(() => {
    let active = true;

    (async () => {
      try {
        setStatus(null);
        const res = await renderClientContract(Number(contractId));
        const fresh = await getClientContract(Number(contractId));
        if (!active) return;
        setRendered(res.rendered_contract || fresh.rendered_contract || "");
      } catch (e: any) {
        if (!active) return;
        setStatus(e?.message ?? "Unable to render contract");
      }
    })();

    return () => {
      active = false;
    };
  }, [contractId]);

  return (
    <Screen statusText={status}>
      <Card>
        <SectionHeader title="Preview Contract" subtitle="Merged template + placeholders + enabled services" variant="card" />
        <View className="mt-3">
          <Text className="text-xs opacity-60 mb-2">Rendered contract</Text>
          <View className="rounded-2xl border border-gray-200 bg-white p-4">
            <Text className="text-sm leading-5">{rendered || "(empty)"}</Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
