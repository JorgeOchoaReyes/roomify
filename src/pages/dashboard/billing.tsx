"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "~/firebase";
import { useAuthState } from "react-firebase-hooks/auth"; 
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const [ user, authLoading ] = useAuthState(auth);

  const [subscription, setSubscription] = useState<{
    status: string;
    plan: string | null;
    current_period_end: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { 

    if (user) {
      const fetchSubscription = async () => {
        try {
          // Simulate an API call to fetch subscription details
        } catch (error) {
          console.error("Error fetching subscription:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchSubscription().then().catch((err) => {
        console.error("Failed to fetch subscription:", err);
      });
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return ( 
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div> 
    );
  }

  return ( 
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Created</p>
              <p>
                {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push("/account")}>
                Manage Account
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current subscription plan and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                  <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                    {subscription.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan</p>
                  <p className="font-medium">{subscription.plan ?? "Free"}</p>
                </div>
                {subscription.current_period_end && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                        Renews on {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <p>No active subscription</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/dashboard/payments")} className="w-full">
              {subscription ? "Manage Subscription" : "Subscribe Now"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Content</h2>
        {subscription && subscription.status === "active" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <Card key={item}>
                <div className="aspect-video bg-muted rounded-t-lg" />
                <CardContent className="pt-4">
                  <h3 className="font-bold">Premium Content {item}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                      This is exclusive content only available to subscribers.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Premium Content Locked</h3>
              <p className="text-muted-foreground mb-4">
                  Subscribe to a plan to unlock all premium content and features.
              </p>
              <Button onClick={() => router.push("/pricing")}>View Plans</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div> 
  );
}
