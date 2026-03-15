import { z } from 'zod';

export const WasteLogSchema = z.object({
  reporter_id: z.string().uuid(),
  item_name: z.string().min(2, "Item name must be at least 2 characters."),
  photo_url: z.string().url("A photo is required for us to be able to analyse the waste."),
  estimated_cost: z.number().positive("Please enter a valid cost."),
});

export type WasteLog = z.infer<typeof WasteLogSchema>;