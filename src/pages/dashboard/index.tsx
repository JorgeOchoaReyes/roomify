import React from "react";  
import { api } from "~/utils/api";

export default function Dashboard() {   

  api.chat.searchAnItem.useQuery();

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-600">Welcome to your dashboard!</p>
      </div>
    </> 
  );
}