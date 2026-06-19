// vitest.config.js
import { defineConfig } from "file:///sessions/stoic-inspiring-ride/mnt/bible3dsphere-frontend/node_modules/vitest/dist/config.js";
import react from "file:///sessions/stoic-inspiring-ride/mnt/bible3dsphere-frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vitest_config_default = defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/utils.js", "src/api.js", "src/store.js", "src/sanitize.js"]
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9zZXNzaW9ucy9zdG9pYy1pbnNwaXJpbmctcmlkZS9tbnQvYmlibGUzZHNwaGVyZS1mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL3N0b2ljLWluc3BpcmluZy1yaWRlL21udC9iaWJsZTNkc3BoZXJlLWZyb250ZW5kL3ZpdGVzdC5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL3N0b2ljLWluc3BpcmluZy1yaWRlL21udC9iaWJsZTNkc3BoZXJlLWZyb250ZW5kL3ZpdGVzdC5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIHNldHVwRmlsZXM6IFsnLi9zcmMvdGVzdC9zZXR1cC5qcyddLFxuICAgIGluY2x1ZGU6IFsnc3JjLyoqLyoue3Rlc3Qsc3BlY30ue2pzLGpzeCx0cyx0c3h9J10sXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHByb3ZpZGVyOiAndjgnLFxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uLXN1bW1hcnknXSxcbiAgICAgIGluY2x1ZGU6IFsnc3JjL3V0aWxzLmpzJywgJ3NyYy9hcGkuanMnLCAnc3JjL3N0b3JlLmpzJywgJ3NyYy9zYW5pdGl6ZS5qcyddLFxuICAgIH0sXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpVyxTQUFTLG9CQUFvQjtBQUM5WCxPQUFPLFdBQVc7QUFFbEIsSUFBTyx3QkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLE1BQU07QUFBQSxJQUNKLGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxJQUNULFlBQVksQ0FBQyxxQkFBcUI7QUFBQSxJQUNsQyxTQUFTLENBQUMsc0NBQXNDO0FBQUEsSUFDaEQsVUFBVTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsVUFBVSxDQUFDLFFBQVEsY0FBYztBQUFBLE1BQ2pDLFNBQVMsQ0FBQyxnQkFBZ0IsY0FBYyxnQkFBZ0IsaUJBQWlCO0FBQUEsSUFDM0U7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
