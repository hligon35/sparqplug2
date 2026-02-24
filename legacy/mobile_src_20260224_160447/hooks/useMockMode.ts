import { useEffect, useState } from "react";

import { getMockOverride, shouldUseMock, subscribeMockOverride } from "../services/safeApi";

export function useMockMode(): { enabled: boolean; override: boolean | null } {
  const [state, setState] = useState<{ enabled: boolean; override: boolean | null }>(() => ({
    enabled: shouldUseMock(),
    override: getMockOverride()
  }));

  useEffect(() => {
    return subscribeMockOverride(() => {
      setState({ enabled: shouldUseMock(), override: getMockOverride() });
    });
  }, []);

  return state;
}
