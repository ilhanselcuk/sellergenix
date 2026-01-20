/**
 * Inngest Serve Handler
 *
 * This endpoint is called by Inngest to execute background functions
 * Must be deployed to /api/inngest for Inngest to discover functions
 */

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

// Create and export the serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
