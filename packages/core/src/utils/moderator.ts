import * as toxicity from '@tensorflow-models/toxicity';
import '@tensorflow/tfjs';

export class AIModerator {
  private static model: toxicity.ToxicityClassifier | null = null;
  private static readonly THRESHOLD = 0.85;

  private static async getModel() {
    if (!this.model) {
      // Load model with categories we care about
      this.model = await toxicity.load(this.THRESHOLD, [
        'identity_attack',
        'insult',
        'obscene',
        'severe_toxicity',
        'threat',
        'toxicity'
      ]);
    }
    return this.model;
  }

  /**
   * Analyzes text for toxic content.
   * Returns true if the text should be flagged.
   */
  static async shouldFlag(text: string): Promise<boolean> {
    try {
      const model = await this.getModel();
      const predictions = await model.classify([text]);

      // If any category matches with high probability, flag it
      return predictions.some(p => p.results[0].match === true);
    } catch (error) {
      console.error('AI Moderation failed:', error);
      return false; // Fail safe (don't flag on error, or could be true depending on policy)
    }
  }
}
