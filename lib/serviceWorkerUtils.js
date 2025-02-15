export const registerServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
      console.log("❌ Service Workers not supported");
      return null;
    }
  
    try {
      // Check for existing registration
      const existingReg = await navigator.serviceWorker.getRegistration();
      
      if (existingReg) {
        console.log("🔄 Using existing SW:", existingReg);
        return existingReg;
      }
  
      // Register new Service Worker
      const newRegistration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none"
      });
      
      console.log("✅ SW Registered:", newRegistration);
      return newRegistration;
  
    } catch (error) {
      console.error("❌ SW Registration Failed:", error);
      throw error;
    }
  };