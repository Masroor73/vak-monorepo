import { z } from 'zod';
export const WasteLogSchema = z.object({
  reporter_id: z.string().uuid(),
  item_name: z.string().min(2, "Item name is required"),
  photo_url: z.string().url(),
  estimated_cost: z.number().positive(),
  // Can add 'waste_reason' enum later if needed
});
export type WasteLog = z.infer<typeof WasteLogSchema>;
 