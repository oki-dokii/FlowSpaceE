import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAgApQKVhP2AtMZijLypzfhZozRLWZulTQ",
  authDomain: "flowspace-60e2b.firebaseapp.com",
  projectId: "flowspace-60e2b",
  storageBucket: "flowspace-60e2b.firebasestorage.app",
  messagingSenderId: "1094258189185",
  appId: "1:1094258189185:web:436ba11bdd08af136a7e80",
  measurementId: "G-SEPVSSGBHB"
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
