import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  migrations: {
    seed: "ts-node --project prisma/tsconfig.json prisma/seed.ts"
  }
});