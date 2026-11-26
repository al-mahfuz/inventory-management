import { defaultDictionary, interpolate } from "./dictionary";
import type { TranslationKey, TranslationParams } from "./dictionary";

/**
 * An error whose user-facing text is a translation key. `message` holds the
 * English text (for logs); the UI shows it translated via `errorMessage()`.
 */
export class LocalizedError extends Error {
  constructor(
    readonly key: TranslationKey,
    readonly params?: TranslationParams
  ) {
    super(interpolate(defaultDictionary[key], params));
    this.name = "LocalizedError";
  }
}
