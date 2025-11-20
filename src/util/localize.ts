/**
 * Localization utility for managing multi-language support with template interpolation
 */

export type LanguageCode = 'en' | 'no';

export interface LocalizationConfig<Lang extends string = string, Keys extends string = string> {
  defaultLang: Lang;
  messages: Record<Lang, Record<Keys, string>>;
}

type Languages<T extends LocalizationConfig> = keyof T['messages'];
type MessageKeys<T extends LocalizationConfig> = keyof T['messages'][keyof T['messages']];

class Localization<T extends LocalizationConfig> {
  private config: T;
  private currentLang: Languages<T>;

  constructor(config: T) {
    this.config = config;
    this.currentLang = config.defaultLang as Languages<T>;
  }

  /**
   * Set the current language
   */
  setLanguage(lang: Languages<T>): void {
    if (this.config.messages[lang as string]) {
      this.currentLang = lang;
    }
  }

  /**
   * Get the current language
   */
  getLanguage(): Languages<T> {
    return this.currentLang;
  }

  /**
   * Get a message and optionally interpolate template variables
   * @param key The message key
   * @param variables Object containing variables to interpolate in the format {variableName: value}
   * @returns The localized message with interpolated variables
   */
  getMessage(key: MessageKeys<T>, variables?: Record<string, string | number>): string {
    const messages = this.config.messages[this.currentLang as string];
    let message = messages?.[key as string];

    if (!message) {
      // Fallback to default language if not found
      const defaultMessages = this.config.messages[this.config.defaultLang as string];
      message = defaultMessages?.[key as string] ?? (key as string);
    }

    // Interpolate variables if provided
    if (variables) {
      message = this.interpolate(message, variables);
    }

    return message;
  }

  /**
   * Interpolate template variables in a string
   * Variables are denoted by {variableName} syntax
   * @param template The template string
   * @param variables Object containing variables to interpolate
   * @returns The interpolated string
   */
  private interpolate(template: string, variables: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = variables[key];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages(): Languages<T>[] {
    return Object.keys(this.config.messages) as Languages<T>[];
  }
}

/**
 * Create a new Localization instance
 */
export function createLocalization<T extends LocalizationConfig>(config: T): Localization<T> {
  return new Localization(config);
}

export default Localization;
