import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/user";
import { stripeRouter } from "./routers/stripe"; 
import { chatRouter } from "./routers/chat";
import { setUpRouter } from "./routers/set-up";
import { surveyRouter } from "./routers/survey";

export const appRouter = createTRPCRouter({
  user: userRouter,
  stripe: stripeRouter, 
  chat: chatRouter,
  setUp: setUpRouter,
  survey: surveyRouter
});
 
export type AppRouter = typeof appRouter; 
export const createCaller = createCallerFactory(appRouter);
