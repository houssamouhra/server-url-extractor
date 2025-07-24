import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["backend/sql-server.ts"], // or your actual entry
  outDir: "dist",
  format: ["esm"],
  target: "es2022",
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  shims: true, // for import.meta
  esbuildOptions(options) {
    options.alias = {
      "@backend": "./backend",
      "@helpers": "./helpers",
      "@services": "./services",
      "@database": "./database",
    };
  },
});
