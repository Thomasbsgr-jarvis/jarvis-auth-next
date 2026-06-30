import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    server: "src/server.ts",
  },
  format: ["esm", "cjs"],
  target: "node22",
  dts: true,
  sourcemap: true,
  clean: true,
})
