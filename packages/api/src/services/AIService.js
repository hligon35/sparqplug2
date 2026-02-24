export class AIService {
  static async run({ input, user }) {
    // Placeholder for future SparQBrain
    return {
      ok: true,
      input,
      user: user ? { uid: user.uid } : undefined,
      output: 'AIService not implemented yet.'
    };
  }
}
