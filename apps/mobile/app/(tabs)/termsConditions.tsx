import { ScrollView, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TERMS_SECTIONS = [
    {
        title: "Acceptance of Terms",
        icon: "checkmark-circle-outline" as const,
        body:
            "By using the V.A.K app, you agree to follow these terms and use the platform responsibly. If you do not agree with any part of these terms, please stop using the app.",
    },
    {
        title: "Account Use",
        icon: "person-outline" as const,
        body:
            "You are responsible for keeping your login information secure and for the activity performed through your account. Please make sure your personal details stay accurate and up to date.",
    },
    {
        title: "Work Features",
        icon: "briefcase-outline" as const,
        body:
            "Features such as schedules, clock-in tools, recognitions, notifications, reports, and availability are provided to support daily work operations. Misuse of these tools may result in restricted access.",
    },
    {
        title: "User Responsibilities",
        icon: "shield-checkmark-outline" as const,
        body:
            "You agree not to submit false information, misuse company tools, interfere with other users, or attempt to access information that is not intended for you.",
    },
    {
        title: "Content and Updates",
        icon: "document-text-outline" as const,
        body:
            "App content, workflows, and features may be updated from time to time. Continued use of the app after changes are made means you accept the updated version.",
    },
    {
        title: "Contact",
        icon: "mail-outline" as const,
        body:
            "If you have questions about these terms, please contact your manager or the appropriate internal support team for clarification.",
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

export default function TermsConditionsScreen() {
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
                        <Ionicons name="document-text-outline" size={24} color="#62CCEF" />
                    </View>

                    <Text className="text-white text-[24px] font-extrabold mb-2">
                        Terms & Conditions
                    </Text>

                    <Text className="text-white/70 text-[14px] leading-6">
                        Please review the terms that apply to the use of the V.A.K app and
                        its work-related features.
                    </Text>

                    <View className="self-start mt-4 rounded-full px-4 py-2 border border-white/10 bg-white/5">
                        <Text className="text-[12px] font-semibold text-brand-primary">
                            Last updated: Apr 2026
                        </Text>
                    </View>
                </View>

                {TERMS_SECTIONS.map((section) => (
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