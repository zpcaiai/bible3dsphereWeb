// vite.config.js
import { defineConfig } from "file:///sessions/admiring-determined-ritchie/mnt/bible3dsphere-frontend/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/admiring-determined-ritchie/mnt/bible3dsphere-frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///sessions/admiring-determined-ritchie/mnt/bible3dsphere-frontend/vite.config.js";
function precacheManifestPlugin() {
  return {
    name: "precache-manifest",
    apply: "build",
    generateBundle(_, bundle) {
      const PRECACHE_EXCLUDE = /(krisp|livekit|maplibre|mapbox|deck|^assets\/pdf-)/;
      const files = Object.keys(bundle).filter((f) => /\.(js|css|woff2?)$/.test(f)).filter((f) => !PRECACHE_EXCLUDE.test(f)).map((f) => "/" + f);
      this.emitFile({
        type: "asset",
        fileName: "precache-manifest.json",
        source: JSON.stringify({ version: Date.now(), files })
      });
    }
  };
}
var vite_config_default = defineConfig({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins: [react(), precacheManifestPlugin()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url)) },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"]
  },
  publicDir: "public",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "three": ["three", "@react-three/fiber", "@react-three/drei"],
          "deck-luma": [
            "@deck.gl/core",
            "@deck.gl/layers",
            "@deck.gl/mapbox",
            "@luma.gl/core",
            "@luma.gl/engine",
            "@luma.gl/shadertools",
            "@luma.gl/webgl",
            "@math.gl/core",
            "@math.gl/web-mercator"
          ],
          "pdf": ["jspdf", "html2canvas"],
          "krisp": ["@livekit/krisp-noise-filter"]
        }
      }
    }
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      },
      "/wdbible": {
        target: "https://wd.bible",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wdbible/, "")
      }
    }
  },
  preview: {
    port: 4173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true
      },
      "/wdbible": {
        target: "https://wd.bible",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wdbible/, "")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvYWRtaXJpbmctZGV0ZXJtaW5lZC1yaXRjaGllL21udC9iaWJsZTNkc3BoZXJlLWZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvYWRtaXJpbmctZGV0ZXJtaW5lZC1yaXRjaGllL21udC9iaWJsZTNkc3BoZXJlLWZyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9hZG1pcmluZy1kZXRlcm1pbmVkLXJpdGNoaWUvbW50L2JpYmxlM2RzcGhlcmUtZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXG5cbi8vIFx1Njc4NFx1NUVGQVx1NjVGNlx1NEVBN1x1NTFGQSAvcHJlY2FjaGUtbWFuaWZlc3QuanNvblx1RkYwOFx1NTE2OFx1OTBFOCBoYXNoZWQgXHU0RUE3XHU3MjY5XHU4REVGXHU1Rjg0XHVGRjA5XHVGRjBDXG4vLyBzdy5qcyBcdTVCODlcdTg4QzVcdTk2MzZcdTZCQjVcdThCRkJcdTUzRDZcdTVFNzZcdTk4ODRcdTdGMTNcdTVCNThcdTIwMTRcdTIwMTRcdTRFOENcdTZCMjFcdThCQkZcdTk1RUVcdTUxNjhcdTk3NTlcdTYwMDFcdTc5RDJcdTVGMDBcdUZGMENcdTRFNUZcdTY4MzlcdTZDQkJcdTY1RTcgY2h1bmsgNDA0XHUzMDAyXG5mdW5jdGlvbiBwcmVjYWNoZU1hbmlmZXN0UGx1Z2luKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdwcmVjYWNoZS1tYW5pZmVzdCcsXG4gICAgYXBwbHk6ICdidWlsZCcsXG4gICAgZ2VuZXJhdGVCdW5kbGUoXywgYnVuZGxlKSB7XG4gICAgICAvLyBcdTYzOTJcdTk2NjRcdTVERThcdTU3OEJcdTYzMDlcdTk3MDBcdTU3M0FcdTY2NkZcdTUzMDVcdUZGMDhcdThCRURcdTk3RjNcdTk2NERcdTU2NkEgd2FzbS9saXZla2l0L1BERi9cdTU3MzBcdTU2RkVcdUZGMDlcdTIwMTRcdTIwMTRcdTUzRUFcdTU3MjhcdThGREJcdTUxNjVcdTVCRjlcdTVFOTRcdTUyOUZcdTgwRkRcdTY1RjZcdTRFMEJcdThGN0RcdUZGMENcbiAgICAgIC8vIFx1OTA3Rlx1NTE0RCBTVyBcdTVCODlcdTg4QzVcdTk2MzZcdTZCQjVcdTk4ODRcdTUzRDYgNE1CKyBcdTYyRDZcdTYxNjJcdTk5OTZcdTg4QzVcdTRFMEVcdTZENDFcdTkxQ0ZcbiAgICAgIGNvbnN0IFBSRUNBQ0hFX0VYQ0xVREUgPSAvKGtyaXNwfGxpdmVraXR8bWFwbGlicmV8bWFwYm94fGRlY2t8XmFzc2V0c1xcL3BkZi0pL1xuICAgICAgY29uc3QgZmlsZXMgPSBPYmplY3Qua2V5cyhidW5kbGUpXG4gICAgICAgIC5maWx0ZXIoKGYpID0+IC9cXC4oanN8Y3NzfHdvZmYyPykkLy50ZXN0KGYpKVxuICAgICAgICAuZmlsdGVyKChmKSA9PiAhUFJFQ0FDSEVfRVhDTFVERS50ZXN0KGYpKVxuICAgICAgICAubWFwKChmKSA9PiAnLycgKyBmKVxuICAgICAgdGhpcy5lbWl0RmlsZSh7XG4gICAgICAgIHR5cGU6ICdhc3NldCcsXG4gICAgICAgIGZpbGVOYW1lOiAncHJlY2FjaGUtbWFuaWZlc3QuanNvbicsXG4gICAgICAgIHNvdXJjZTogSlNPTi5zdHJpbmdpZnkoeyB2ZXJzaW9uOiBEYXRlLm5vdygpLCBmaWxlcyB9KSxcbiAgICAgIH0pXG4gICAgfSxcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBlbnZQcmVmaXg6IFsnVklURV8nLCAnTkVYVF9QVUJMSUNfJ10sXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBwcmVjYWNoZU1hbmlmZXN0UGx1Z2luKCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHsgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSkgfSxcbiAgICBkZWR1cGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0L2pzeC1ydW50aW1lJywgJ3JlYWN0L2pzeC1kZXYtcnVudGltZSddLFxuICB9LFxuICBwdWJsaWNEaXI6ICdwdWJsaWMnLFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAndGhyZWUnOiBbJ3RocmVlJywgJ0ByZWFjdC10aHJlZS9maWJlcicsICdAcmVhY3QtdGhyZWUvZHJlaSddLFxuICAgICAgICAgICdkZWNrLWx1bWEnOiBbXG4gICAgICAgICAgICAnQGRlY2suZ2wvY29yZScsXG4gICAgICAgICAgICAnQGRlY2suZ2wvbGF5ZXJzJyxcbiAgICAgICAgICAgICdAZGVjay5nbC9tYXBib3gnLFxuICAgICAgICAgICAgJ0BsdW1hLmdsL2NvcmUnLFxuICAgICAgICAgICAgJ0BsdW1hLmdsL2VuZ2luZScsXG4gICAgICAgICAgICAnQGx1bWEuZ2wvc2hhZGVydG9vbHMnLFxuICAgICAgICAgICAgJ0BsdW1hLmdsL3dlYmdsJyxcbiAgICAgICAgICAgICdAbWF0aC5nbC9jb3JlJyxcbiAgICAgICAgICAgICdAbWF0aC5nbC93ZWItbWVyY2F0b3InLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgJ3BkZic6IFsnanNwZGYnLCAnaHRtbDJjYW52YXMnXSxcbiAgICAgICAgICAna3Jpc3AnOiBbJ0BsaXZla2l0L2tyaXNwLW5vaXNlLWZpbHRlciddLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICAnL3dkYmlibGUnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vd2QuYmlibGUnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IHBhdGggPT4gcGF0aC5yZXBsYWNlKC9eXFwvd2RiaWJsZS8sICcnKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxNzMsXG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDAwJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgfSxcbiAgICAgICcvd2RiaWJsZSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly93ZC5iaWJsZScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogcGF0aCA9PiBwYXRoLnJlcGxhY2UoL15cXC93ZGJpYmxlLywgJycpLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1gsU0FBUyxvQkFBb0I7QUFDL1ksT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZSxXQUFXO0FBRnFNLElBQU0sMkNBQTJDO0FBTXpSLFNBQVMseUJBQXlCO0FBQ2hDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxJQUNQLGVBQWUsR0FBRyxRQUFRO0FBR3hCLFlBQU0sbUJBQW1CO0FBQ3pCLFlBQU0sUUFBUSxPQUFPLEtBQUssTUFBTSxFQUM3QixPQUFPLENBQUMsTUFBTSxxQkFBcUIsS0FBSyxDQUFDLENBQUMsRUFDMUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsS0FBSyxDQUFDLENBQUMsRUFDdkMsSUFBSSxDQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3JCLFdBQUssU0FBUztBQUFBLFFBQ1osTUFBTTtBQUFBLFFBQ04sVUFBVTtBQUFBLFFBQ1YsUUFBUSxLQUFLLFVBQVUsRUFBRSxTQUFTLEtBQUssSUFBSSxHQUFHLE1BQU0sQ0FBQztBQUFBLE1BQ3ZELENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsV0FBVyxDQUFDLFNBQVMsY0FBYztBQUFBLEVBQ25DLFNBQVMsQ0FBQyxNQUFNLEdBQUcsdUJBQXVCLENBQUM7QUFBQSxFQUMzQyxTQUFTO0FBQUEsSUFDUCxPQUFPLEVBQUUsS0FBSyxjQUFjLElBQUksSUFBSSxTQUFTLHdDQUFlLENBQUMsRUFBRTtBQUFBLElBQy9ELFFBQVEsQ0FBQyxTQUFTLGFBQWEscUJBQXFCLHVCQUF1QjtBQUFBLEVBQzdFO0FBQUEsRUFDQSxXQUFXO0FBQUEsRUFDWCxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixTQUFTLENBQUMsU0FBUyxzQkFBc0IsbUJBQW1CO0FBQUEsVUFDNUQsYUFBYTtBQUFBLFlBQ1g7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLE9BQU8sQ0FBQyxTQUFTLGFBQWE7QUFBQSxVQUM5QixTQUFTLENBQUMsNkJBQTZCO0FBQUEsUUFDekM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLE1BQ0EsWUFBWTtBQUFBLFFBQ1YsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxVQUFRLEtBQUssUUFBUSxjQUFjLEVBQUU7QUFBQSxNQUNoRDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsVUFBUSxLQUFLLFFBQVEsY0FBYyxFQUFFO0FBQUEsTUFDaEQ7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
