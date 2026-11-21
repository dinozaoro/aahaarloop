import type { ProviderResult } from "./types.ts";

export interface FoodRecognitionProvider {
  readonly name: string;
  readonly model: string;
  recognize(
    input: { imageUrl: string },
    options: { signal: AbortSignal },
  ): Promise<ProviderResult>;
}
