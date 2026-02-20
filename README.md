# 🚀 ModelFlux

**ModelFlux** is an open-source, offline-first LLM runtime for mobile that lets you run, switch, and orchestrate local and remote models with full control over your data.

It supports multiple inference engines including:

* 🦙 **llama.cpp** (GGUF models)
* ⚡ **ExecuTorch** (PyTorch on-device inference)
* ☁ Cloud providers (OpenAI, Anthropic, etc.)
* 🏠 Self-hosted providers (Ollama, custom REST)

🌐 Website: [https://modelflux.harshalkudale.com/](https://modelflux.harshalkudale.com/)

---

## ✨ Why ModelFlux?

Most AI apps are just chat wrappers around cloud APIs.

ModelFlux is different:

* Runs models **directly on Android and iOS**
* Works **fully offline**
* Lets you switch models mid-conversation
* Separates LLM, embedding, and RAG database providers
* Gives you export/import control
* Designed for power users and developers

This is a **model runtime + orchestration layer**, not just a chat app.

---

## 🧠 Core Features

### 🦙 Local Model Execution

* GGUF support via **llama.cpp**
* On-device inference
* Download and manage models in-app

### ⚡ ExecuTorch Support

* Native PyTorch runtime on mobile
* Optimized on-device execution
* Foundation for future mobile-native model formats

### 🔀 Provider-Based Architecture

You can configure:

* LLM Providers (Local, OpenAI, Anthropic, REST)
* Embedding Providers (Local or Cloud)
* RAG Database Providers (Local or Remote)

Mix and match freely.

---

## 🔍 Hybrid RAG Support

ModelFlux separates RAG into independent components:

1. **Embedding Provider**
2. **Vector Database**
3. **LLM Provider**

This enables combinations like:

* Local embeddings + local vector DB (fully offline)
* Local embeddings + Oracle 23ai DB
* OpenAI embeddings + remote DB
* Fully cloud-based setup

No lock-in. No forced architecture.

---

## 🏗 Architecture Overview

```
ModelFlux
├── App Layer (React Native / Expo)
│   ├── UI
│   ├── Provider Config
│   └── Chat Interface
│
├── Inference Engines
│   ├── llama.cpp (GGUF)
│   └── ExecuTorch
│
├── Providers
│   ├── LLM Providers
│   ├── Embedding Providers
│   └── RAG Database Providers
│
└── Storage
    ├── WatermelonDB
    └── Local Model Files
```

---

## 🧰 Tech Stack

* React Native (Expo)
* TypeScript
* llama.cpp (GGUF runtime)
* ExecuTorch (PyTorch mobile runtime)
* WatermelonDB
* Native bridges (Android & iOS)

⚠️ Because of native modules, **Expo prebuild is required**.

---

## 📦 Development Setup

### Requirements

* Node.js 16+
* Yarn or npm
* Expo CLI
* Android Studio / Xcode

### Clone the repository

```bash
git clone https://github.com/HarshalKudale/modelflux.git
cd modelflux
```

### Install dependencies

```bash
yarn install
```

### Prebuild (required for native modules)

```bash
npx expo prebuild
```

### Run on Android

```bash
npx expo run:android
```

### Run on iOS

```bash
npx expo run:ios
```

---

## 🔧 Model Management

* Browse curated GGUF models
* Download directly inside the app
* Manage storage
* Switch active model mid-conversation
* Create reusable presets

---

## 📤 Data Control

* Export conversations
* Import configurations
* Full local storage
* No mandatory cloud dependency

Your data. Your models. Your rules.

---

## 🤝 Contributing

ModelFlux is fully open source and welcomes contributions.

You can help by:

* Adding new providers
* Improving RAG pipelines
* Enhancing UI/UX
* Optimizing inference performance
* Expanding documentation

Before submitting a PR:

```bash
yarn lint
```

---

## 📜 License

MIT License
See the LICENSE file for details.

---

## 👤 Author

Harshal Kudale
Website: [https://harshalkudale.com](https://harshalkudale.com)
Project: [https://modelflux.harshalkudale.com/](https://modelflux.harshalkudale.com/)

---

## ⭐ Support

If ModelFlux helps you, consider starring the repository.
