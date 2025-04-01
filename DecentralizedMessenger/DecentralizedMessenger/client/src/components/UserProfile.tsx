import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { USER_STORAGE_KEY } from "@/lib/constants";

interface UserProfileProps {
  userId: string;
  displayName: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, displayName }) => {
  const [showUserDialog, setShowUserDialog] = useState(false);
  
  // Get user initials from display name (before the colon)
  const getInitials = (): string => {
    const name = displayName.split(':')[0];
    return name.charAt(0).toUpperCase() + (name.length > 1 ? name.charAt(1).toUpperCase() : '');
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    window.location.reload();
  };

  return (
    <>
      <div 
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => setShowUserDialog(true)}
      >
        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
          <span className="font-medium text-sm">{getInitials()}</span>
        </div>
        <span className="text-sm font-medium">{displayName}</span>
      </div>

      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">User Profile</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4">
            <div className="h-20 w-20 bg-primary rounded-full flex items-center justify-center mb-4">
              <span className="font-bold text-xl">{getInitials()}</span>
            </div>
            <h2 className="text-lg font-semibold">{displayName}</h2>
            <p className="text-sm text-gray-400 mt-1">User ID: {userId}</p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 mt-2">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="material-icons text-primary text-sm mr-2">info</span>
              Node Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-secondary mr-2"></span>
                  Online
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connection Type</span>
                <span>P2P</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full"
            >
              <span className="material-icons text-sm mr-2">logout</span>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserProfile;
