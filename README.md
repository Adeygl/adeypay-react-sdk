# AdeyPay SDK

![npm version](https://img.shields.io/npm/v/adeypay-sdk?color=green&style=flat-square)
![License](https://img.shields.io/npm/l/adeypay-sdk?color=blue&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)

A simple and secure JavaScript/TypeScript SDK to integrate AdeyPay payments into your **web, React, or Vue** projects. This SDK is designed for **merchants** to easily embed a payment button and process transactions safely.

---

## 🚀 Features

- 🔒 **Secure** payment processing via AdeyPay API
- ⚡ **Quick setup** — ready in minutes
- 🛠 **React components**, **Vue support**, + plain JavaScript
- 📡 Web popup for payment approval
- 💳 Supports multiple currencies

---

## 📦 Installation

```bash
npm install adeypay-sdk

# Using yarn
yarn add adeypay-sdk
```

---

## 📖 Usage

### Plain JavaScript / TypeScript (vanilla)

---

### React (JSX / TSX)

```tsx
import { PayButton } from "adeypay-sdk/react";

export default function App() {
  return (
    <div>
      <h1>Buy Coffee</h1>
      <PayButton
        amount={5}
        apiKey="YOUR_MERCHANT_API_KEY"
        callbackUrl="https://yourapp.com"
        onCreated={(id) => console.log("Payment created:", id)}
        onApproved={(id) => console.log("Payment approved:", id)}
        onError={(err) => console.error("Payment error:", err)}
      />
    </div>
  );
}
```

### React — Deposit Example (state)

```tsx
import { PayButton } from "adeypay-sdk";
import { useState, useMemo } from "react";

export default function DepositPage() {
  const [balance, setBalance] = useState(0);
  const [amountInput, setAmountInput] = useState("10.00");

  const amount = useMemo(() => parseFloat(amountInput) || 0, [amountInput]);

  function handleCreated(id: string) {
    console.log("Payment created:", id);
  }

  function handleApproved(id: string) {
    console.log("Payment approved:", id);
    setBalance((b) => b + amount);
  }

  function handleError(err: Error) {
    console.error("Payment error:", err);
  }

  return (
    <div>
      <h1>Deposit Funds</h1>
      <input
        value={amountInput}
        onChange={(e) => setAmountInput(e.target.value)}
      />
      <PayButton
        amount={amount}
        apiKey="YOUR_MERCHANT_API_KEY"
        callbackUrl={window.location.href}
        onCreated={handleCreated}
        onApproved={handleApproved}
        onError={handleError}
      />
      <p>Balance: ${"" + balance.toFixed(2)}</p>
    </div>
  );
}
```

### React — Withdraw Example (state)

```tsx
import { WithdrawButton } from "adeypay-sdk";
import { useState, useMemo } from "react";

export default function DepositPage() {
  const [balance, setBalance] = useState(0);
  const [amountInput, setAmountInput] = useState("10.00");

  const amount = useMemo(() => parseFloat(amountInput) || 0, [amountInput]);

  function handleCreated(id: string) {
    console.log("Payment created:", id);
  }

  function handleApproved(id: string) {
    console.log("Payment approved:", id);
    setBalance((b) => b - amount);
  }

  function handleError(err: Error) {
    console.error("Payment error:", err);
  }

  return (
    <div>
      <h1>Withdraw Funds</h1>
      <input
        value={amountInput}
        onChange={(e) => setAmountInput(e.target.value)}
      />

      <WithdrawButton
        apiKey={"YOUR_MERCHANT_API_KEY"} // prefer createPayout server-side
        amount={typeof withdrawAmount === "number" ? withdrawAmount : 0}
        toEmail={accountEmail}
        minAmount={5}
        maxAmount={balance}
        onCreated={handleWithdrawCreated}
        onApproved={handleWithdrawApproved}
        onError={handleError}
        className="w-full py-2 rounded bg-purple-600 hover:bg-purple-500"
      >
        Withdraw
      </WithdrawButton>
      <p>Balance: ${"" + balance.toFixed(2)}</p>
    </div>
  );
}
```

---

### Vue 3 (Composition API)

```vue
<script setup lang="ts">
import { ref } from "vue";
import { PayButton } from "adeypay-sdk/vue";

const balance = ref(0);
const amountInput = ref("10.00");

const handleCreated = (id: string) => {
  console.log("Payment created:", id);
};

const handleApproved = (id: string) => {
  console.log("Payment approved:", id);
  balance.value += parseFloat(amountInput.value) || 0;
};

const handleError = (err: Error) => {
  console.error("Payment error:", err);
};
</script>

<template>
  <div>
    <h1>Deposit Funds</h1>
    <input v-model="amountInput" placeholder="Enter amount" />

    <PayButton
      :amount="parseFloat(amountInput) || 0"
      apiKey="YOUR_MERCHANT_API_KEY"
      :callbackUrl="window.location.href"
      :onCreated="handleCreated"
      :onApproved="handleApproved"
      :onError="handleError"
    >
      Deposit Now
    </PayButton>

    <p>Balance: ${{ balance.toFixed(2) }}</p>
  </div>
</template>
```

> If you use `volar`/TypeScript in Vue projects, the package exposes types. If your build complains about the imported component being a React component, ensure you configure Vite/Rollup to treat `adeypay-sdk` as a library with proper exports for Vue and ESM builds.

---

## 🔧 Props / API Reference

| Prop          | Type                   | Required | Description                     |
| ------------- | ---------------------- | -------- | ------------------------------- |
| `amount`      | `number`               | ✅       | Payment amount (must be > 0)    |
| `apiKey`      | `string`               | ✅       | Your merchant API key           |
| `callbackUrl` | `string`               | ✅       | URL to redirect after payment   |
| `note`        | `string`               | ❌       | Optional payment note           |
| `children`    | `ReactNode / Slot`     | ❌       | Custom button content           |
| `className`   | `string`               | ❌       | Tailwind/other CSS classes      |
| `onCreated`   | `(id: string) => void` | ❌       | Called when payment is created  |
| `onApproved`  | `(id: string) => void` | ❌       | Called when payment is approved |
| `onError`     | `(err: Error) => void` | ❌       | Called when an error occurs     |
| `popupWidth`  | `number`               | ❌       | Default `900`                   |
| `popupHeight` | `number`               | ❌       | Default `700`                   |

---

## 🔑 Setup

1. **Get your API key**

   Sign up and create a merchant account at the AdeyPay Dashboard (for example: `https://developer.adey.lol`). Once registered, go to your dashboard to get your merchant key.

2. **Read the full documentation**

   Visit the docs at your hosted docs site (for example: `https://developer.adey.lol/docs`).

3. **Server-side verification (recommended)**

   After the payment is approved, call your server to verify the payment with AdeyPay's API or your backend. Do not rely on client-only signals for critical account balance operations.

---

## ✅ Best practices

- Always verify transactions server-side using the AdeyPay API + your merchant key.
- Use HTTPS for callback URLs.
- Keep your `apiKey` secret on server-side endpoints — avoid embedding privileged keys directly in public front-end builds.
- For client-facing flows, prefer creating a temporary payment request on your server then call the SDK with a short-lived `clientKey` or token.

---

## 🐞 Troubleshooting

- **Button doesn't render** — Ensure you imported the component correctly, and the `amount` prop is a positive number.
- **Popup blocked** — Browsers may block popups triggered outside a direct user interaction. Ensure the button click directly opens the popup.
- **CORS or 401 errors** — Verify your server endpoints and API key permissions.

---

## 🔁 Changelog

- **v1.0.0** — Initial public release (React + Vue + plain JS support)

---

## 🤝 Contributing

Contributions are welcome! Please open issues or PRs on the repo. Suggested workflow:

1. Fork the repo
2. Create a feature branch
3. Add tests / examples
4. Open a PR

---

## 📜 License

MIT © AdeyPay

---

## Contact / Support

If you need help integrating the SDK, open an issue or contact the AdeyPay support team through your dashboard.
