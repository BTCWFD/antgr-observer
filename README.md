<div align="center">
  <img src="icons/logo.png" alt="Antigravity Observer Logo" width="120">
  
  # ANTIGRAVITY OBSERVER
  **Enterprise-Grade Mission Control for Autonomous Agent Operations**
</div>

---

## Executive Summary

Antigravity Observer is a specialized observation and orchestration platform designed for real-time monitoring of agentic workflows. By providing deep-stream visibility into token consumption, system telemetry, and multi-agent auditing, it empowers developers to govern local autonomous systems with unparalleled precision.

## Core Capabilities

### 1. Reactive Mission Intelligence
*   **Dynamic Event Stream**: Real-time throughput monitoring via a centralized `EventBus` architecture.
*   **Real Telemetry**: Live system monitoring (CPU/Memory) powered by a local Node.js WebSocket Bridge.
*   **Token ROI Monitoring**: Granular tracking of model costs with automated threshold alerts.

### 2. Multi-Agent Auditing System
*   **CTO Live Audit**: Real-time technical assessment of architecture, scalability, and security patterns.
*   **UX Mission Lab**: A pro-active design agent that recommends smart integrations and deployment buttons to optimize visual harmony and efficiency.

### 3. Autonomous Governance & Security
*   **Security Scanner**: Real-time pattern matching to detect and prevent PII and credential leaks (API keys, Private Keys, Slack tokens).
*   **Ethical Guardrails**: Validation of agent behavior against global AI safety standards.

## Architecture

The system follows a decoupled, reactive architecture:
-   **Frontend**: Chrome Extension (Manifest V3) built with an asynchronous EventBus.
-   **Backend**: Local Agent Bridge (Node.js) providing direct system telemetry via WebSockets.

## Installation & Setup

### 1. Chrome Extension
1.  Navigate to `chrome://extensions`.
2.  Enable **Developer Mode**.
3.  Select **Load unpacked** and point to the project root.

### 2. Local Agent Bridge (Telemetry Engine)

The Bridge can be run in two modes:

#### A. Binary Mode (Recommended for Production)
1.  Navigate to the `/bridge` directory.
2.  Double-click **`antigravity-bridge.exe`**.
3.  The mission terminal will open automatically and begin secure telemetry streaming.

#### B. Development Mode
1.  Open a terminal in the `/bridge` directory.
2.  Run `npm install` (first time only).
3.  Run `npm start` to initialize the stream.

> [!NOTE]
> The Bridge uses a secure **Auth Token** protocol to prevent unauthorized local network connections. The extension and bridge are pre-configured to handshake securely.

## Technical Specifications

| Objective | Specification |
|-----------|---------------|
| Manifest Protocol | Version 3 |
| Backend Bridge | Node.js / Standalone EXE |
| Security | Auth Token (Enforced) |
| Design Language | Mission Control (Neon/Glassmorphism) |
| Performance Target | < 50ms UI Latency |

---

<div align="center">
  <sub>Propiedad de Antigravity AI Operations. Todos los derechos reservados.</sub>
</div>
