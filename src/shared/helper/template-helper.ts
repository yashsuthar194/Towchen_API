import * as fs from 'fs';
import * as path from 'path';

/**
 * Available email template names
 */
export type EmailTemplateName =
  | 'otp'
  | 'login'
  | 'register'
  | 'reset-password'
  | 'verify-email'
  | 'password-changed'
  | 'welcome'
  | 'account-locked';

/**
 * Simple template helper for email templates
 * Reads HTML files and replaces variables in {{VARIABLE}} format
 */
export class TemplateHelper {
  private static readonly TEMPLATE_DIR = path.join(
    __dirname,
    '..',
    'templates',
  );

  /**
   * Reads an HTML template file and returns its content as a string
   * @param templateName - Name of the template file (without .html extension)
   * @returns HTML content as string
   * @throws {Error} If template file doesn't exist
   *
   * @example
   * const html = TemplateHelper.getTemplate('otp');
   */
  static getTemplate(templateName: EmailTemplateName): string {
    const filePath = path.join(this.TEMPLATE_DIR, `${templateName}.html`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Template '${templateName}.html' not found`);
    }

    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Replaces variables in template content
   * Variables should be in format: {{VARIABLE_NAME}}
   * @param template - HTML template string
   * @param variables - Object with variable values
   * @returns Template with replaced variables
   *
   * @example
   * const html = TemplateHelper.replaceVariables(template, {
   *   OTP: '123456',
   *   EXPIRY_MINUTES: '5'
   * });
   */
  static replaceVariables(
    template: string,
    variables: Record<string, string | number>,
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return result;
  }

  /**
   * Convenience method: Get template and replace variables in one call
   * @param templateName - Name of template file (without .html)
   * @param variables - Variables to replace
   * @returns Rendered HTML
   *
   * @example
   * const html = TemplateHelper.render('otp', {
   *   OTP: '123456',
   *   EXPIRY_MINUTES: '5'
   * });
   */
  static render(
    templateName: EmailTemplateName,
    variables: Record<string, string | number>,
  ): string {
    const template = this.getTemplate(templateName);
    return this.replaceVariables(template, variables);
  }
}
