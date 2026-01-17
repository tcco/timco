import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

export async function signup({
  firstName,
  lastName,
  email,
  password,
}: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  if (userCredential.user) {
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`,
    });
  }

  return userCredential.user;
}

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
}

export async function getCurrentUser() {
  await auth.authStateReady();
  return auth.currentUser;
}

export async function logOut() {
  await signOut(auth);
}
