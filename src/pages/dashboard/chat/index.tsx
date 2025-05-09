import React from "react";  
import { ChatBlock } from "~/components/chat";

export default function ChatPage() {  
  return (
    <>
      <div className="flex flex-col items-center w-full justify-center h-screen bg-gray-100 overflow-x-hidden">
        <ChatBlock />
      </div>
    </> 
  );
}