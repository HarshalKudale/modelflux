// English language bundle (default)
// Key format: {screen}.{section}.{element} or {feature}.{action}

export const en: Record<string, string> = {
    // App
    "app.name": "LLM Hub",

    // Common
    "common.ok": "OK",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.save": "Save",
    "common.error": "Error",
    "common.success": "Success",
    "common.loading": "Loading...",
    "common.version": "Version",

    // Settings Screen
    "settings.title": "Settings",
    "settings.general": "General",
    "settings.theme": "Theme",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",
    "settings.language": "Language",
    "settings.streaming.title": "Streaming Responses",
    "settings.streaming.description": "Show AI responses as they're generated",
    "settings.providers.title": "LLM Providers",
    "settings.providers.manage": "Manage Providers",
    "settings.providers.count": "{count} provider(s) configured",
    "settings.data.title": "Data",
    "settings.export.title": "Export Data",
    "settings.export.description": "Save providers & chats as JSON",
    "settings.export.summary": "Exporting:\n• {llmConfigs} provider(s)\n• {conversations} conversation(s)\n• {messages} message(s)",
    "settings.export.success": "Data exported successfully!",
    "settings.export.failed": "Export Failed",
    "settings.import.title": "Import Data",
    "settings.import.description": "Load providers & chats from JSON",
    "settings.import.success": "Import Successful",
    "settings.import.summary": "Imported:\n• {llmConfigs} provider(s)\n• {conversations} conversation(s)\n• {messages} message(s)",
    "settings.import.failed": "Import Failed",
    "settings.about.title": "About",

    // LLM Management Screen
    "llm.management.title": "LLM Providers",
    "llm.management.add": "Add Provider",
    "llm.management.yourProviders": "Your Providers ({count})",
    "llm.management.empty.title": "No providers yet",
    "llm.management.empty.description": "Add an LLM provider above to start chatting with AI models.",
    "llm.management.delete.title": "Delete Provider",
    "llm.management.delete.confirm": "Are you sure you want to delete \"{name}\"?",

    // LLM Editor Screen
    "llm.editor.add.title": "Add Provider",
    "llm.editor.edit.title": "Edit Provider",
    "llm.editor.providerType": "Provider Type",
    "llm.editor.name": "Name",
    "llm.editor.name.placeholder": "e.g., My OpenAI",
    "llm.editor.baseUrl": "Base URL",
    "llm.editor.baseUrl.hint": "The API endpoint URL",
    "llm.editor.apiKey": "API Key",
    "llm.editor.apiKey.hint": "Required for authentication",
    "llm.editor.defaultModel": "Default Model",
    "llm.editor.model.select": "Select a model...",
    "llm.editor.model.hint.noUrl": "Enter URL to fetch available models",
    "llm.editor.model.hint.noKey": "Enter API key to fetch available models",
    "llm.editor.model.hint.manual": "Enter model name or fetch models above",
    "llm.editor.test": "Test Connection",
    "llm.editor.testing": "Testing...",
    "llm.editor.test.success": "Connection successful!",
    "llm.editor.test.failed": "Could not connect. Check your settings.",
    "llm.editor.save": "Add Provider",
    "llm.editor.update": "Update Provider",
    "llm.editor.saving": "Saving...",
    "llm.editor.error.name": "Please enter a name",
    "llm.editor.error.url": "Please enter a base URL",
    "llm.editor.error.model": "Please select a default model",
    "llm.editor.error.apiKey": "API key is required for this provider",
    "llm.editor.error.save": "Failed to save configuration",
    "llm.editor.error.test": "Connection test failed",

    // Provider Types
    "provider.openai": "OpenAI",
    "provider.openai-spec": "OpenAI Compatible",
    "provider.ollama": "Ollama",

    // Chat Screen
    "chat.input.placeholder": "Type a message...",
    "chat.input.placeholder.noLlm": "Select an LLM to start chatting...",

    // Sidebar
    "sidebar.newChat": "New Chat",

    // Alerts
    "alert.error.default": "An error occurred",
};
