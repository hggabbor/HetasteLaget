import { Stack } from "expo-router";
import 'bootstrap/dist/css/bootstrap.min.css'
import {useEffect} from "react";
import Index from "@/app/(tabs)";
//import 'bootstrap/dist/js/bootstrap.bundle.min'

export default function RootLayout() {
  return <Stack>
    <Stack.Screen
        name="index"
        options={{ headerShown: false }} // Hide header here
    />
    <Stack.Screen name="(tabs)/index" options={{ headerShown: false }} />
  </Stack>;
}
