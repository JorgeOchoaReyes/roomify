import { z } from "zod";  
import { VertexAI , type Content } from "@google-cloud/vertexai";  
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc"; 
import type { Chat, Message, VertexAiAccount } from "~/types";
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
      const vertexAIAccount = JSON.parse(process.env.VERTEX_AI_ACCOUNT || "{}") as VertexAiAccount; 
      const vertex = new VertexAI({
        project:  vertexAIAccount.project_id,
        location: "us-central1",
        googleAuthOptions: {
          credentials: vertexAIAccount,
        }
      });
      const model = vertex.getGenerativeModel({
        model: "gemini-2.0-flash-001",     
        systemInstruction: `
          You are a helpful assistant that is trying to understand the users needs and preferences in what they are looking for in a roommate.
        `, 
      });    
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      let chat: Chat | null = null;
      const userChats = await ctx.db.collection("users").doc(userId).collection("survey").doc("init").get();

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
      const brewmaster = model.startChat({
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
        ...updatedChat,
        messages: [...chat.messages, assistantMessage],
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
