// components/CollectionListener.js
import { useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

export default function CollectionListener() {
  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: "TRIGGER_NOTIFICATION",
              title: "New Order!",
              options: {
                body: "Hey Ashe, you have a new order!",
                icon: "/notif.png",
              },
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);

  return null;
}