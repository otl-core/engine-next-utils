import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    env: {
      DEPLOYMENT_ID: "test-deploy-id",
      DEPLOYMENT_ACCESS_TOKEN: "kpt_test-token",
      API_URL: "https://api.test.com",
    },
  },
});
