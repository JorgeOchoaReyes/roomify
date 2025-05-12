import { type SchemaType, VertexAI , type Tool } from "@google-cloud/vertexai";  
import { type VertexAiAccount } from "~/types";

export const characteristicTool = {
  name: "extract_user_information",
  description: "Extract key information from the conversation.",
  parameters: {
    type: "OBJECT" as SchemaType,
    properties: {
      Religion: {
        type: "STRING" as SchemaType,
        description: "The user's religion, if mentioned. If not mentioned, do not include this field."
      },
      Age: {
        type: "NUMBER" as SchemaType,
        description: "The user's age, if mentioned."
      },
      Gener: {
        type: "STRING" as SchemaType,
        description: "The user's gender, if mentioned. If not mentioned, do not include this field."
      },
      Smoker: {
        type: "STRING" as SchemaType,
        description: "The user's smoking preference, if mentioned. If not mentioned, do not include this field."
      },
      Pets: {
        type: "STRING" as SchemaType,
        description: "The user's pet preference, if mentioned. If not mentioned, do not include this field."
      },
      Car: {
        type: "STRING" as SchemaType,
        description: "The user's car preference, if mentioned. If not mentioned, do not include this field."
      },
      Political: {
        type: "STRING" as SchemaType,
        description: "The user's political leaning, if mentioned. If not mentioned, do not include this field."
      },
      Cooking: {
        type: "STRING" as SchemaType,
        description: "The user's cooking preference, if mentioned. If not mentioned, do not include this field."
      },
      Drinking: {
        type: "STRING" as SchemaType,
        description: "The user's drinking preference, if mentioned. If not mentioned, do not include this field."
      },
      Budget: {
        type: "STRING" as SchemaType,
        description: "The user's budget, if mentioned. If not mentioned, do not include this field."
      },
      Occupation: {
        type: "STRING" as SchemaType,
        description: "The user's occupation, if mentioned. If not mentioned, do not include this field."
      },
      Hobbies: {
        type: "STRING" as SchemaType,
        description: "The user's hobbies, if mentioned. If not mentioned, do not include this field."
      },
      COMPLETED: {
        type: "BOOLEAN" as SchemaType,
        description: "Whether the user has answered all the previous questions."
      }
    },
  },
};

export const model = (system_instructions?: string, tools?: Tool[]) => {
  const vertexAIAccount = JSON.parse(process.env.VERTEX_AI_ACCOUNT ?? "{}") as VertexAiAccount; 
  const vertex = new VertexAI({
    project:  vertexAIAccount.project_id,
    location: "us-central1",
    googleAuthOptions: {
      credentials: vertexAIAccount,
    }
  });
  const model = vertex.getGenerativeModel({
    model: "gemini-2.0-flash-001",     
    systemInstruction: system_instructions ?? "",
    tools: tools ?? [],
  });    
  return model;
};