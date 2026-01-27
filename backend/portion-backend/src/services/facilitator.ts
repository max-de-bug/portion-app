import { HTTPFacilitatorClient } from "@x402/core/http";
import type { PaymentPayloadV2, PaymentDetailsV2 } from "../types/x402-v2.js";

// Default Coinbase/x402 facilitator
const DEFAULT_FACILITATOR_URL = "https://x402.org/api";

/**
 * x402 Facilitator Client
 * 
 * Handles communication with the x402 facilitator for payment verification
 * and settlement tracking. 
 */
export const facilitatorClient = new HTTPFacilitatorClient({
  url: process.env.X402_FACILITATOR_URL || DEFAULT_FACILITATOR_URL,
});

/**
 * Verify a payment payload against service requirements
 */
export async function verifyPaymentWithFacilitator(
  paymentPayload: PaymentPayloadV2,
  paymentRequirements: PaymentDetailsV2
) {
  try {
    return await facilitatorClient.verify(paymentPayload as any, paymentRequirements as any);
  } catch (error) {
    console.error("[Facilitator] Verification failed:", error);
    throw error;
  }
}

/**
 * Settle a verified payment
 */
export async function settlePaymentWithFacilitator(
  paymentPayload: PaymentPayloadV2,
  paymentRequirements: PaymentDetailsV2
) {
  try {
    return await facilitatorClient.settle(paymentPayload as any, paymentRequirements as any);
  } catch (error) {
    console.error("[Facilitator] Settlement failed:", error);
    throw error;
  }
}
