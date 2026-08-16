import { db } from "./config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// プレイヤーからのフィードバックをFirestoreの feedback コレクションに書き込む
export const submitFeedback = async (uid, text) => {
  await addDoc(collection(db, "feedback"), {
    uid,
    text,
    createdAt: serverTimestamp(),
  });
};
