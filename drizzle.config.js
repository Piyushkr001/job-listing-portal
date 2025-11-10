import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './config/schema.tsx',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://neondb_owner:npg_VmINSo25jFie@ep-square-butterfly-a8qz7bky-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
});
