/**
 * Unit tests for API routes
 * Run with: npm run test:unit
 */

import { describe, test, expect, beforeAll, afterAll } from "@playwright/test";

// Mock API route tests
describe("API Routes", () => {
  const API_URL = process.env.PLAYWRIGHT_API_URL || "http://localhost:3001";

  describe("/x402/services", () => {
    test("should return list of services", async ({ request }) => {
      const response = await request.get(`${API_URL}/x402/services`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty("services");
      expect(Array.isArray(data.services)).toBeTruthy();
      expect(data.services.length).toBeGreaterThan(0);
    });

    test("should include all required service fields", async ({ request }) => {
      const response = await request.get(`${API_URL}/x402/services`);
      const data = await response.json();
      const service = data.services[0];
      
      expect(service).toHaveProperty("id");
      expect(service).toHaveProperty("price");
      expect(service).toHaveProperty("description");
      expect(service).toHaveProperty("x402Enabled");
      expect(service.x402Enabled).toBe(true);
    });
  });

  describe("/x402/yield/:wallet", () => {
    test("should return yield for valid wallet", async ({ request }) => {
      const wallet = "TestWallet" + Date.now();
      const response = await request.get(`${API_URL}/x402/yield/${wallet}?demo=true`);
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty("wallet");
      expect(data).toHaveProperty("spendableYield");
      expect(data.spendableYield).toBeGreaterThanOrEqual(0);
    });

    test("should return 400 for invalid wallet", async ({ request }) => {
      const response = await request.get(`${API_URL}/x402/yield/invalid`);
      expect(response.status()).toBe(400);
    });
  });

  describe("Service execution", () => {
    test("should require payment preparation first", async ({ request }) => {
      const response = await request.post(`${API_URL}/x402/execute/gpt-4`, {
        data: {
          input: "test",
          paymentId: "invalid-id",
          walletAddress: "test",
        },
      });
      
      expect([400, 402]).toContain(response.status());
    });
  });
});
