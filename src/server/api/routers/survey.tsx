import { z } from "zod";   
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc"; 
import type { Chat, Message, User } from "~/types";
import { characteristicTool, model } from "../functions";
import { type Content } from "@google-cloud/vertexai";
import { v4 as uuid } from "uuid";  

export const surveyRouter = createTRPCRouter({
  survey: protectedProcedure
    .input(z.object({  
      message: z.string().optional(),

    }))
    .mutation(async ({ input, ctx}) => {  
      if(!process.env.VERTEX_AI_ACCOUNT) {
        throw new Error("Vertex AI account not found");
      }
      const db = ctx.db;
      
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      const userDetailsFetch = await db.collection("users").doc(userId).get();
      const userDetails = userDetailsFetch.data() as User;
      if (!userDetails) {
        console.log("User not found");
        throw new Error("User not found");
      } else if (userDetails.surveyCompleted) {
        console.log("User already onboarded");
        return {
          success: false,
          error: true,
          messages: ["User not onboarded"],
          data: null,
        };
      }

      let chat: Chat | null = null;
      const userChats = await db.collection("users").doc(userId).collection("survey").doc("init").get();

      if(!userChats.exists) {
        const newChat = uuid();
        chat = {
          id: newChat, 
          messages: [{
            id: new Date().getTime().toString(),
            content: input?.message ?? "",
            role: "user",
          }],
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
        };
        await ctx.db.collection("users").doc(userId).collection("survey").doc("init").set({
          ...chat,
        }, { merge: true }); 
      } else { 
        chat = userChats.data() as Chat;
        chat.messages = chat.messages.sort((a,b) => parseInt(a.id) - parseInt(b.id));
        chat.messages.push({
          id: new Date().getTime().toString(),
          content: input?.message ?? "",
          role: "user",
        });
      }
      
      const messagesAsGeminiHistory = chat.messages.map((message) => {
        return {
          role: message.role === "user" ? "user" : "model",
          parts: [{text: message?.content}],
        } as Content;
      });

      const inspector = model("You are a model that is traversing a conversation and useing the tool provided to extract what questions the users has answered, only use the tool provided!", [{functionDeclarations: [characteristicTool]}]).startChat({
        history: messagesAsGeminiHistory, 
      });
      const inspectorResponse = (await inspector.sendMessage(input?.message ?? "")).response;
      const jsonOutput = inspectorResponse.candidates?.[0]?.content?.parts[0]?.functionCall?.args;
      let statusCharacteristic: Partial<User["characteristics"]> = {} as Partial<User["characteristics"]>; 
      if (!jsonOutput) {
        console.log("No JSON output found");
      } else { 
        statusCharacteristic = jsonOutput as Partial<User["characteristics"]>;
        await ctx.db.collection("users").doc(userId).set({
          characteristics: statusCharacteristic,
          surveyStatus: statusCharacteristic?.COMPLETED ?? false,
        }, { merge: true });
      }
      
      const brewmaster = model(`
            You are a helpful assistant that is trying to understand the users needs and preferences in what they are looking for in a roommate.
            You are tasked to extract the following information from the user:
              1.  Religion 
              2.  Gender
              3,  Smoker/Non-Smoker
              4.  Pets
              5.  Car/No Car
              6.  Political Leaning 
              7.  Cooking/Not Cooking 
              8.  Drinking/No Drinking 
              9.  Budget
              10. Occupation
              11. Hobbies

            You will ask the user questions one by one to extract this information.

            Ensure to ask questions in a natural and conversational manner.
            If the user provides a response that is not related to the questions you are asking, gently steer the conversation back to the topic at hand.
            Ask the questions one by one and wait for the user to respond before asking the next question.
            
            ## DO NOT ASK ALL QUESTIONS AT ONCE OR ASK MORE THAN ONE QUESTION AT A TIME!

            Once you have extracted the information, provide a summary of the user's preferences and needs.
            If the user provides a response that is not related to the questions you are asking, gently steer the conversation back to the topic at hand 

            Once they approve the summary end the conversation.
            
            ## Here is the current information that has been extracted from the user:
            ${JSON.stringify(statusCharacteristic, null, 2)}
        `)
        .startChat({
          history: messagesAsGeminiHistory,
        });

       
      const response = await brewmaster.sendMessage(input?.message ?? ""); 
      const assistantMessageId = (new Date().getTime() + 1).toString();
      const assistantResponse = response?.response?.candidates?.[0]?.content?.parts.reduce((acc, cur) => {
        acc = acc + cur.text + "\n";
        return acc;
      }, "") ?? "";

      const assistantMessage: Message = {
        id: assistantMessageId,
        content: assistantResponse,
        role: "assistant",
      };

      const updatedChat = {
        ...chat,
        messages: [...chat.messages, assistantMessage],
        updatedAt: new Date().getTime(),
      };

      await ctx.db.collection("users").doc(userId).collection("survey").doc("init").set({
        ...updatedChat,
      }, { merge: true });
      
      return {
        data: {
          ...updatedChat,
          messages: [...chat.messages, assistantMessage],
          surveyStatus: statusCharacteristic?.COMPLETED ?? false,
        },
        success: true,
        error: false,
        messages: ["Chat updated"],
      }; 
    }),
  getRecentMessages: protectedProcedure 
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const userChats = await ctx.db.collection("users").doc(userId).collection("survey").doc("init").get();
      if (!userChats.exists) {
        throw new Error("Chat not found");
      }
      const chat = userChats.data() as Chat;
      chat.messages = chat.messages.sort((a,b) => parseInt(a.id) - parseInt(b.id)).slice(-5); 
      return chat;  
    }),
  getSurvey: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const userChats = await ctx.db.collection("users").doc(userId).collection("survey").doc("init").get();
      if (userChats.exists) {
        throw new Error("No chats found");
      }
      const chat = userChats.data() as Chat;
      return chat; 
    }),  
});
