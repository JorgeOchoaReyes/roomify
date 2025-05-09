import type { NextApiRequest, NextApiResponse } from "next"; 
import { buffer } from "micro";
import Stripe from "stripe";
import { db } from "~/server/api/firebase-admin";

const stripeEnv = process.env.NODE_ENV === "production" ? process.env.STRIPE_PROD_SECRET_KEY : process.env.STRIPE_DEV_SECRET_KEY;
const webhookSecret = process.env.NODE_ENV === "production" ? process.env.STRIPE_PROD_WEBHOOK_SECRET : process.env.STRIPE_DEV_WEBHOOK_SECRET;

const stripe = new Stripe(stripeEnv!, {
  apiVersion: "2025-03-31.basil",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"] as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret!);
  } catch (err) {
    console.log(`Webhook Error: ${(err as {message: string})?.message}`);
    return res.status(400).send("Webhook Error");
  }

  try {
    switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      if (session.client_reference_id) { 
        const customer = await stripe.customers.retrieve(session.customer as string);
        if(customer.deleted === true) {
          console.log("Customer deleted, skipping update.");
          break; 
        }
        const metadata = customer.metadata as { userId: string };
        await db.collection("users").doc(metadata.userId).set({
          subscriptionId: subscription.id ?? "",
          status: subscription.status ?? "",
          priceId: subscription.items.data[0]?.price.id ?? "", 
          clientReferenceId: session.client_reference_id ?? "",
        }, { merge: true });  
      }
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;

      if (invoice.customer && invoice.id) {        
        const subscriptionId = invoice.lines.data[0]?.parent?.subscription_item_details?.subscription;
        if (!subscriptionId) {
          console.log("Subscription ID not found in invoice lines, skipping update.");
          break;
        }
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customer = await stripe.customers.retrieve(invoice.customer as string); 

        if(customer.deleted === true) {
          console.log("Customer deleted, skipping update.");
          break; 
        } else {
          const userId = customer.metadata.userId;
          if(!userId) {
            console.log("User ID not found in customer metadata, skipping update.");
            break;
          }
          await db.collection("users").doc(userId).set({
            subscriptionId: subscriptionId ?? "",
            status: subscription.status ?? "",
            priceId: subscription.items.data[0]?.price.id ?? "", 
          }, {merge: true});
        }
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer as string);

      if (customer.deleted === true) {
        break; 
      } else {
        const userId = customer.metadata.userId;
        if(!userId) {
          console.log("User ID not found in customer metadata, skipping update.");
          break;
        }
        await db.collection("users").doc(userId).set({
          subscriptionId: subscription.id ?? "",
          status: subscription.status ?? "",
          priceId: subscription.items.data[0]?.price.id ?? "",
        }, {merge: true});
      }
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}
