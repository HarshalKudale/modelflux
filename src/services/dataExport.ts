import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';
import { conversationRepository, llmConfigRepository, messageRepository, settingsRepository } from '../core/storage';
import { AppSettings, Conversation, LLMConfig, Message } from '../core/types';

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
}

/**
 * Service for exporting and importing app data
 */
class DataExportService {
    private readonly EXPORT_VERSION = '1.0';

    /**
     * Export all app data to a JSON file
     */
    async exportData(): Promise<string> {
        // Gather all data
        const llmConfigs = await llmConfigRepository.findAll();
        const conversations = await conversationRepository.findAll();

        // Get all messages for all conversations
        const allMessages: Message[] = [];
        for (const conv of conversations) {
            const messages = await messageRepository.findByConversationId(conv.id);
            allMessages.push(...messages);
        }

        const settings = await settingsRepository.get();

        // Create export object
        const exportData: ExportData = {
            version: this.EXPORT_VERSION,
            exportedAt: Date.now(),
            llmConfigs,
            conversations,
            messages: allMessages,
            settings,
        };

        // Convert to JSON
        const jsonString = JSON.stringify(exportData, null, 2);
        const fileName = `llmhub-backup-${this.getDateString()}.json`;

        if (Platform.OS === 'web') {
            // Web: Download as file
            this.downloadJsonWeb(jsonString, fileName);
            return 'File downloaded';
        } else {
            // Native: Write to cache directory using new File API and share
            try {
                // Create file in cache directory using new API
                const file = new File(Paths.cache, fileName);

                // Delete if exists, then create and write
                if (file.exists) {
                    file.delete();
                }
                file.create();
                file.write(jsonString);

                console.log('File written to:', file.uri);

                // Share the file
                await Sharing.shareAsync(file.uri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Export LLM Hub Backup',
                    UTI: 'public.json',
                });

                return 'File shared';
            } catch (error) {
                console.log('File export failed:', error);
                // Fallback to Share API with text
                await Share.share({
                    message: jsonString,
                    title: fileName,
                });
                return 'Data shared as text (file sharing unavailable)';
            }
        }
    }

    /**
     * Import data from a JSON file
     */
    async importData(): Promise<{ success: boolean; message: string; stats?: ImportStats }> {
        try {
            let jsonString: string;

            if (Platform.OS === 'web') {
                // Web: Use file input
                jsonString = await this.pickFileWeb();
            } else {
                // Native: Use document picker
                const result = await DocumentPicker.getDocumentAsync({
                    type: 'application/json',
                    copyToCacheDirectory: true,
                });

                if (result.canceled || !result.assets?.[0]) {
                    return { success: false, message: 'Import cancelled' };
                }

                const fileUri = result.assets[0].uri;
                jsonString = await FileSystem.readAsStringAsync(fileUri);
            }

            // Parse and validate
            const importData: ExportData = JSON.parse(jsonString);

            if (!importData.version || !importData.exportedAt) {
                return { success: false, message: 'Invalid backup file format' };
            }

            // Import data
            const stats = await this.performImport(importData);

            return {
                success: true,
                message: 'Import successful!',
                stats,
            };
        } catch (error) {
            console.error('Import error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Import failed',
            };
        }
    }

    /**
     * Perform the actual import
     */
    private async performImport(data: ExportData): Promise<ImportStats> {
        const stats: ImportStats = {
            llmConfigs: 0,
            conversations: 0,
            messages: 0,
        };

        // Import LLM configs
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
                console.error('Failed to import config:', config.id, error);
            }
        }

        // Import conversations
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
                console.error('Failed to import conversation:', conv.id, error);
            }
        }

        // Import messages
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
                console.error('Failed to import message:', msg.id, error);
            }
        }

        // Import settings (merge with existing)
        if (data.settings) {
            try {
                await settingsRepository.update(data.settings);
            } catch (error) {
                console.error('Failed to import settings:', error);
            }
        }

        return stats;
    }

    /**
     * Download JSON file on web
     */
    private downloadJsonWeb(jsonString: string, fileName: string): void {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Pick file on web using file input
     */
    private pickFileWeb(): Promise<string> {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';

            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) {
                    reject(new Error('No file selected'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                    resolve(reader.result as string);
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read file'));
                };
                reader.readAsText(file);
            };

            input.click();
        });
    }

    /**
     * Get date string for file name
     */
    private getDateString(): string {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    }

    /**
     * Get export summary (for preview before export)
     */
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

export interface ImportStats {
    llmConfigs: number;
    conversations: number;
    messages: number;
}

export interface ExportSummary {
    llmConfigs: number;
    conversations: number;
    messages: number;
}

export const dataExportService = new DataExportService();
