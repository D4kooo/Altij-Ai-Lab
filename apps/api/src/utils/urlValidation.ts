/**
 * URL validation utilities for webhook security
 * Prevents SSRF attacks by validating webhook URLs
 */

// Default allowed domains for webhook URLs
// Can be extended via ALLOWED_WEBHOOK_DOMAINS env variable
const DEFAULT_ALLOWED_DOMAINS = ['n8n.altij.com'];

function getAllowedDomains(): string[] {
  const envDomains = process.env.ALLOWED_WEBHOOK_DOMAINS;
  if (envDomains) {
    return envDomains.split(',').map((d) => d.trim().toLowerCase());
  }
  return DEFAULT_ALLOWED_DOMAINS;
}

// Blocked hosts that should never be used (internal networks)
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.', // Link-local
  '10.', // Private Class A
  '172.16.', '172.17.', '172.18.', '172.19.', // Private Class B
  '172.20.', '172.21.', '172.22.', '172.23.',
  '172.24.', '172.25.', '172.26.', '172.27.',
  '172.28.', '172.29.', '172.30.', '172.31.',
  '192.168.', // Private Class C
  'metadata.google', // Cloud metadata
  '169.254.169.254', // AWS/GCP metadata
];

/**
 * Check if a URL points to an internal/private network
 */
function isInternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    return BLOCKED_HOSTS.some((blocked) => hostname.startsWith(blocked) || hostname === blocked);
  } catch {
    return true; // Invalid URLs are considered internal for safety
  }
}

/**
 * Check if URL domain is in the allowed whitelist
 */
function isAllowedDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const allowedDomains = getAllowedDomains();

    return allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a webhook URL for security
 * @param url The URL to validate
 * @param requireWhitelist If true, URL must be in allowed domains (default: false in dev, true in prod)
 */
export function validateWebhookUrl(url: string, requireWhitelist?: boolean): UrlValidationResult {
  // Default: require whitelist in production
  const shouldRequireWhitelist = requireWhitelist ?? process.env.NODE_ENV === 'production';

  // Basic URL format validation
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Must be HTTPS in production
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Webhook URL must use HTTPS in production' };
  }

  // Check for internal/private networks (SSRF protection)
  if (isInternalUrl(url)) {
    return { valid: false, error: 'Webhook URL cannot point to internal networks' };
  }

  // Check whitelist if required
  if (shouldRequireWhitelist && !isAllowedDomain(url)) {
    const allowedDomains = getAllowedDomains();
    return {
      valid: false,
      error: `Webhook URL domain not in whitelist. Allowed: ${allowedDomains.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Zod custom validation for webhook URLs
 */
export function webhookUrlValidator(url: string): boolean {
  const result = validateWebhookUrl(url);
  return result.valid;
}
