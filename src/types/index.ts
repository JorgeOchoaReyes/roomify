import type { UserRecord } from "firebase-admin/auth";

export interface User extends UserRecord { 
    subscriptionId?: string
    status?: string
    priceId?: string
    clientReferenceId?: string

    name?: string
    email?: string 

    onBoarded?: boolean
    surveyCompleted?: boolean

    lookingFor?: "renting" | "roommate" | "both"
    zipCode?: string
    phone?: string
    locationSeekingZipCode?: string
    
    rentingLocations?: Address[]

}

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface ApiResult<T> {
    success: boolean;
    data?: T;
    error: boolean;
    messages: string[];
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