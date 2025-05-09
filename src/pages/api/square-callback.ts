import { Buffer } from "buffer";
import type { NextApiRequest, NextApiResponse } from "next/types";
import { db } from "~/server/api/firebase-admin";
import type { User } from "~/types";
 
const redirectUri = (process.env.NODE_ENV === "production" ? process.env.REDIRECT_URI_PROD : process.env.REDIRECT_URI_DEV) ?? ""; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;

  const getUser = (await db.collection("users").doc(state as string).get()).data() as User;
  const squareAppId = getUser.squareAppId;
  const squareAppSecret = getUser.squareAppSecret;

  if (code) {
    try {
      const tokenUrl = "https://connect.squareup.com/oauth2/token";
      const credentials = Buffer.from(`${squareAppId}:${squareAppSecret}`).toString("base64");

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${credentials}`,
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: squareAppId,
          client_secret: squareAppSecret,
        }),
      }); 
      const data = await response.json() as { access_token: string; refresh_token: string; merchant_id: string }; 
      if (response.ok && data.access_token) {
        const accessToken = data.access_token;
        const refreshToken = data.refresh_token;
        const merchantId = data.merchant_id;
 
        const userRef = db.collection("users").doc(state as string);
        await userRef.set({
          squareAccessToken: accessToken,
          squareRefreshToken: refreshToken,
          squareMerchantId: merchantId,
        }, { merge: true }); 
        res.writeHead(302, { Location: "/dashboard/settings" });
        res.end();
      } else {
        console.error("Error exchanging code for token:", data);
        res.status(400).send("Failed to retrieve access token.");
      }
    } catch (error) {
      console.error("Error during token exchange:", error);
      res.status(500).send("Internal server error.");
    }
  } else if (req.query.error) {
    console.error("Square OAuth error:", req.query.error_description ?? req.query.error);
    res.status(400).send(`OAuth error: ${JSON.stringify(req.query.error_description ?? req.query.error)}`);
  } else {
    res.status(400).send("Invalid callback request.");
  }
}