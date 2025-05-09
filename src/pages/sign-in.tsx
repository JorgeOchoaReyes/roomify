import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head"; 
import { auth } from "..//firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert"; 
import { EyeIcon, EyeOffIcon, AlertCircle } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useSignInWithGoogle, useSignInWithEmailAndPassword } from "react-firebase-hooks/auth"; 
import { toast } from "sonner";
import nookies from "nookies";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [attemptError, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const router = useRouter();

  const [signInWithGoogle, _googleUser, googleLoading, _googleError, ] = useSignInWithGoogle(auth); 
  const [signInWithEmailAndPassword, _userCredential, loadingCredential, errorCredential, ] = useSignInWithEmailAndPassword(auth);

  const handleSignInEmailAndPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      await signInWithEmailAndPassword(email, password);
      const returnUrl = router.query.returnUrl as string || "/dashboard";
      await router.push(returnUrl);
      
    } catch (error) {
      setError("Invalid email or password. Please try again.");
      toast("Invalid email or password.", {
        description: "Sign in failed. Please check your credentials.", 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      const token = await user?.user.getIdToken();
      if (token) {
        nookies.set(null, "firebase-token", token, { path: "/" });
      } else {
        throw new Error("Failed to get token");
      }
      
      const returnUrl = router.query.returnUrl as string || "/dashboard";
      await router.push(returnUrl);
    } catch (error) {
      setError("Failed to sign in with Google. Please try again.");
      toast("Invalid credentials.", {
        description: "Sign in failed, please try again.", 
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <Head>
        <title>Sign In | My App</title>
        <meta name="description" content="Sign in to your account" />
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign in to your account</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignInEmailAndPassword} className="space-y-4">
              {errorCredential && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{attemptError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div> 
              <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col"> 
            <Button className="w-full bg-[#4285F4] cursor-pointer" onClick={handleSignInGoogle} disabled={googleLoading || isLoading || loadingCredential}> 
              <SiGoogle className="mr-2 h-4 w-4" /> Sign in with Google
            </Button> 
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
