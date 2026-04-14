import { Platform } from "react-native";
import Constants from "expo-constants";

const isExpoGo = Constants.appOwnership === "expo";

// Lazy-load so the module is never evaluated in Expo Go
const N = () => require("expo-notifications") as typeof import("expo-notifications");

let workReminderId: string | null = null;
let breakWarningId: string | null = null;
let breakBlockId: string | null = null;

export async function registerForPushNotifications(): Promise<boolean> {
  if (isExpoGo) return false;
  const Notifications = N();

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("break-reminder", {
      name: "Break Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F59E0B",
    });
    await Notifications.setNotificationChannelAsync("break-enforcement", {
      name: "Break Enforcement",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      lightColor: "#EF4444",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleBreakReminder(clockInTime: Date): Promise<void> {
  if (isExpoGo) return;
  const Notifications = N();

  await cancelBreakReminder();

  const secondsUntilTrigger = Math.floor(
    (clockInTime.getTime() + 4.5 * 60 * 60 * 1000 - Date.now()) / 1000
  );
  if (secondsUntilTrigger <= 0) return;

  workReminderId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Break Reminder",
      body: "You've been working for 4.5 hours. Coordinate with your manager to take a break.",
      sound: true,
      data: { type: "work_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntilTrigger,
    },
  });
}

export async function cancelBreakReminder(): Promise<void> {
  if (isExpoGo) return;
  const Notifications = N();

  if (workReminderId) {
    await Notifications.cancelScheduledNotificationAsync(workReminderId);
    workReminderId = null;
  }
}

export async function scheduleBreakEnforcement(
  breakStartTime: Date,
  allowedBreakMinutes: number
): Promise<void> {
  if (isExpoGo) return;
  const Notifications = N();

  await cancelBreakEnforcement();

  const limitMs = allowedBreakMinutes * 60 * 1000;
  const warnMs = limitMs * 0.8;

  const secondsUntilWarn = Math.floor(
    (breakStartTime.getTime() + warnMs - Date.now()) / 1000
  );
  const secondsUntilBlock = Math.floor(
    (breakStartTime.getTime() + limitMs - Date.now()) / 1000
  );

  if (secondsUntilWarn > 0) {
    const remainingMins = Math.ceil(allowedBreakMinutes * 0.2);
    breakWarningId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Break Ending Soon",
        body: `You have about ${remainingMins} minute${remainingMins !== 1 ? "s" : ""} left on your break. Head back soon!`,
        sound: true,
        data: { type: "break_warning" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilWarn,
      },
    });
  }

  if (secondsUntilBlock > 0) {
    breakBlockId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Break Time Is Up",
        body: `Your ${allowedBreakMinutes}-minute break has ended. You must clock back in now.`,
        sound: true,
        data: { type: "break_block" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilBlock,
      },
    });
  }
}

export async function cancelBreakEnforcement(): Promise<void> {
  if (isExpoGo) return;
  const Notifications = N();

  if (breakWarningId) {
    await Notifications.cancelScheduledNotificationAsync(breakWarningId);
    breakWarningId = null;
  }
  if (breakBlockId) {
    await Notifications.cancelScheduledNotificationAsync(breakBlockId);
    breakBlockId = null;
  }
}