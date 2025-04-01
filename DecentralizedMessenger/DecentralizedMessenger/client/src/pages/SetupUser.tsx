import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateDisplayName, generateUserId } from "@/lib/crypto";
import { Card } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { USER_STORAGE_KEY } from "@/lib/constants";

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters"),
});

type UserFormValues = z.infer<typeof userSchema>;

const SetupUser = () => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    setIsLoading(true);
    try {
      const userId = generateUserId();
      const displayName = await generateDisplayName(data.username);
      
      // Store user info in localStorage
      const userInfo = {
        id: userId,
        name: data.username,
        displayName,
      };
      
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userInfo));
      
      // Reload to go to chat page
      window.location.reload();
    } catch (error) {
      console.error("Error setting up user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg flex flex-col items-center justify-center p-4">
      <div className="flex items-center mb-8">
        <span className="material-icons text-primary text-4xl mr-2">hub</span>
        <h1 className="text-3xl font-bold text-white">Tosan Chat</h1>
      </div>
      
      <Card className="w-full max-w-md bg-mediumBg border-gray-700 text-white">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-center">Set Up Your Profile</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a username" 
                        className="bg-gray-700 border-gray-600 text-white" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <span className="material-icons text-primary text-sm mr-2">info</span>
                  How Tosan Chat Works
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  Tosan Chat is a secure decentralized messaging app that uses:
                </p>
                <ul className="text-sm text-gray-300 space-y-1 list-disc pl-5">
                  <li>Peer-to-peer connections for direct communication</li>
                  <li>SHA-256 hash verification for message integrity</li>
                  <li>No central server storing your messages</li>
                </ul>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting Up...
                  </span>
                ) : 'Get Started'}
              </Button>
            </form>
          </Form>
        </div>
      </Card>
      
      <p className="mt-8 text-gray-400 text-sm text-center max-w-md">
        By using Tosan Chat, you agree to communicate only with people you trust.
        All messages are secured with end-to-end encryption and hash verification.
      </p>
    </div>
  );
};

export default SetupUser;
