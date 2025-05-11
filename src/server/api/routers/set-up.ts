import { z } from "zod";
import { type ApiResult, type User } from "~/types"; 
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const setUpRouter = createTRPCRouter({
  setupProfile: protectedProcedure
    .input(z.object({ 
      zipCode: z.string(), 
      phone: z.string(),
      lookingFor: z.enum(["renting", "roommate", "both"]),
      locationSeekingZipCode: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {  
         
      const verifzipCode = /^\d{5}$/.exec(input.zipCode);
      const verifphone = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/.exec(input.phone);
      const veriflookingFor = ["renting", "roommate", "both"].includes(input.lookingFor);
      const veriflocationSeekingZipCode = /^\d{5}$/.exec(input.locationSeekingZipCode);
       
      const result = {
        success: false, 
        error: true,
        messages: [],
      } as ApiResult<boolean>;
      
      switch (true) { 
      case verifzipCode === null:
        result.messages.push("Name is not valid");
        break;
      case verifphone === null:
        result.messages.push("Phone number is not valid");
        break;
      case veriflookingFor === false:
        result.messages.push("Looking for is not valid");
        break;
      case veriflocationSeekingZipCode === null:
        result.messages.push("Location seeking zip code is not valid");
        break;
      default: 
        break;
      }

      if (result.messages.length > 0) {
        result.success = false;
        result.data = false;
        return result;
      }

      if(!ctx.session.user) {
        result.success = false;
        result.data = false;
        result.messages.push("User not found");
        return result;
      }

      const user = ctx.session.user;
      const db = ctx.db;
      await db
        .collection("users")
        .doc(user.uid)
        .set({ 
          zipCode: input.zipCode,
          phone: input.phone,
          lookingFor: input.lookingFor,
          locationSeekingZipCode: input.locationSeekingZipCode,
          onBoarded: true,
        }, { merge: true });
        
      result.success = true;
      result.data = true;
      result.error = false;
      result.messages.push("User created");

      return result;
    }),
  userStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const getUser = await ctx.db.collection("users").doc(userId).get();
      if (!getUser.exists) {
        throw new Error("User not found");
      }
      const user = getUser.data() as User;
      return {
        onoBoarded: user.onBoarded,
        surveryCompleted: user.surveyCompleted,
      };
    }),
});
