import { runNearbyServiceCategoriesContractTests } from "./NearbyServiceCategories.test.js";
import { runNearbyServiceLinksContractTests } from "./NearbyServiceLinks.test.js";
import { runNearbyServicesServiceContractTests } from "./NearbyServicesService.test.js";

/**
 * Entry point for all Nearby Services framework-neutral contract tests.
 *
 * These tests do not require a test runner, real API credentials, or a network connection.
 *
 * Usage: node --experimental-strip-types src/services/nearby-services/__tests__/NearbyServicesFoundation.test.ts
 */
export async function runNearbyServicesFoundationContractTests() {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const suites = [
    {
      name: "Category recommendation mapping",
      run: runNearbyServiceCategoriesContractTests,
    },
    { name: "Request validation", run: runNearbyServicesServiceContractTests },
    { name: "Deep-link construction", run: runNearbyServiceLinksContractTests },
  ];

  for (const suite of suites) {
    try {
      await suite.run();
      results.push({ name: suite.name, passed: true });
      console.log(`[PASS] ${suite.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ name: suite.name, passed: false, error: message });
      console.error(`[FAIL] ${suite.name}: ${message}`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Self-execute when run directly
const isNode = typeof process !== "undefined" && process?.versions?.node;
if (isNode && process?.argv?.[1]?.includes("NearbyServicesFoundation")) {
  runNearbyServicesFoundationContractTests();
}
