import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "~/firebase"; 
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { api } from "~/utils/api";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "$9.99",
    priceId: "price_1RIMRLPKzVUQrCfdRpsWyJvo", 
    features: ["Access to basic content", "Email support", "Monthly newsletter"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19.99",
    priceId: "price_1RIMRLPKzVUQrCfdRpsWyJvo",  
    features: ["Access to all content", "Priority email support", "Monthly newsletter", "Exclusive webinars"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$49.99",
    priceId: "price_1RIMRLPKzVUQrCfdRpsWyJvo", 
    features: ["Access to all content", "24/7 support", "Monthly newsletter", "Exclusive webinars", "Custom solutions"],
  },
];

export default function Pricing() {
  const [user, authLoading] = useAuthState(auth);
  const [subscription, setSubscription] = useState<{status: string; plan: string | null; current_period_end: number | null} | null>(null); 
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const router = useRouter();

  const createCheckoutSession = api.stripe.createCheckoutSession.useMutation(); 

  useEffect(() => {
    if (!authLoading && user) {
      const fetchSubscription = async () => {
        try { 
        } catch (error) {
          console.error("Error fetching subscription:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchSubscription().then().catch((err) => {
        console.error("Failed to fetch subscription:", err);
      }); 
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleSubscribe = async (priceId: string) => {  
    setCheckoutLoading(priceId);
    try {
      const { url } = await createCheckoutSession.mutateAsync({ priceId });
      if(!url) {
        throw new Error("No URL returned from checkout session");
      }
      if(window) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return ( 
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold">Subscription Plans</h1>
        <p className="text-xl text-muted-foreground mt-4">Choose the perfect plan for your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.id && subscription?.status === "active";

          return (
            <Card key={plan.id} className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}>
              {plan.popular && (
                <Badge className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3">Popular</Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(plan.priceId)}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan || checkoutLoading === plan.priceId}
                >
                  {checkoutLoading === plan.priceId ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Need a custom plan?</h2>
        <p className="text-muted-foreground mb-6">
            Contact us for custom pricing options for larger teams or specific requirements.
        </p>
        <Button variant="outline" size="lg">
            Contact Sales
        </Button>
      </div>
    </div> 
  );
}
