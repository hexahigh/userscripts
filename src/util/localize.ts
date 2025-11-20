/**
 * Localization utility for managing multi-language support with template interpolation
 */

export type LanguageCode = 'en' | 'no';

export interface LocalizationConfig {
  defaultLang: string | LanguageCode;
  messages: Record<string, Record<string, string>>;
}

class Localization {
  private config: LocalizationConfig;
  private currentLang: LanguageCode;

  constructor(config: LocalizationConfig) {
    this.config = config;
    this.currentLang = (config.defaultLang as LanguageCode) || 'en';
  }

  /**
   * Set the current language
   */
  setLanguage(lang: string | LanguageCode): void {
    if (this.config.messages[lang]) {
      this.currentLang = lang as LanguageCode;
    }
  }

  /**
   * Get the current language
   */
  getLanguage(): LanguageCode {
    return this.currentLang;
  }

  /**
   * Get a message and optionally interpolate template variables
   * @param key The message key
   * @param variables Object containing variables to interpolate in the format {variableName: value}
   * @returns The localized message with interpolated variables
   */
  getMessage(key: string, variables?: Record<string, string | number>): string {
    const messages = this.config.messages[this.currentLang];
    let message = messages?.[key] ?? messages?.[key];

    if (!message) {
      // Fallback to default language if not found
      const defaultMessages = this.config.messages[this.config.defaultLang];
      message = defaultMessages?.[key] ?? key;
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
  getAvailableLanguages(): LanguageCode[] {
    return Object.keys(this.config.messages) as LanguageCode[];
  }
}

/**
 * Create a new Localization instance
 */
export function createLocalization(config: LocalizationConfig): Localization {
  return new Localization(config);
}

export default Localization;
