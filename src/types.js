// Shared type hints via JSDoc

/**
 * @typedef {Object} ComponentMeta
 * @property {string} id - Unique component ID (stable across versions)
 * @property {string} name
 * @property {string} version - Semver string, e.g. 1.2.3
 * @property {string} description
 * @property {string[]} tags
 * @property {string} preview - Preview text or URL
 * @property {boolean} installed - Whether currently installed in the palette
 * @property {number} installs - Install count for display
 * @property {number} [updatedAt] - epoch ms
 * @property {Record<string, any>} [definition] - Optional runtime definition used by renderer
 * @property {string} [source] - Registry source URL (for future remote sync)
 */

/**
 * @typedef {Object} InstallChange
 * @property {string} id
 * @property {boolean} installed
 * @property {string} version
 */
