import { defineConfig } from 'orval';

export default defineConfig({
  payroll: {
    input: 'http://localhost:5117/swagger/v1/swagger.json',
    output: {
      mode: 'split',
      target: 'src/generated/payrollApi.ts',
      schemas: 'src/generated/models',
      client: 'react-query',
      // Optional: We can add a custom axios instance later if we need Auth tokens
    },
  },
});