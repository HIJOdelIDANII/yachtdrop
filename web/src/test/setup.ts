import "@testing-library/jest-dom/vitest";
import { server } from "./mocks/server";
import { afterAll, afterEach, beforeAll } from "vitest";

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers between tests
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
