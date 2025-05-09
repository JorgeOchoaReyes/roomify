import { z } from "zod";  
import { VertexAI , type Content } from "@google-cloud/vertexai";  
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc"; 
import type { Chat, Message, User, VertexAiAccount } from "~/types";
import { v4 as uuid } from "uuid"; 
import { getPossibleMenuItems } from "~/server/api/functions";

export const chatRouter = createTRPCRouter({
  chat: protectedProcedure
    .input(z.object({ 
      chatId: z.string().optional(),
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
        systemInstruction: "You are a helpful assitant to help users with their menu management, and labor questions.", 
      });   
      const { chatId } = input;
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      let chat: Chat | null = null;
      const userChats = await ctx.db.collection("users").doc(userId).collection("chats").doc(chatId ?? "").get();

      if(!chatId || !userChats.exists) {
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
        await ctx.db.collection("users").doc(userId).collection("chats").doc(newChat).set({
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

      await ctx.db.collection("users").doc(userId).collection("chats").doc(chat.id).set({
        ...updatedChat,
      }, { merge: true });
      
      return {
        ...updatedChat,
        messages: [...chat.messages, assistantMessage],
      }; 
    }),
  getRecentMessages: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const userChats = await ctx.db.collection("users").doc(userId).collection("chats").doc(input.chatId).get();
      if (!userChats.exists) {
        throw new Error("Chat not found");
      }
      const chat = userChats.data() as Chat;
      chat.messages = chat.messages.sort((a,b) => parseInt(a.id) - parseInt(b.id)).slice(-5); 
      return chat;  
    }),
  getMostRecentChat: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const userChats = await ctx.db.collection("users").doc(userId).collection("chats").orderBy("createdAt", "desc").limit(1).get();
      if (userChats.empty) {
        throw new Error("No chats found");
      }
      const chat = userChats?.docs?.[0]?.data() as Chat;
      return chat; 
    }),
  getChats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const userChats = await ctx.db.collection("users").doc(userId).collection("chats").get();
      const chats: Pick<Chat, "createdAt" | "id" >[] = [];
      userChats.forEach((doc) => {
        const chat = doc.data() as Chat;
        chats.push({
          id: chat.id,
          createdAt: chat.createdAt,
        });
      });
      return chats.sort((a, b) => b.createdAt - a.createdAt);
    }),
  createChat: protectedProcedure
    .input(z.object({  message: z.string().optional() }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const newChat = uuid();
      await ctx.db.collection("users").doc(userId).collection("chats").doc(newChat).set({
        id: newChat,
        messages: [],
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
      }, { merge: true });
      return newChat;
    }), 
  searchAnItem: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const usersSquareCredentials = await ctx.db.collection("users").doc(userId).get();

      const squareCredentials = usersSquareCredentials.data() as User;
      if(!squareCredentials?.squareAccessToken) {
        throw new Error("Square credentials not found");
      }
      const squareAccessToken = squareCredentials.squareAccessToken;
      const findItems = await getPossibleMenuItems(squareAccessToken, "burger");
      if(!findItems || findItems.length === 0) {
        throw new Error("No items found");
      }
      console.log("findItems", findItems);
      return findItems;
    })
});
