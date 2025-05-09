import type { easeOut } from "framer-motion";
import { is } from "./../../node_modules/unist-util-is/lib/index.d";
import type { UserRecord } from "firebase-admin/auth";

export interface User extends UserRecord {
    squareAppId?: string
    squareAppSecret?: string
    squareAccessToken?: string
    squareRefreshToken?: string
    squareMerchantId?: string
    subscriptionId?: string
    status?: string
    priceId?: string
    clientReferenceId?: string
}

export interface Chat {
    id: string; 
    messages: Message[];
    createdAt: number;
    updatedAt: number;
}

export interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
    isNew?: boolean;
}

export interface VertexAiAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}