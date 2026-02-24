import * as LocalAuthentication from "expo-local-authentication";

export type BiometricInfo = {
  isAvailable: boolean;
  label: string;
};

export async function getBiometricInfo(): Promise<BiometricInfo> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const isAvailable = Boolean(hasHardware && isEnrolled);

  let label = "Biometric";
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      label = "Face ID";
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      label = "Touch ID";
    }
  } catch {
    // ignore
  }

  return { isAvailable, label };
}

export async function promptBiometric(label: string): Promise<boolean> {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: `Unlock with ${label}`,
    cancelLabel: "Cancel",
    disableDeviceFallback: false
  });

  return Boolean(res.success);
}
