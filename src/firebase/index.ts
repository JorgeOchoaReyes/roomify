import {initializeApp, getApps, type FirebaseOptions} from "firebase/app"; 
import {getAuth} from "firebase/auth";   

const parseConfig = (JSON.parse(process.env.NEXT_PUBLIC_FIREBASE ?? "{}") ?? {}) as FirebaseOptions;

const app = getApps().length > 0 ? getApps()[0] : initializeApp(parseConfig);
const auth = getAuth(app);

export { app, auth };