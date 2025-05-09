import { initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";
import { db, auth, app } from "./firebase-admin"; 
import type { UserRecord } from "firebase-admin/auth";

type CreateContextOptions = {
  session: {
    user: UserRecord | null;
  };
  req: CreateNextContextOptions["req"];
  res: CreateNextContextOptions["res"];
};
 
const createInnerTRPCContext = (_opts: CreateContextOptions) => {
  return {
    db: db,
    auth: auth,
    session: {
      user: _opts.session.user,
    },
    req: _opts.req,
    res: _opts.res,
  };
};
 
export const createTRPCContext = async (_opts: CreateNextContextOptions) => {
  const { req, res } = _opts;
  const firebasetokenCookie = req.cookies["firebase-token"];
  if (!firebasetokenCookie) {
    return createInnerTRPCContext({
      session: {
        user: null,
      },
      req,
      res,
    });
  } 
  const decodedToken = await app.auth().verifyIdToken(firebasetokenCookie);
  const uid = decodedToken.uid;
  const user = await app.auth().getUser(uid);

  return createInnerTRPCContext({
    session: {
      user: user,
    },
    req,
    res,
  });
};
 
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
}); 

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
 
  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

const authMiddleware = t.middleware(async ({ next, ctx }) => {
  if (!ctx.session.user) {
    throw new Error("Unauthorized");
  }
  return next({
    ctx: {
      user: ctx.session.user,
    },
  });
});
 
export const publicProcedure = t.procedure.use(timingMiddleware);
export const protectedProcedure = t.procedure.use(authMiddleware);
