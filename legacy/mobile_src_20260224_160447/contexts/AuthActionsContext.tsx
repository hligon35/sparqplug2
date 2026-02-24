import React from "react";

export const AuthActionsContext = React.createContext<{
  logout: () => Promise<void>;
} | null>(null);
