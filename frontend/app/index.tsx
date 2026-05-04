import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Asset } from "expo-asset";

const splashImage = require("../assets/images/splash-icon.png");

export default function SplashScreen() {
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    async function prepareSplash() {
      try {
        await Asset.fromModule(splashImage).downloadAsync();
        setImageReady(true);

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 2500);
      } catch (error) {
        console.log("Splash image loading error:", error);
        router.replace("/(tabs)");
      }
    }

    prepareSplash();
  }, []);

  return (
    <View style={styles.container}>
      {imageReady ? (
        <Image
          source={splashImage}
          style={styles.logo}
          resizeMode="contain"
        />
      ) : (
        <ActivityIndicator size="large" color="#ff7a00" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 320,
    height: 320,
  },
});