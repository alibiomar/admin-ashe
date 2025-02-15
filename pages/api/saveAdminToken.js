import { db } from "../../lib/firebaseAdmin"; // Ensure this is configured
import { doc, setDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    // Store the token in Firestore (or your DB)
    await setDoc(doc(db, "adminTokens", "adminUser"), { fcmToken });

    return res.status(200).json({ message: "FCM token saved" });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return res.status(500).json({ error: error.message });
  }
}
