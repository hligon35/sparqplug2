/**
 * Stub service for future signature integrations.
 *
 * Future options:
 * - Add a backend endpoint to store signature strokes/typed signatures
 * - Integrate DocuSign/HelloSign
 * - Store signed PDF URL and signature metadata
 */
export async function submitSignatureStub(_args: {
  contractId: number;
  typedName?: string;
  typedSignature?: string;
  signedAtIso?: string;
}): Promise<void> {
  // TODO: Implement backend signature workflow.
}
