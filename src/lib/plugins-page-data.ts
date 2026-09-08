import { realPlugins, pluginLanguages, pluginAuthorCount } from './plugins-real';
import { pluginDescriptions } from './plugin-i18n';
import type { PluginWithGrowth } from './types';

export interface PluginsPageData {
  plugins: PluginWithGrowth[];
  languages: string[];
  authorCount: number;
  i18nDescriptions: Record<string, Record<string, string>>;
}

// Public, immutable build data. This module intentionally has no database import
// or database fallback: even cache bypasses must cost zero D1 reads.
const data: PluginsPageData = {
  plugins: realPlugins.map(({ install: _install, ...plugin }) => ({
    ...plugin,
    ...(plugin.downloads ? { downloads: {
      channel: plugin.downloads.channel,
      total: plugin.downloads.total,
      ...(plugin.downloads.note ? { note: plugin.downloads.note } : {}),
    } } : {}),
  })),
  languages: pluginLanguages,
  authorCount: pluginAuthorCount,
  i18nDescriptions: pluginDescriptions,
};

export function getPluginsPageData(): PluginsPageData {
  return data;
}
