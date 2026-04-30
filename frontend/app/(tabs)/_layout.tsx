import React from "react";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Login" }} />
      <Tabs.Screen name="diet" options={{ title: "Diet", href: null }} />
      <Tabs.Screen name="result" options={{ title: "Result", href: null }} />
      <Tabs.Screen name="history" options={{ title: "History", href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}