// src/react/PayButton.tsx
import React, { useEffect, useState } from "react";
import { usePayment } from "./usePayment";

type Props = {
  amount: number;
  apiKey: string;
  callbackUrl?: string;
  note?: string;
  children?: React.ReactNode;
  className?: string;
  openPayUrlBase?: string;
  onCreated?: (paymentId: string) => void;
  onApproved?: (paymentId: string) => void;
  onError?: (err: Error) => void;
  popupWidth?: number;
  popupHeight?: number;
};

export function PayButton({
  amount,
  apiKey,
  callbackUrl,
  note,
  className,
  openPayUrlBase = "https://pay.adey.lol",
  onCreated,
  onApproved,
  onError,
  popupWidth = 500,
  popupHeight = 700,
}: Props) {
  const { startPayment, paymentId, status } = usePayment();
  const [loading, setLoading] = useState(false);
  const popupRef = React.useRef<Window | null>(null);
  const handledRef = React.useRef<Set<string>>(new Set());

  // derive allowed origin from openPayUrlBase for security checks
  const allowedOrigin = React.useMemo(() => {
    try {
      return new URL(openPayUrlBase).origin;
    } catch {
      return null;
    }
  }, [openPayUrlBase]);

  // Handle payment creation and opening payment popup
  useEffect(() => {
    if (!paymentId) return;
    if (handledRef.current.has(paymentId)) return;
    handledRef.current.add(paymentId);

    const payUrl = `${openPayUrlBase}/${encodeURIComponent(paymentId)}`;
    const left = (window.screen.width - popupWidth) / 2;
    const top = (window.screen.height - popupHeight) / 4;

    try {
      popupRef.current = window.open(
        payUrl,
        "AdeyPayPopup",
        `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`
      );

      if (!popupRef.current) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      // Focus the popup if it exists
      popupRef.current.focus();
    } catch (err) {
      console.error("PayButton popup error:", err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }

    onCreated?.(paymentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, openPayUrlBase, onCreated, onError, popupWidth, popupHeight]);

  // Listen for postMessage from popup (preferred)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // optional: verify origin if we have one
      if (allowedOrigin && event.origin !== allowedOrigin) return;

      const data = event.data ?? {};
      if (data?.type !== "ADEYPAY_PAYMENT") return;

      const incomingPaymentId: string | undefined = data.paymentId;
      const incomingStatus: string | undefined = data.status;

      // ensure the message is for the current payment
      if (paymentId && incomingPaymentId && incomingPaymentId !== paymentId) return;

      const key = `status-${incomingPaymentId ?? paymentId}`;
      if (handledRef.current.has(key)) return; // already handled

      if (incomingStatus === "approved") {
        handledRef.current.add(key);
        try {
          onApproved?.(incomingPaymentId ?? paymentId!);
        } catch (err) {
          console.error("onApproved handler error:", err);
        }

        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
      } else if (incomingStatus === "failed") {
        handledRef.current.add(key);
        onError?.(new Error("Payment failed (popup)"));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [allowedOrigin, onApproved, onError, paymentId]);

  // Handle payment status changes coming from usePayment()
  useEffect(() => {
    if (!status || !paymentId) return;

    const key = `status-${paymentId}`;
    if (handledRef.current.has(key)) return;

    if (status === "approved") {
      handledRef.current.add(key);
      onApproved?.(paymentId);

      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    } else if (status === "failed") {
      handledRef.current.add(key);
      onError?.(new Error("Payment failed"));
    }
  }, [status, paymentId, onApproved, onError]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount");
      }
      if (!apiKey) {
        throw new Error("API key is required");
      }

      const cbUrl = callbackUrl ?? `${window.location.origin}`;
      await startPayment({ amount, apiKey, callbackUrl: cbUrl, note });
    } catch (err) {
      console.error("PayButton error:", err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
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
        className={`${className ?? ""} adeypay-btn`.trim()}
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <span className="adeypay-spinner" aria-hidden="true" />
            <span>Creating...</span>
          </>
        ) : (
          "Pay With APAY"
        )}
      </button>
    </>
  );
}
