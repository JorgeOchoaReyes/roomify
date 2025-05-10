import { useState, useRef, useEffect } from "react"; 
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input"; 
import { ChatMessage } from "./chat-message";
import { Loader2 } from "lucide-react"; 
import { api } from "~/utils/api";
import { type Chat, type Message } from "~/types"; 
import { useRouter } from "next/router"; 
  
export function ChatBlock() {  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentChat, setCurrentChat] = useState<Chat>({
    id: "1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  }); 

  const router = useRouter();
  const chat = api.survey.survey.useMutation(); 
  const getChatMessages = api.survey.getRecentMessages.useMutation(); 

  useEffect(() => { 
    ((async () => { 
      const chatData = await getChatMessages.mutateAsync();
      setCurrentChat(chatData); 
    }) as () => void)();  
  }, []);
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat.messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return; 
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
    }; 
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, userMessage],
    }; 
    setCurrentChat(updatedChat); 
    setInputValue("");
    setIsLoading(true);
    setIsStreaming(true); 
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: "",
      role: "assistant",
    }; 
    const chatWithAssistantMessage = {
      ...updatedChat,
      messages: [...updatedChat.messages, assistantMessage],
    }; 
    setCurrentChat(chatWithAssistantMessage);  
    try {   
      const response = await chat.mutateAsync({
        message: userMessage.content, 
      }); 
      const assistantMessage = {
        id: assistantMessageId,
        content: response.messages[response.messages.length - 1]?.content ?? "",
        role: "assistant",
        isNew: true,
      }; 
      setCurrentChat((p) => {
        return {
          ...p,
          messages: p.messages.map((msg) => {
            if (msg.id === assistantMessageId) {
              return assistantMessage as Message;
            }
            return msg;
          }),
        };
      });
      setIsLoading(false);
      setIsStreaming(false);
    } catch (error) {
      console.error("Error streaming response:", error); 
      setCurrentChat((prevChat) => {
        const updatedMessages = prevChat.messages.map((msg) => {
          if (msg.id === assistantMessageId) {
            return {
              ...msg,
              content: "I'm sorry, there was an error generating a response. Please try again.",
            };
          }
          return msg;
        }); 
        const updatedChat = {
          ...prevChat,
          messages: updatedMessages,
        };  
        return updatedChat;
      }); 
      setIsLoading(false);
      setIsStreaming(false);
    }
  };  

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 w-full">    
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          { 
            currentChat.messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-md text-center">
                  <h2 className="mb-2 text-2xl font-bold">Welcome!</h2>
                  <p className="text-muted-foreground">
                    {"Let's learn more about you. Start a conversation!"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-20">
                {currentChat.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isStreaming && (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
        </div> 
        <div className="border-t bg-background p-4">
          <div className="mx-auto flex max-w-3xl items-center space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  await handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={!inputValue.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}