import { type AppType } from "next/app";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { useRouter } from "next/router";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "~/firebase";
import nookies from "nookies";
import { api } from "~/utils/api"; 
import "~/styles/globals.css";
import { Layout } from "~/components/layout";
import { useEffect } from "react";

const geist = Geist({
  subsets: ["latin"],
});

const MyApp: AppType = ({ Component, pageProps }) => {
  const router = useRouter();
  const isDashboardRoute = router.pathname.startsWith("/dashboard");

  useEffect(() => {
    const listener = onIdTokenChanged(
      auth,
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async (user) => {
        const token = await user?.getIdToken();
        if (!token && isDashboardRoute) {
          console.error("No token found");
          nookies.destroy(null, "firebase-token", { path: "/" });
          router.push("/sign-in").then().catch((error) => {
            console.error("Error redirecting to login:", error);
          });
          return;
        }  
        nookies.set(null, "firebase-token", token ?? "", { path: "/" });  
      },
      (error) => {
        console.error("Error getting token:", error);
      }
    );

    return () => {
      listener();
    };
  }, [auth]);
  
  return (
    <div className={geist.className}>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      {
        isDashboardRoute ? ( 
          <Layout>
            <Component {...pageProps} />
          </Layout> 
        ) : (
          <Component {...pageProps} />
        )
      }
      <Toaster richColors position="bottom-right" />
    </div>
  );
};

export default api.withTRPC(MyApp);
