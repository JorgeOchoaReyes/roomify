import Head from "next/head";
import React from "react"; 
import { ChatBlock } from "~/components/chat/no-sidebar-chat";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/router"; 
import { useEffect } from "react";
import { useSetup } from "~/hooks/use-setup";

export default function Chat() {
  const router = useRouter(); 

  const { has_user_been_onboarded, has_user_completed_survey } = useSetup();
  useEffect(() => {
    if (has_user_been_onboarded && has_user_completed_survey) {
      (async () => await router.push("/dashboard"))();
    } else if (!has_user_been_onboarded && !has_user_completed_survey) {
      (async () => await router.push("/set-up"))();
    }
  }, [has_user_been_onboarded, has_user_completed_survey, router]);

  return (
    <>
      <Head>
        <title>Setup</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col items-center w-full justify-center h-screen bg-gray-100 overflow-x-hidden">
        <Button onClick={async () => await router.push("/dashboard")} className="self-start m-6" variant={"outline"}> 
          <ArrowLeft className="mr-2" />
              Back
        </Button>
        <div className="flex flex-col items-center w-3/4 justify-center h-screen bg-gray-100 overflow-x-hidden">
          <ChatBlock />
        </div>
      </div>
    </>
  );
}