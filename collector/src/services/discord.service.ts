import axios from 'axios';
import type { ErrorEventRecord } from '../types';
import { settingsService } from './settings.service';

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp: string;
  footer?: {
    text: string;
  };
}

class DiscordService {
  private readonly levelColors: Record<string, number> = {
    error: 0xFF0000,    // Rouge
    warning: 0xFFA500,  // Orange
    warn: 0xFFA500,     // Orange (alias)
    info: 0x00BFFF,     // Bleu clair
    debug: 0x808080,    // Gris
    fatal: 0x8B0000,    // Rouge foncé
    critical: 0xDC143C, // Cramoisi
  };

  private readonly levelEmojis: Record<string, string> = {
    error: '🔴',
    warning: '🟠',
    warn: '🟠',
    info: '🔵',
    debug: '⚪',
    fatal: '💀',
    critical: '🚨',
  };

  private getColorForLevel(level: string): number {
    return this.levelColors[level.toLowerCase()] || 0x808080;
  }

  private getEmojiForLevel(level: string): string {
    return this.levelEmojis[level.toLowerCase()] || '⚠️';
  }

  async sendErrorNotification(record: ErrorEventRecord): Promise<void> {
    try {
      // Récupérer les settings depuis la BDD
      const settings = await settingsService.getSettings();

      if (!settings.discordEnabled || !settings.discordWebhookUrl) {
        return;
      }

      const emoji = this.getEmojiForLevel(record.level);
      const color = this.getColorForLevel(record.level);

      const fields: Array<{ name: string; value: string; inline?: boolean }> = [
        {
          name: '📦 Service',
          value: `\`${record.service}\``,
          inline: true,
        },
        {
          name: '⚠️ Level',
          value: `${emoji} \`${record.level.toUpperCase()}\``,
          inline: true,
        },
        {
          name: '🆔 ID',
          value: `\`${record.id}\``,
          inline: true,
        },
      ];

      if (record.path) {
        fields.push({
          name: '🔗 Path',
          value: `\`${record.method || 'GET'} ${record.path}\``,
          inline: false,
        });
      }

      if (record.stack) {
        let stackValue = record.stack;
        if (stackValue.length > 1000) {
          stackValue = stackValue.substring(0, 1000) + '\n... [truncated]';
        }
        fields.push({
          name: '📜 Stack Trace',
          value: `\`\`\`\n${stackValue}\n\`\`\``,
          inline: false,
        });
      }

      const embed: DiscordEmbed = {
        title: `${emoji} ${record.level.toUpperCase()} - ${record.service}`,
        description: record.message || 'No error message provided',
        color: color,
        fields: fields,
        timestamp: record.createdAt.toISOString(),
        footer: {
          text: 'Avalon Error Collector',
        },
      };

      await axios.post(settings.discordWebhookUrl, {
        embeds: [embed],
      });
    } catch (error: any) {
      console.error('Discord webhook error:', error.message);
    }
  }
}

export const discordService = new DiscordService();
