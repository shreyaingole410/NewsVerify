import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { VerifyResponse } from "./types";

export const verifyClaim = createServerFn({ method: "POST" })
  .inputValidator((d: { claim: string }) => z.object({ claim: z.string().trim().min(8).max(5000) }).parse(d))
  .handler(async ({ data }): Promise<VerifyResponse> => {
    const { runClaim } = await import("./engine.server");
    return runClaim(data.claim);
  });

export const verifyArticleUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => z.object({ url: z.string().trim().min(8).max(2048) }).parse(d))
  .handler(async ({ data }): Promise<VerifyResponse> => {
    const { runArticle } = await import("./engine.server");
    return runArticle(data.url);
  });
