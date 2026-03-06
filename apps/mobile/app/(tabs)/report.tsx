//apps/mobile/app/(tabs)/report.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { PrimaryButton, TextField } from "@vak/ui";
import FontAwesome from "@expo/vector-icons/FontAwesome";

type IssueType = "equipment" | "workplace";

const WORKPLACE_OPTIONS = [
  "Misconduct or unprofessional behavior",
  "Harassment or bullying",
  "Conflict or disagreement",
  "Safety concern",
  "Other",
];

export default function Report() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["70%"], []);
  const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);

  // Equipment form state
  const [affectedEquipment, setAffectedEquipment] = useState(["", "", "", ""]);

  // Workplace form state
  const [reportAbout, setReportAbout] = useState("");
  const [workplaceDescription, setWorkplaceDescription] = useState("");
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleOpen = useCallback((type: IssueType) => {
    setSelectedIssue(type);
    setIsSheetOpen(true);
  }, []);

  const toggleCheck = useCallback((item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }, []);

  const resetStates = () => {
    setAffectedEquipment(["", "", "", ""]);
    setReportAbout("");
    setWorkplaceDescription("");
    setCheckedItems(new Set());
  };

  const title = selectedIssue === "equipment" ? "Equipment or Facility Problem" : "Workplace / Personnel Issue";

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-brand-secondary px-5 pt-6">
        {/* Title */}
        <Text className="text-brand-primary text-xl font-bold text-center mb-2">Report an Issue</Text>

        {/* Subtitle */}
        <Text className="text-gray-200 text-base mb-6">Select the type of issue you'd like to report:</Text>

        {/* Card */}
        <View className="bg-brand-secondaryLight rounded-2xl border border-white/50 overflow-hidden">
          <TouchableOpacity className="px-5 pt-5 pb-4" onPress={() => handleOpen("equipment")}>
            <Text className="text-base font-bold text-white mb-1">Equipment or Facility Problem</Text>
            <Text className="text-sm text-gray-400 leading-5">
              Report issues with tools, machines, or facilities that affect your work
            </Text>
          </TouchableOpacity>

          <View className="h-px bg-gray-200 mx-5" />

          <TouchableOpacity className="px-5 pt-4 pb-5" onPress={() => handleOpen("workplace")}>
            <Text className="text-base font-bold text-white mb-1">Workplace / Personnel Issue</Text>
            <Text className="text-sm text-gray-400 leading-5">
              Report concerns involving coworkers, harassment, or unsafe behavior. Your report will be handled
              confidentially by management.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Sheet */}
        {isSheetOpen && (
          <BottomSheet
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={() => setIsSheetOpen(false)}
            backgroundStyle={{ backgroundColor: "#1a3278" }}
            handleIndicatorStyle={{ backgroundColor: "#62CCEF" }}
            backdropComponent={(props) => (
              <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                pressBehavior="close"
                opacity={0.6}
              />
            )}
          >
            <BottomSheetScrollView
              contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-row items-center mb-4">
                <Pressable onPress={() => bottomSheetRef.current?.close()} className="mr-3">
                  <FontAwesome name="arrow-circle-left" size={20} color="#62CCEF" />
                </Pressable>
                <Text className="text-brand-primary text-lg font-bold">{title}</Text>
              </View>

              {selectedIssue === "equipment" ? (
                <>
                  {affectedEquipment.map((value, index) => (
                    <TextField
                      key={index}
                      variant="dark"
                      label="Which equipment or area is affected?"
                      placeholder="Enter Here"
                      value={value}
                      onChangeText={(text: string) => {
                        setAffectedEquipment((prev) => {
                          const next = [...prev];
                          next[index] = text;
                          return next;
                        });
                      }}
                    />
                  ))}
                </>
              ) : (
                <>
                  <TextField
                    variant="dark"
                    label="Who is this report about?"
                    placeholder="Enter Name Here"
                    value={reportAbout}
                    onChangeText={setReportAbout}
                  />

                  {WORKPLACE_OPTIONS.map((item) => {
                    const isChecked = checkedItems.has(item);
                    return (
                      <Pressable
                        key={item}
                        onPress={() => toggleCheck(item)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 14,
                          paddingHorizontal: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            borderWidth: 1.5,
                            borderColor: isChecked ? "#0d1b3e" : "rgba(255,255,255,0.4)",
                            backgroundColor: isChecked ? "#0d1b3e" : "rgba(255,255,255,0.1)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          {isChecked && (
                            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13, lineHeight: 15 }}>✓</Text>
                          )}
                        </View>
                        <Text style={{ color: "#fff", fontSize: 15 }}>{item}</Text>
                      </Pressable>
                    );
                  })}

                  <TextField
                    variant="dark"
                    label="Description"
                    placeholder="Enter Here"
                    value={workplaceDescription}
                    onChangeText={setWorkplaceDescription}
                    multiline
                    numberOfLines={3}
                    className="min-h-[80px]"
                    style={{ textAlignVertical: "top" }}
                  />
                </>
              )}

              <View className="flex-1 gap-3 flex-row">
                <PrimaryButton
                  title={"Cancel"}
                  className="flex-1 bg-gray-500"
                  onPress={() => {
                    bottomSheetRef.current?.close();
                    resetStates();
                  }}
                />
                <PrimaryButton
                  title={"Submit Report"}
                  className="flex-1 bg-brand-secondary"
                  onPress={() => setShowConfirmModal(true)}
                />
              </View>
            </BottomSheetScrollView>
          </BottomSheet>
        )}

        {/* Confirmation Modal */}
        <Modal visible={showConfirmModal} transparent animationType="fade" backdropColor={"rgba(0, 0, 0, 0.5)"}>
          <Pressable
            className="flex-1 justify-center items-center px-6"
            onPress={() => setShowConfirmModal(false)}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
          >
            <Pressable className="bg-brand-secondary rounded-2xl p-4 w-full" onPress={(e) => e.stopPropagation()}>
              <Text className="text-brand-primary text-lg font-bold text-center mb-3">
                Are you sure you want to submit this report?
              </Text>
              <Text className="text-gray-200 text-sm text-center mb-6">
                Your manager will review it, and all information will be handled confidentially.
              </Text>
              <View className="flex-row gap-3">
                <PrimaryButton
                  title="Cancel"
                  className="flex-1 bg-gray-500"
                  onPress={() => setShowConfirmModal(false)}
                />
                <PrimaryButton
                  title="Submit"
                  className="flex-1 bg-brand-secondaryLight"
                  onPress={() => {
                    setShowConfirmModal(false);
                    bottomSheetRef.current?.close();
                    resetStates();
                  }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
