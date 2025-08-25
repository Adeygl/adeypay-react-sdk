// src/components/WithdrawButton.tsx
import React, { useState } from "react";
import { requestPayoutByEmail } from "../api"; // adjust path as needed

export type WithdrawPayload = {
  amount: number;
  toEmail: string;
  note?: string;
};

type Props = {
  /** Optional static values, or the parent can provide getPayload */
  amount?: number;
  toEmail?: string;
  note?: string;

  /** If provided, used instead of internal requestPayoutByEmail */
  createPayout?: (args: {
    amount: number;
    toEmail: string;
    note?: string;
    apiKey?: string;
    idempotencyKey?: string;
  }) => Promise<{ payoutId: string }>;

  apiKey?: string;

  /** Called immediately after server returns (created) */
  onCreated?: (payoutId: string, amount?: number) => void;

  /** Called when payout is accepted/approved (for UI) */
  onApproved?: (payoutId: string, amount?: number) => void;

  /** Called on any error */
  onError?: (err: Error) => void;

  /** A function the parent can provide to *read current inputs* just before click */
  getPayload?: () => WithdrawPayload | null | undefined;

  minAmount?: number;
  maxAmount?: number;

  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
};

/**
 * WithdrawButton
 * - Renders only a button
 * - Parent may pass `amount`/`toEmail` props OR a `getPayload()` callback
 * - emits onCreated/onApproved/onError callbacks
 */
export default function WithdrawButton({
  amount: amountProp,
  toEmail: toEmailProp,
  note,
  createPayout,
  apiKey,
  onCreated,
  onApproved,
  onError,
  getPayload,
  minAmount = 5,
  maxAmount,
  disabled = false,
  className,
  children,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading || disabled) return;

    // Obtain payload: prefer getPayload(), else props
    const payloadFromGetter =
      typeof getPayload === "function" ? getPayload() : undefined;
    const payload =
      payloadFromGetter ??
      (amountProp !== undefined || toEmailProp
        ? {
            amount: amountProp as number,
            toEmail: toEmailProp as string,
            note,
          }
        : null);

    if (!payload) {
      const err = new Error(
        "Withdrawal payload not provided. Provide amount/toEmail props or a getPayload() function."
      );
      onError?.(err);
      return;
    }

    const { amount, toEmail } = payload;

    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      const err = new Error("Invalid withdrawal amount.");
      onError?.(err);
      return;
    }

    if (amount < minAmount) {
      const err = new Error(`Minimum withdrawal is ${minAmount}.`);
      onError?.(err);
      return;
    }

    if (typeof maxAmount === "number" && amount > maxAmount) {
      const err = new Error(`Maximum withdrawal is ${maxAmount}.`);
      onError?.(err);
      return;
    }

    if (!toEmail || typeof toEmail !== "string") {
      const err = new Error("Recipient email required.");
      onError?.(err);
      return;
    }

    setLoading(true);

    try {
      const idempotencyKey = `ui-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      // Use provided createPayout or fallback to requestPayoutByEmail
      const res = createPayout
        ? await createPayout({ amount, toEmail, note, apiKey, idempotencyKey })
        : await requestPayoutByEmail({
            amount,
            toEmail,
            note,
            apiKey,
            idempotencyKey,
          });

      // Expect the library/server to return at least { payoutId }
      const payoutId =
        (res && (res as any).payoutId) || (res && (res as any).id) || "";

      if (!payoutId) {
        const err = new Error("No payout id returned from server.");
        onError?.(err);
        return;
      }

      // Inform parent that a payout was created (useful for deducting balance immediately)
      onCreated?.(payoutId, amount);

      // Treat successful response as approved/accepted for UI flows; parent may still poll if needed
      onApproved?.(payoutId, amount);
    } catch (rawErr) {
      const err = rawErr instanceof Error ? rawErr : new Error(String(rawErr));
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .adeypay-btn {
          background: linear-gradient(90deg, #FFEEAD 0%, #F59E0B 100%);
          color: #0b1220;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.2px;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(245,158,11,0.16);
          transition: transform 120ms ease, box-shadow 160ms ease, filter 120ms ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
        }

        .adeypay-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(245,158,11,0.22);
          filter: brightness(0.99);
        }

        .adeypay-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .adeypay-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .adeypay-btn:focus {
          outline: 4px solid rgba(245,158,11,0.20);
          outline-offset: 3px;
        }

        .adeypay-spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid rgba(0,0,0,0.08);
          border-top-color: #0b1220;
          display: inline-block;
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <button
        type="button"
        onClick={handleClick}
        disabled={loading || disabled}
        aria-busy={loading}
        className={`${className ?? ""} adeypay-btn`.trim()}
      >
        {loading ? "Processing..." : children ?? "Withdraw"}
      </button>
    </>
  );
}
