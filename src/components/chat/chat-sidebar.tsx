import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlignJustify, Grid, MessageSquare, Plus, } from "lucide-react"; 
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";  
import { api } from "~/utils/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ChatSidebar() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = React.useState(false); 
  const [chats, setChats] = React.useState<{id: string, createdAt: number}[]>([]);
 
  const getChats = api.chat.getChats.useQuery(); 
  const createChat = api.chat.createChat.useMutation();
  
  React.useEffect(() => {
    if (getChats.data) {
      setChats(getChats.data);
    }
  }, [getChats.data]);


  const createNewChat = async () => { 
    const newChatId = await createChat.mutateAsync({});
    if(!newChatId) {
      toast.error("Failed to create a new chat. Please try again.");
    } 
    await router.push(`/dashboard/chat?chatId=${newChatId}`);
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-20" : "w-80", 
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && <h2 className="text-lg font-semibold">Chats</h2>}
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <Button variant="outline" size="icon" onClick={createNewChat}>
              {createChat.isPending ? <Loader2 className="animte-spin" /> : <Plus className="h-4 w-4" />}
              <span className="sr-only">New Chat</span>  
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
            <AlignJustify className="h-4 w-4" />
            <span className="sr-only">{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</span>
          </Button>
        </div>
      </div> 

      <div className="flex-1 overflow-auto p-2">
        <TooltipProvider delayDuration={0}>
          {
            getChats.isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Grid className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : 
              chats.length > 0 ? (
                <ul className="space-y-2">
                  {chats.map((chat) => (
                    <li key={chat.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/dashboard/chat?chatId=${chat.id}`}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              "hover:bg-accent hover:text-accent-foreground",
                              "bg-accent text-accent-foreground",
                              isCollapsed && "justify-center",
                            )}
                          >
                            <MessageSquare className="h-5 w-5" />
                            {!isCollapsed && (
                              <div className="flex-1 truncate"> 
                                <p className="truncate text-xs text-muted-foreground">{new Date(chat.createdAt).toLocaleDateString()}-{new Date(chat.createdAt).toLocaleTimeString(navigator.language, {hour: "2-digit", minute:"2-digit"})}</p>
                              </div>
                            )}
                          </Link>
                        </TooltipTrigger> 
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex h-full items-center justify-center">
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={createNewChat}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Create a new chat</TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">No chats found</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={createNewChat}>
                        <Plus className="mr-2 h-4 w-4" />
                    New Chat
                      </Button>
                    </div>
                  )}
                </div>
              )}
        </TooltipProvider>
      </div> 
    </div>
  );
}
