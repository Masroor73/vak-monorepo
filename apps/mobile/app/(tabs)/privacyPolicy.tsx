import { ScrollView, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PRIVACY_SECTIONS = [
    {
        title: "Information We Collect",
        icon: "folder-open-outline" as const,
        body:
            "The app may collect work-related information such as your profile details, schedule data, notifications, recognitions, reports, and activity required for normal app functionality.",
    },
    {
        title: "How Information Is Used",
        icon: "settings-outline" as const,
        body:
            "Your information is used to operate app features, show schedules, support clock-in and reporting workflows, improve communication, and maintain a smooth user experience.",
    },
    {
        title: "Location and Camera Access",
        icon: "location-outline" as const,
        body:
            "Some features may request camera or location access when needed, such as attendance or verification workflows. These permissions are only used for the related app function.",
    },
    {
        title: "Data Sharing",
        icon: "share-social-outline" as const,
        body:
            "Your data is only shared when needed to support business operations, app services, or authorized internal workflows. It is not intended for unrelated use.",
    },
    {
        title: "Data Security",
        icon: "lock-closed-outline" as const,
        body:
            "Reasonable security measures are used to protect your information. Even so, users should avoid sharing passwords and should keep their account details secure.",
    },
    {
        title: "Your Choices",
        icon: "options-outline" as const,
        body:
            "You may request updates to your profile information and review the permissions you allow on your device. Contact the appropriate team if you have privacy concerns.",
    },
];

function SectionCard({
    title,
    body,
    icon,
}: {
    title: string;
    body: string;
    icon: keyof typeof Ionicons.glyphMap;
}) {
    return (
        <View
            className="bg-white rounded-2xl p-4 mb-3"
            style={{
                borderWidth: 0.5,
                borderColor: "rgba(0,0,0,0.06)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            }}
        >
            <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-xl bg-brand-secondary items-center justify-center mr-3">
                    <Ionicons name={icon} size={19} color="#62CCEF" />
                </View>

                <Text className="flex-1 text-[16px] font-bold text-brand-secondary">
                    {title}
                </Text>
            </View>

            <Text className="text-[14px] leading-6 text-gray-600">{body}</Text>
        </View>
    );
}

export default function PrivacyPolicyScreen() {
    return (
        <View className="flex-1 bg-brand-background">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            >
                <View className="bg-brand-secondary rounded-[28px] px-5 pt-6 pb-7 mb-4 overflow-hidden">
                    <View
                        style={{
                            position: "absolute",
                            top: -40,
                            right: -30,
                            width: 140,
                            height: 140,
                            borderRadius: 70,
                            backgroundColor: "#1a3278",
                            opacity: 0.5,
                        }}
                    />

                    <View
                        style={{
                            position: "absolute",
                            bottom: -25,
                            left: -15,
                            width: 90,
                            height: 90,
                            borderRadius: 45,
                            backgroundColor: "#162550",
                            opacity: 0.7,
                        }}
                    />

                    <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center mb-4">
                        <Ionicons name="shield-checkmark-outline" size={24} color="#62CCEF" />
                    </View>

                    <Text className="text-white text-[24px] font-extrabold mb-2">
                        Privacy Policy
                    </Text>

                    <Text className="text-white/70 text-[14px] leading-6">
                        This page explains what information may be collected in the V.A.K
                        app and how it is used to support app features.
                    </Text>

                    <View className="self-start mt-4 rounded-full px-4 py-2 border border-white/10 bg-white/5">
                        <Text className="text-[12px] font-semibold text-brand-primary">
                            Last updated: Apr 2026
                        </Text>
                    </View>
                </View>

                {PRIVACY_SECTIONS.map((section) => (
                    <SectionCard
                        key={section.title}
                        title={section.title}
                        body={section.body}
                        icon={section.icon}
                    />
                ))}
            </ScrollView>
        </View>
    );
}