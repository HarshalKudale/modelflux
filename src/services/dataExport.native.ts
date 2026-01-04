/**
 * Data Export Service - Native Implementation
 * Uses expo-file-system and expo-sharing
 */
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import { conversationRepository, llmConfigRepository, messageRepository, personaRepository, settingsRepository } from '../core/storage';
import { AppSettings, Conversation, LLMConfig, Message, Persona } from '../core/types';
import { logger } from './LoggerService';

/**
 * Export data structure
 */
export interface ExportData {
    version: string;
    exportedAt: number;
    llmConfigs: LLMConfig[];
    conversations: Conversation[];
    messages: Message[];
    settings: AppSettings;
    personas?: Persona[];
}

export interface ImportStats {
    llmConfigs: number;
    conversations: number;
    messages: number;
    personas: number;
}

export interface ExportSummary {
    llmConfigs: number;
    conversations: number;
    messages: number;
}

class DataExportService {
    private readonly EXPORT_VERSION = '1.0';

    async exportData(): Promise<string> {
        const llmConfigs = await llmConfigRepository.findAll();
        const conversations = await conversationRepository.findAll();

        const allMessages: Message[] = [];
        for (const conv of conversations) {
            const messages = await messageRepository.findByConversationId(conv.id);
            allMessages.push(...messages);
        }

        const settings = await settingsRepository.get();
        const personas = await personaRepository.findAll();

        const exportData: ExportData = {
            version: this.EXPORT_VERSION,
            exportedAt: Date.now(),
            llmConfigs,
            conversations,
            messages: allMessages,
            settings,
            personas,
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const fileName = `llmhub-backup-${this.getDateString()}.json`;

        try {
            const file = new File(Paths.cache, fileName);

            if (file.exists) {
                file.delete();
            }
            file.create();
            file.write(jsonString);

            logger.log('DataExport', 'File written to:', file.uri);

            await Sharing.shareAsync(file.uri, {
                mimeType: 'application/json',
                dialogTitle: 'Export LLM Hub Backup',
                UTI: 'public.json',
            });

            return 'File shared';
        } catch (error) {
            logger.warn('DataExport', 'File export failed, using fallback:', error);
            await Share.share({
                message: jsonString,
                title: fileName,
            });
            return 'Data shared as text (file sharing unavailable)';
        }
    }

    async importData(): Promise<{ success: boolean; message: string; stats?: ImportStats }> {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.[0]) {
                return { success: false, message: 'Import cancelled' };
            }

            const fileUri = result.assets[0].uri;
            const jsonString = await FileSystem.readAsStringAsync(fileUri);

            const importData: ExportData = JSON.parse(jsonString);

            if (!importData.version || !importData.exportedAt) {
                return { success: false, message: 'Invalid backup file format' };
            }

            const stats = await this.performImport(importData);

            return {
                success: true,
                message: 'Import successful!',
                stats,
            };
        } catch (error) {
            logger.error('DataExport', 'Import error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Import failed',
            };
        }
    }

    private async performImport(data: ExportData): Promise<ImportStats> {
        const stats: ImportStats = {
            llmConfigs: 0,
            conversations: 0,
            messages: 0,
            personas: 0,
        };

        for (const config of data.llmConfigs) {
            try {
                const existing = await llmConfigRepository.findById(config.id);
                if (existing) {
                    await llmConfigRepository.update(config);
                } else {
                    await llmConfigRepository.create(config);
                }
                stats.llmConfigs++;
            } catch (error) {
                logger.error('DataExport', 'Failed to import config:', config.id, error);
            }
        }

        for (const conv of data.conversations) {
            try {
                const existing = await conversationRepository.findById(conv.id);
                if (existing) {
                    await conversationRepository.update(conv);
                } else {
                    await conversationRepository.create(conv);
                }
                stats.conversations++;
            } catch (error) {
                logger.error('DataExport', 'Failed to import conversation:', conv.id, error);
            }
        }

        for (const msg of data.messages) {
            try {
                const existing = await messageRepository.findById(msg.id);
                if (existing) {
                    await messageRepository.update(msg);
                } else {
                    await messageRepository.create(msg);
                }
                stats.messages++;
            } catch (error) {
                logger.error('DataExport', 'Failed to import message:', msg.id, error);
            }
        }

        if (data.settings) {
            try {
                await settingsRepository.update(data.settings);
            } catch (error) {
                logger.error('DataExport', 'Failed to import settings:', error);
            }
        }

        if (data.personas) {
            for (const persona of data.personas) {
                try {
                    const existing = await personaRepository.findById(persona.id);
                    if (existing) {
                        await personaRepository.update(persona);
                    } else {
                        await personaRepository.create(persona);
                    }
                    stats.personas++;
                } catch (error) {
                    logger.error('DataExport', 'Failed to import persona:', persona.id, error);
                }
            }
        }

        return stats;
    }

    private getDateString(): string {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    }

    async getExportSummary(): Promise<ExportSummary> {
        const llmConfigs = await llmConfigRepository.findAll();
        const conversations = await conversationRepository.findAll();

        let totalMessages = 0;
        for (const conv of conversations) {
            const messages = await messageRepository.findByConversationId(conv.id);
            totalMessages += messages.length;
        }

        return {
            llmConfigs: llmConfigs.length,
            conversations: conversations.length,
            messages: totalMessages,
        };
    }
}

export const dataExportService = new DataExportService();
