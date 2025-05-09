import firebase from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage"; 

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK!) as firebase.ServiceAccount;

const app = firebase.apps.length === 0 ? firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
}) : firebase.app();


const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };