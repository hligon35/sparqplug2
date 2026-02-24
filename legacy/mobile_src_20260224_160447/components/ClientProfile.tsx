import React from "react";
import { View } from "react-native";
import { ListRow } from "./ui";

type Contact = {
  id: number;
  client: number;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  is_primary?: boolean;
};

type ClientService = {
  id: number;
  client: number;
  service_name: string;
  start_date?: string | null;
  end_date?: string | null;
};

type Props = {
  primaryContact?: Contact | null;
  services?: ClientService[];
};

export default function ClientProfile({ primaryContact, services }: Props) {
  const firstServices = (services ?? []).slice(0, 3);

  return (
    <View>
      <ListRow title="Primary Contact" subtitle="TBD" />
      <ListRow title="Email" subtitle="TBD" />
      <ListRow title="Phone" subtitle="TBD" />
    </View>
  );
}
