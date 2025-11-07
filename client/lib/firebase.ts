import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCPMCIM0y9xbY3Z8Ayd3xScdUx_uve5ckY",
  authDomain: "smart-clinic-d59c5.firebaseapp.com",
  projectId: "smart-clinic-d59c5",
  storageBucket: "smart-clinic-d59c5.firebasestorage.app",
  messagingSenderId: "138870860957",
  appId: "1:138870860957:web:ce4c44239626038d917874",
  measurementId: "G-YNT8K8D9KP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const firebaseSignUp = async (email: string, password: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const firebaseSignIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const firebaseSignOut = async () => {
  await signOut(auth);
};

export const uploadAvatarToFirebase = async (file: File, userId: string): Promise<string> => {
  const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

export { onAuthStateChanged, type User };
