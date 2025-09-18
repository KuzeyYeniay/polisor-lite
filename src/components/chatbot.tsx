"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { chatbotAnswersQuestions } from "@/ai/flows/chatbot-answers-questions";
import { cn } from "@/lib/utils";

type Message = {
  text: string;
  sender: "user" | "PoliBot";
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "PoliBot",
      text: "Merhaba! Ben PoliBot. Sana PoliSor hakkında sorularına cevap vermek için buradayım. ",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatbotAnswersQuestions({ question: input });
      const botMessage: Message = { text: response.answer, sender: "PoliBot" };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = {
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        sender: "PoliBot",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 animate-in fade-in zoom-in duration-500"
        aria-label="Open chatbot"
      >
        <MessageCircle className="h-8 w-8" />
      </Button>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bot className="text-primary" /> PoliBot
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 my-4 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.sender === "PoliBot" && (
                    <Avatar className="h-8 w-8 border border-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs rounded-lg px-4 py-2 text-sm",
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.text}
                  </div>
                   {message.sender === "user" && (
                    <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-accent text-accent-foreground">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
               {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                   <Avatar className="h-8 w-8 border border-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  <div className="max-w-xs rounded-lg px-4 py-2 text-sm bg-muted flex items-center space-x-2">
                     <span className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:0s]"></span>
                     <span className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></span>
                     <span className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <SheetFooter>
            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <Button type="submit" onClick={handleSend} disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
