import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  createUser: protectedProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input, ctx}) => {  
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
});
