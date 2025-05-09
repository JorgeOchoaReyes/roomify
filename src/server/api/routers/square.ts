import { z } from "zod"; 
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const redirectUri = (process.env.NODE_ENV === "production" ? process.env.REDIRECT_URI_PROD : process.env.REDIRECT_URI_DEV) ?? ""; 

export const squareRouter = createTRPCRouter({
  startOautCredentials: protectedProcedure
    .input(z.object({ 
      squareAppId: z.string(),
      squareAppSecret: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { squareAppId, squareAppSecret } = input;
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      await ctx.db.collection("users").doc(userId).set({
        squareAppId,
        squareAppSecret,
      }, { merge: true });

      const state = ctx.session.user?.uid;
      if (!state) {
        throw new Error("User not authenticated");
      } 
      const authorizationUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${squareAppId}&scope=MERCHANT_PROFILE_READ,ITEMS_READ,EMPLOYEES_READ,ORDERS_READ,PAYMENTS_READ,TIMECARDS_WRITE,&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`; 
      ctx.res.setHeader("Set-Cookie", `state=${state}; Path=/; HttpOnly; SameSite=Strict; Secure`);

      return { authorizationUrl };
 
    }),
  getSquareCredentials: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const userDoc = await ctx.db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return { squareAppId: null, squareAppSecret: null };
      }
      const userData = userDoc.data() as { squareAppId?: string; squareAppSecret?: string };
      return { squareAppId: userData?.squareAppId, squareAppSecret: userData?.squareAppSecret };
    }),
  checkSquareOathStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const userDoc = await ctx.db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return { isConnected: false };
      }
      const userData = userDoc.data() as { squareAccessToken?: string; squareRefreshToken?: string };
      return { isConnected: !!userData?.squareAccessToken && !!userData?.squareRefreshToken };
    }),
});