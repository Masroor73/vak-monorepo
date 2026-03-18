import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { persistentClient } from "./supabase";

export const signInWithGoogle = async () => {
  const redirectTo = Linking.createURL("/");

  const { data, error } = await persistentClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw error;
  if (!data.url) throw new Error("No URL returned from Supabase");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === "success") {
    const params = new URLSearchParams(result.url.split("#")[1]);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) throw new Error("No tokens returned");

    const { error: sessionError } = await persistentClient.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError) throw sessionError;
    return true;
  }

  return false; 
};