// English language bundle (default)
// Key format: {screen}.{section}.{element} or {feature}.{action}

export const en: Record<string, string> = {
    // App
    "app.name": "ModelFlux",

    // Common
    "common.ok": "OK",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.save": "Save",
    "common.edit": "Edit",
    "common.test": "Test",
    "common.error": "Error",
    "common.success": "Success",
    "common.loading": "Loading...",
    "common.version": "Version",
    "common.local": "Local",
    "common.model": "Model",
    "common.connected": "Connected",
    "common.failed": "Failed",

    // Settings Screen
    "settings.title": "Settings",
    "settings.general": "General",
    "settings.theme": "Theme",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",
    "settings.language": "Language",
    "settings.llm.title": "LLM",
    "settings.providers.title": "LLM Providers",
    "settings.providers.manage": "Manage LLM Providers",
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

    // Personas - Character Card V2
    "settings.personas.title": "Personas",
    "settings.personas.create": "Create Persona",
    "settings.personas.edit": "Edit Persona",

    // Identity section
    "settings.personas.identity": "Identity",
    "settings.personas.name": "Name",
    "settings.personas.namePlaceholder": "e.g., Creative Writer",
    "settings.personas.description": "Description",
    "settings.personas.descriptionPlaceholder": "Character background and description...",
    "settings.personas.personality": "Personality",
    "settings.personas.personalityPlaceholder": "e.g., Friendly, curious, helpful...",

    // Scenario section
    "settings.personas.scenarioSection": "Scenario",
    "settings.personas.scenario": "Scenario",
    "settings.personas.scenarioPlaceholder": "The setting or context for conversations...",

    // Prompts section
    "settings.personas.promptsSection": "Prompts",
    "settings.personas.systemPrompt": "System Prompt",
    "settings.personas.systemPromptPlaceholder": "Main instructions for the AI behavior...",
    "settings.personas.postHistoryInstructions": "Post-History Instructions",
    "settings.personas.postHistoryInstructionsPlaceholder": "Instructions placed after chat history...",
    "settings.personas.characters": "characters",

    // Metadata section
    "settings.personas.metadataSection": "Metadata",
    "settings.personas.creatorNotes": "Creator Notes",
    "settings.personas.creatorNotesPlaceholder": "Notes for users about this persona...",
    "settings.personas.creatorNotesHint": "These notes are for reference only and not used in prompts.",

    // List/management
    "settings.personas.empty": "No personas yet",
    "settings.personas.count": "{count} persona(s) configured",
    "settings.personas.delete.title": "Delete Persona",
    "settings.personas.delete.confirm": "Are you sure you want to delete \"{name}\"?",
    "settings.personas.delete.isDefault": "This is the default persona. Another persona will be set as default.",
    "settings.personas.setDefault": "Set Default",
    "settings.personas.isDefault": "Default",
    "settings.personas.emptyState.title": "No personas yet",
    "settings.personas.emptyState.description": "Add your first persona to customize how the AI behaves.",
    "settings.personas.emptyState.cta": "Create Persona",




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
    "llm.editor.error.noModels": "At least one model is required",

    // Local Models
    "llm.editor.localModels": "Model Management",
    "llm.editor.localModels.builtIn": "Select a pre-configured model to download and use",
    "llm.editor.localModels.formatHint.executorch": "Supported format: .pte",
    "llm.editor.localModels.formatHint.llama-cpp": "Supported format: .gguf",
    "llm.editor.model.selectPlaceholder": "Choose a model...",
    "llm.editor.model.download": "Download Model",
    "llm.editor.model.downloading": "Downloading... {progress}%",
    "llm.editor.model.loading": "Loading model...",
    "llm.editor.model.loaded": "Model loaded",
    "llm.editor.model.loadFailed": "Failed to load model",

    // ExecuTorch Provider
    "llm.editor.executorch.hint": "Models are selected in chat. Configure generation settings below.",

    // Provider Type Change
    "llm.editor.changeType.title": "Change Provider Type?",
    "llm.editor.changeType.warning": "Changing provider type will remove incompatible settings.",

    // Local Provider Testing
    "llm.editor.test.local.success": "Local model validated successfully",
    "llm.editor.test.local.failed": "Failed to validate local model",

    // ExecuTorch Generation Config
    "llm.editor.generationConfig.title": "Generation Config",
    "llm.editor.generationConfig.hint": "These settings are applied when loading the model",
    "llm.editor.generationConfig.temperature": "Temperature",
    "llm.editor.generationConfig.temperatureHint": "Controls randomness (0.0-2.0)",
    "llm.editor.generationConfig.topp": "Top-P",
    "llm.editor.generationConfig.toppHint": "Nucleus sampling threshold (0.0-1.0)",
    "llm.editor.generationConfig.batchSize": "Token Batch Size",
    "llm.editor.generationConfig.batchSizeHint": "Soft upper limit on tokens per batch",
    "llm.editor.generationConfig.batchInterval": "Batch Interval (ms)",
    "llm.editor.generationConfig.batchIntervalHint": "Time between consecutive token batches",

    // Common
    "common.continue": "Continue",

    // Provider Types - Display Names
    "provider.openai": "OpenAI",
    "provider.openai-spec": "OpenAI Compatible",
    "provider.anthropic": "Anthropic Claude",
    "provider.ollama": "Ollama",
    "provider.executorch": "ExecuTorch (Local)",
    "provider.llama-cpp": "Llama.cpp (Local)",

    // Provider Types - Descriptions
    "provider.openai.description": "Official OpenAI API (GPT-4, etc.)",
    "provider.openai-spec.description": "OpenAI-compatible API (LM Studio, etc.)",
    "provider.anthropic.description": "Anthropic Claude API with thinking support",
    "provider.ollama.description": "Local Ollama server",
    "provider.executorch.description": "On-device AI with Meta ExecuTorch (.pte models)",
    "provider.llama-cpp.description": "Run GGUF models locally with llama.cpp",

    // Chat Screen
    "chat.input.placeholder": "Type a message...",
    "chat.input.placeholder.noLlm": "Select an LLM to start chatting...",
    "chat.persona.select": "Select Persona",
    "chat.persona.none": "No Persona",
    "chat.persona.noneDesc": "Use default AI behavior",
    "chat.persona.empty": "No personas created yet. Create one in Settings.",
    "chat.persona.current": "Persona: {name}",

    // Model Settings Panel
    "chat.settings.provider": "Provider",
    "chat.settings.provider.select": "Select Provider",
    "chat.settings.provider.empty": "No providers configured. Add one in Settings.",
    "chat.settings.model": "Model",
    "chat.settings.model.select": "Select Model",
    "chat.settings.model.loading": "Loading models...",
    "chat.settings.model.empty": "No models available. Check provider connection.",
    "chat.settings.persona": "Persona",
    "chat.settings.persona.none": "No Persona",
    "chat.settings.persona.noneDesc": "Use default assistant behavior",
    "chat.settings.persona.empty": "No personas created yet.",

    // Model Selector
    "chat.modelSelector.title": "Select Model",
    "chat.modelSelector.empty": "No LLM providers configured.\nAdd one in Settings.",
    "chat.modelSelector.noModels.local": "No models downloaded. Download a model to use it.",
    "chat.modelSelector.noModels.remote": "No models available. Check connection.",
    "chat.modelSelector.downloadModels": "Download Models",

    // Sidebar
    "sidebar.newChat": "New Chat",

    // Alerts
    "alert.error.default": "An error occurred",

    // Models Screen (Settings -> Models)
    "settings.models.title": "Models",
    "settings.models.description": "Download and manage AI models",
    "models.title": "Models",
    "models.search.placeholder": "Search models...",
    "models.filter.all": "All",
    "models.filter.downloading": "Downloading",
    "models.filter.downloaded": "Downloaded",
    "models.tag.executorch": "ExecuTorch",
    "models.download.start": "Download",
    "models.download.cancel": "Cancel Download",
    "models.download.complete": "Downloaded",
    "models.download.progress": "Downloading... {progress}%",
    "models.download.failed": "Download failed",
    "models.notification.title": "Downloading Model",
    "models.notification.complete": "Download Complete",
    "models.notification.failed": "Download Failed",
    "models.notification.cancelled": "Download Cancelled",
    "models.notification.permission": "Notification permission required for background downloads",
    "models.empty": "No models available",
    "models.empty.search": "No models match your search",
    "models.web.unsupported": "Model downloads are not supported on web. Use the mobile app.",

    // RAG Settings
    "settings.rag.title": "RAG (Document Context)",
    "settings.rag.provider": "RAG Provider",
    "settings.rag.provider.none": "Disabled",
    "settings.rag.provider.executorch": "ExecuTorch (Local)",
    "settings.rag.model": "Embedding Model",
    "settings.rag.model.select": "Select embedding model",
    "settings.rag.enabled": "RAG Enabled",
    "settings.rag.unsupported": "RAG is not supported on web. Use the mobile app.",

    // Sources
    "sources.title": "Document Sources",
    "sources.empty": "No documents added",
    "sources.empty.description": "Add PDF documents to use as context in your conversations.",
    "sources.add": "Add Document",
    "sources.add.button": "Add PDF",
    "sources.processing": "Processing...",
    "sources.delete.title": "Delete Source",
    "sources.delete.confirm": "Are you sure you want to delete \"{name}\"?",
    "sources.rename": "Rename",
    "sources.error.empty": "The document appears to be empty or unreadable.",
    "sources.error.processing": "Failed to process document.",

    // Chat Sources
    "chat.sources.button": "Add Context",
    "chat.sources.title": "Select Sources",
    "chat.sources.selected": "{count} source(s) selected",
    "chat.sources.none": "No sources selected",
    "chat.sources.clear": "Clear Selection",

    // Additional RAG Settings strings
    "settings.rag.configure": "Manage RAG Providers",
    "settings.rag.description": "Configure embedding models for document context",
    "settings.rag.status.enabled": "Enabled",
    "settings.rag.status.disabled": "Disabled",
    "settings.rag.disabled": "Disabled",
    "settings.rag.disabled.description": "RAG functionality is turned off",
    "settings.rag.status": "Status",
    "settings.rag.vectorStore": "Vector Store",
    "settings.rag.initializing": "Initializing...",
    "settings.rag.ready": "Ready",
    "settings.rag.notInitialized": "Not initialized",
    "settings.rag.initialize": "Initialize Now",

    // RAG Provider screens
    "rag.providers.title": "RAG Providers",
    "rag.add": "Add Provider",
    "rag.yourProviders": "Your Providers ({count})",
    "rag.default": "Default",
    "rag.model": "Model",
    "rag.noProviders": "No RAG providers configured",
    "rag.noEmbeddingModels": "No embedding models downloaded. Download an embedding model first.",
    "rag.noEmbeddingModelsTitle": "No Embedding Models",
    "rag.addProviderHint": "Tap + to add a RAG provider",
    "rag.empty.title": "No RAG Providers",
    "rag.empty.description": "Add a RAG provider to enable document-based context for your conversations.",
    "rag.delete.title": "Delete Provider",
    "rag.delete.confirm": "Are you sure you want to delete {name}?",
    "rag.editor.title": "RAG Provider",
    "rag.editor.create": "New RAG Provider",
    "rag.editor.edit": "Edit RAG Provider",
    "rag.editor.name": "Name",
    "rag.editor.namePlaceholder": "Enter provider name",
    "rag.editor.provider": "Provider",
    "rag.editor.model": "Embedding Model",
    "rag.editor.options": "Options",
    "rag.editor.setDefault": "Set as Default",
    "rag.editor.setDefaultHint": "Use this provider for generating embeddings",
    "rag.initRequired": "RAG initialization required",
    "rag.initRequiredHint": "Configure a RAG provider in settings first",
    "rag.initializing": "Initializing embedding model...",
    "rag.ready": "RAG ready",

    // Developer / Logs
    "settings.developer.title": "Developer",
    "settings.developer.logs": "View Logs",
    "settings.developer.logsDesc": "View and share application logs",
    "logs.title": "Logs",
    "logs.share": "Share",
    "logs.clear": "Clear",
    "logs.empty": "No logs yet",
    "logs.cleared": "Logs cleared",
    "logs.count": "{count} log entries",

    // Conversation Runtime Alerts
    "conversation.stopGeneration.title": "Stop Generation?",
    "conversation.stopGeneration.message": "The current conversation will stop generating if you switch. Do you want to continue?",
    "conversation.stopGeneration.switch": "Switch",

    // LLM Editor - Generation Settings (shared across providers)
    "llm.editor.generationSettings": "Generation Settings",
    "llm.editor.generationSettings.hint": "Optional. Leave empty for defaults.",
    "llm.editor.temperature": "Temperature",
    "llm.editor.temperature.hint": "Controls randomness (0.0-2.0)",
    "llm.editor.temperature.anthropic.hint": "Controls randomness (0.0-1.0)",
    "llm.editor.topP": "Top-P",
    "llm.editor.topP.hint": "Nucleus sampling (0.0-1.0)",
    "llm.editor.maxTokens": "Max Tokens",
    "llm.editor.maxTokens.hint": "Maximum output tokens",
    "llm.editor.presencePenalty": "Presence Penalty",
    "llm.editor.presencePenalty.hint": "Penalize new topics (-2.0 to 2.0)",
    "llm.editor.frequencyPenalty": "Frequency Penalty",
    "llm.editor.frequencyPenalty.hint": "Penalize repetition (-2.0 to 2.0)",
    "llm.editor.saved": "Settings saved",

    // Ollama Editor
    "llm.editor.baseUrl.ollama.hint": "URL of your Ollama server",
    "llm.editor.numPredict": "Num Predict",
    "llm.editor.numPredict.hint": "Maximum tokens to generate",
    "llm.editor.numCtx": "Context Window",
    "llm.editor.numCtx.hint": "Context window size in tokens",

    // Llama.cpp Editor
    "llm.editor.llama-cpp.hint": "Models are imported and selected in chat. Configure generation settings below.",
    "llm.editor.nCtx": "Context Window",
    "llm.editor.nCtx.hint": "Context window size in tokens",
    "llm.editor.repeatPenalty": "Repeat Penalty",
    "llm.editor.repeatPenalty.hint": "Penalize repetition (1.0 = no penalty)",
    "llm.editor.nPredict": "Max Tokens",
    "llm.editor.nPredict.hint": "Maximum tokens to generate",

    // Local Model Import Modal
    "localModel.import.title": "Import Local Model",
    "localModel.import.provider": "Provider",
    "localModel.import.supportedFormat": "Supported format: .{formats}",
    "localModel.import.modelType": "Model Type",
    "localModel.import.modelName": "Model Name",
    "localModel.import.modelNamePlaceholder": "Enter model name",
    "localModel.import.modelFile": "Model File",
    "localModel.import.modelFileRequired": "Model File *",
    "localModel.import.selectModelFile": "Select model file (.{formats})",
    "localModel.import.selectModelFileGeneric": "Select model file",
    "localModel.import.tokenizerFile": "Tokenizer File",
    "localModel.import.tokenizerFileRequired": "Tokenizer File *",
    "localModel.import.selectTokenizerFile": "Select tokenizer file (.json)",
    "localModel.import.tokenizerConfig": "Tokenizer Config (optional)",
    "localModel.import.selectConfigFile": "Select config file (.json)",
    "localModel.import.ggufInfo": "GGUF models include the tokenizer, so no separate tokenizer file is needed.",
    "localModel.import.importButton": "Import Model",
    "localModel.import.importedDescription": "Imported {type} model",

    // Sources Modal - RAG Status
    "rag.stale": "Sources need reprocessing with new model",
    "rag.reprocess": "Reprocess",
    "rag.notConfigured": "No RAG provider configured. Please configure one in Settings.",
    "rag.notReady": "RAG not ready. Please wait or configure RAG in Settings.",
    "sources.processing.progress": "Processing {current}/{total}...",

    // Misc UI
    "common.selectLLM": "Select LLM",
    "common.defaultError": "Error",
    "common.code": "code",

    // Welcome Onboarding (first launch)
    "onboarding.welcome": "Welcome to ModelFlux",
    "onboarding.slide1.title": "Your AI Companion",
    "onboarding.slide1.text": "Chat with multiple AI providers - OpenAI, Anthropic, Ollama, and run models locally on your device.",
    "onboarding.slide2.title": "Privacy First",
    "onboarding.slide2.text": "Run AI models locally with no data leaving your device. Your conversations stay yours.",
    "onboarding.slide3.title": "Document Context",
    "onboarding.slide3.text": "Use your PDF documents as context for more relevant and accurate conversations.",
    "onboarding.slide4.title": "Get Help Anytime",
    "onboarding.slide4.text": "Need help? Visit Settings → Help & Tutorials to learn about all features.",
    "onboarding.getStarted": "Get Started",
    "onboarding.next": "Next",
    "onboarding.github": "View on GitHub",
    "onboarding.website": "Visit Website",

    // Settings - App Section
    "settings.app.title": "App",
    "settings.app.help": "Help & Tutorials",
    "settings.app.help.desc": "Learn how to use ModelFlux features",

    // Help Screen (stateless feature guides)
    "help.title": "Help & Tutorials",
    "help.selectFeature": "Select a feature to learn more",
    "help.feature.providers": "Adding Providers",
    "help.feature.providers.desc": "Connect to AI services like OpenAI, Anthropic, or Ollama",
    "help.feature.rag": "Setting up RAG",
    "help.feature.rag.desc": "Use PDF documents as context for conversations",
    "help.feature.models": "Downloading Models",
    "help.feature.models.desc": "Download local AI models to use offline",
    "help.feature.conversation": "Starting Conversations",
    "help.feature.conversation.desc": "Create and manage AI conversations",
    "help.feature.switchModels": "Switching Models",
    "help.feature.switchModels.desc": "Change providers or models during a chat",
    "help.feature.persona": "Using Personas",
    "help.feature.persona.desc": "Customize AI behavior with personas",

    // Help slides - Providers
    "help.providers.slide1.title": "Open Settings",
    "help.providers.slide1.text": "Tap the gear icon in the sidebar or navigation to open Settings.",
    "help.providers.slide2.title": "Manage Providers",
    "help.providers.slide2.text": "Select 'Manage LLM Providers' to see all configured providers.",
    "help.providers.slide3.title": "Add New Provider",
    "help.providers.slide3.text": "Tap the + button to add a new provider. Choose from OpenAI, Anthropic, Ollama, or local models.",
    "help.providers.slide4.title": "Configure & Test",
    "help.providers.slide4.text": "Enter your API key or server URL, then test the connection before saving.",

    // Help slides - RAG
    "help.rag.slide1.title": "What is RAG?",
    "help.rag.slide1.text": "RAG (Retrieval-Augmented Generation) lets the AI use your documents to provide more accurate answers.",
    "help.rag.slide2.title": "Configure RAG Provider",
    "help.rag.slide2.text": "Go to Settings → Manage RAG Providers and add a provider with an embedding model.",
    "help.rag.slide3.title": "Add Documents",
    "help.rag.slide3.text": "In a conversation, tap 'Add Context' to select PDF documents as sources.",
    "help.rag.slide4.title": "Ask Questions",
    "help.rag.slide4.text": "The AI will now use your documents to answer questions more accurately.",

    // Help slides - Models
    "help.models.slide1.title": "Browse Models",
    "help.models.slide1.text": "Go to Settings → Models to browse available models for download.",
    "help.models.slide2.title": "Download a Model",
    "help.models.slide2.text": "Tap the download button on any model. Downloads continue in the background.",
    "help.models.slide3.title": "Select Provider",
    "help.models.slide3.text": "Models work with specific providers: .pte for ExecuTorch, .gguf for Llama.cpp.",
    "help.models.slide4.title": "Use in Chat",
    "help.models.slide4.text": "Select a local provider in chat and choose your downloaded model.",

    // Help slides - Conversation
    "help.conversation.slide1.title": "Start a New Chat",
    "help.conversation.slide1.text": "Tap 'New Chat' in the sidebar to start a fresh conversation.",
    "help.conversation.slide2.title": "Select Provider & Model",
    "help.conversation.slide2.text": "Use the model picker at the top to choose your AI provider and model.",
    "help.conversation.slide3.title": "Optional: Add Persona",
    "help.conversation.slide3.text": "Select a persona to customize how the AI responds to you.",
    "help.conversation.slide4.title": "Start Chatting",
    "help.conversation.slide4.text": "Type your message and tap send. The AI will respond based on your settings.",

    // Help slides - Switch Models
    "help.switchModels.slide1.title": "Open Model Picker",
    "help.switchModels.slide1.text": "Tap the model name at the top of the chat to open the model picker.",
    "help.switchModels.slide2.title": "Choose New Provider",
    "help.switchModels.slide2.text": "Select a different provider from the list to see its available models.",
    "help.switchModels.slide3.title": "Select Model",
    "help.switchModels.slide3.text": "Pick a model from the selected provider. Your conversation history is preserved.",
    "help.switchModels.slide4.title": "Continue Chatting",
    "help.switchModels.slide4.text": "The new model will now respond to your messages in the same conversation.",

    // Help slides - Persona
    "help.persona.slide1.title": "What are Personas?",
    "help.persona.slide1.text": "Personas customize how the AI behaves - its personality, expertise, and response style.",
    "help.persona.slide2.title": "Create a Persona",
    "help.persona.slide2.text": "Go to Settings → Personas → Create Persona to define a new character.",
    "help.persona.slide3.title": "Configure Behavior",
    "help.persona.slide3.text": "Set the persona's name, description, personality traits, and system prompt.",
    "help.persona.slide4.title": "Use in Chat",
    "help.persona.slide4.text": "When starting a new chat, select your persona from the persona picker.",
};
