import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Chat from "@/pages/Chat";
import SetupUser from "@/pages/SetupUser";
import { useEffect, useState } from "react";
import { USER_STORAGE_KEY } from "@/lib/constants";

function App() {
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    // Check if user exists in localStorage
    const userInfo = localStorage.getItem(USER_STORAGE_KEY);
    setHasUser(!!userInfo);
  }, []);

  return (
    <>
      <Switch>
        <Route path="/" component={hasUser ? Chat : SetupUser} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
