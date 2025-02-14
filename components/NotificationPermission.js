// components/NotificationPermission.js
import { useEffect } from "react";

export default function NotificationPermission() {
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted.");
        }
      });
    }
  }, []);

  return null;
}