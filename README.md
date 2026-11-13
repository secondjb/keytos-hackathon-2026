# RxCheck — Intelligent Drug Interaction & Harm Reduction Engine
### 🏥 Keytos Hack 2026 — Track 02: Health Quest: Build for a Healthier Tomorrow

A modern, responsive React + Material UI web application designed to safeguard patient well-being through intelligent medication analysis, multi-drug pairwise verification ($N \ge 2$), lifestyle and recreational harm-reduction advisories, and clinical symptom triage.

---

## 🌟 Key Features

### 1. Multi-Drug Interaction Evaluation ($N \ge 2$)
- Evaluates prescription medications, over-the-counter (OTC) drugs, supplements, and recreational substances.
- Computes all $\binom{N}{2} = \frac{N(N-1)}{2}$ combinations in batch mode.
- Interactive **Interaction Matrix View** for rapid visual review of complex regimens, plus detailed expandable **Card Views**.

### 2. Clinical Status & Severity Stratification
- **Major Risk / ONC High Priority**: Prominent red alerts detailing mechanism of action, clinical significance, and patient management protocols.
- **Moderate / Minor**: Clear guidance on monitoring, interval spacing, and dosage adjustments.
- **No Record Found Warning**: Transparent alerts reminding users that the absence of a dataset record does **NOT** establish clinical safety, with instructions to consult a physician.

### 3. Multiple API Key Fallback & Quota Protection
- Supports comma-separated fallback API keys (`VITE_RXCHECK_API_KEYS`).
- Automatically rotates keys upon 429 rate limit or quota exhaustion.
- Built-in `localStorage` caching ensures identical queries use **0 API quota**.
- Integrated Key Manager modal lets users inspect remaining queries or supply custom keys.

### 4. Recreational Substance & Lifestyle Harm Reduction
- Standard pharmaceutical trials frequently exclude recreational substances.
- Curated, evidence-based, non-stigmatizing harm reduction advisory for **Alcohol, Cannabis (THC/CBD), Cocaine, MDMA, Nicotine, Kratom, High-Dose Caffeine**, and more.
- Critical warnings for dangerous combinations (e.g., Alcohol + Benzodiazepines/Opioids, MDMA/Cocaine + Antidepressants).

### 5. Symptom Assessment & Clinical Triage
- Correlates user-reported symptoms with their active medication regimen.
- Flags **Life-Threatening Emergency Red Flags** (e.g., internal bleeding on anticoagulants, respiratory depression, Serotonin Syndrome).

### 6. Physician Consultation Summary (Print & Copy)
- One-click generated printable medication summary and doctor checklist designed to facilitate productive discussions during clinical visits.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### 1. Clone & Install
```bash
git clone https://github.com/secondjb/keytos-hackathon-2026.git
cd keytos-hackathon-2026
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your RxCheck API key(s):
```env
# Primary API Key
VITE_RXCHECK_API_KEY=rxck_live_your_key_here

# Optional Fallback Keys (comma-separated for automatic failover)
VITE_RXCHECK_API_KEYS=key_1,key_2,key_3

# RxCheck Base Endpoint
VITE_RXCHECK_BASE_URL=https://api.rxcheck.dev/v1
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
```

---

## 🎨 Technology Stack
- **Framework**: React 19 + TypeScript + Vite
- **UI System**: Material UI (`@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`)
- **Theme**: Custom `ThemeProvider` supporting Light & Cyber-Dark themes
- **API**: RxCheck API (`api.rxcheck.dev/v1/interactions`) with exponential backoff & failover

---

## ⚖️ Clinical Disclaimer
RxCheck provides clinical dataset records and does not replace professional clinical judgment. Coverage and field detail vary by record and dataset release. Always consult a licensed medical provider or clinical pharmacist before starting, stopping, or altering any medication.
