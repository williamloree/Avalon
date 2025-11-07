import { databaseService } from './database.service';

interface UpdateSettingsDto {
  discordWebhookUrl?: string;
  discordEnabled?: boolean;
}

class SettingsService {
  async getSettings() {
    const settings = await databaseService.prisma.settings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      // Créer des settings par défaut si aucun n'existe
      return this.createDefaultSettings();
    }

    return settings;
  }

  async updateSettings(data: UpdateSettingsDto) {
    const currentSettings = await this.getSettings();

    return databaseService.prisma.settings.update({
      where: { id: currentSettings.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  private async createDefaultSettings() {
    return databaseService.prisma.settings.create({
      data: {
        discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || null,
        discordEnabled: process.env.DISCORD_ENABLED === 'true',
      },
    });
  }
}

export const settingsService = new SettingsService();
