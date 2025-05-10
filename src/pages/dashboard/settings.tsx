import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuth, updateProfile, sendPasswordResetEmail, signOut, onAuthStateChanged } from "firebase/auth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { api } from "~/utils/api";
import { Loader2 } from "lucide-react"; 

export default function SettingsPage() {
  const auth = getAuth();
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const [name, setName] = useState("");
  const [message, setMessage] = useState(""); 
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setName(firebaseUser.displayName ?? "");
      } else {
        router.push("/sign-in").then().catch((err) => {
          console.error("Failed to redirect to login page:", err);
        });
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  const handleUpdateName = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: name });
      setMessage("Name updated successfully!");
      await user.reload(); 
    } catch (_error) {
      setMessage("Failed to update name. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      setMessage("No email associated with this account.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage("Password reset email sent!");
    } catch (_error) {
      setMessage("Failed to send password reset email. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/sign-in").then().catch((err) => {
        console.error("Failed to redirect to login page:", err);
      });
    } catch (error) {
      setMessage("Failed to sign out. Please try again.");
    }
  };

  return (
    <div className="mx-auto mt-10">
      <Card className="w-full max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 font-semibold">Display Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your display name"
            />
            <Button className="mt-2 w-full" onClick={handleUpdateName}>
              Update Name
            </Button>
          </div>  
          <div className="mt-1">
            <Button variant="outline" className="w-full" onClick={handleResetPassword}>
              Send Password Reset Email
            </Button>
          </div> 
          <div className="mt-1">
            <Button variant="destructive" className="w-full" onClick={handleSignOut}>
     Sign Out
            </Button>
          </div>   
          {message && <p className="text-center text-sm text-green-600 mt-4">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
