import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUri?: string;
  medicines?: Medicine[];
  timestamp: Date;
}

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "👋 Welcome to MedBot! I'm your AI healthcare assistant. I can help you:\n\n✓ Analyze symptoms and skin conditions from photos\n✓ Suggest home remedies and OTC medicines\n✓ Provide health information and wellness tips\n✓ Answer medication questions\n\n⚠️ Note: I'm not a replacement for professional medical advice. For serious concerns, consult a doctor.\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);

  const pickImageFromCamera = async () => {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Camera access is required to capture images. Please enable it in Settings."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setShowImageMenu(false);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to capture image. Please try again.");
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      // Request media permissions
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (mediaPermission.status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Photo library access is required. Please enable it in Settings."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setShowImageMenu(false);
      }
    } catch (error) {
      console.error("Library error:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleImageMenu = () => {
    Alert.alert(
      "Analyze Symptom",
      "Choose image source",
      [
        {
          text: "📸 Take Photo",
          onPress: pickImageFromCamera,
        },
        {
          text: "🖼️ Pick from Gallery",
          onPress: pickImageFromLibrary,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const sendMessage = async () => {
    if (!(inputText.trim() || selectedImage) || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim() || "Please analyze this image for me",
      imageUri: selectedImage || undefined,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setSelectedImage(null);
    setIsLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const { getMedicalChatbotResponse, convertImageToBase64 } = await import("../utils/openai");
      
      const systemPrompt = `You are MedBot, an advanced healthcare AI assistant specialized in symptom analysis and medicine recommendations. 

When analyzing images:
1. Identify visible symptoms, conditions, or problems
2. Provide detailed observations
3. Suggest possible conditions (with disclaimers)
4. Recommend appropriate OTC medicines or home remedies
5. Always advise seeing a doctor for serious conditions

Always respond in a structured format with:
- SYMPTOMS OBSERVED: [list]
- POSSIBLE CONDITIONS: [list with likelihood]
- RECOMMENDED MEDICINES: [with dosage, frequency, and notes]
- HOME REMEDIES: [suggestions]
- WHEN TO SEE A DOCTOR: [warning signs]

Include safety disclaimers and remind users to consult professionals for serious concerns.`;

      const openAIMessages = [
        { role: "system", content: systemPrompt },
      ];

      // Process each message
      for (const msg of newMessages) {
        if (msg.imageUri && msg.role === "user") {
          // Convert image to base64
          const base64Image = await convertImageToBase64(msg.imageUri);
          openAIMessages.push({
            role: msg.role,
            content: [
              { type: "text", text: msg.content },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          });
        } else {
          openAIMessages.push({ role: msg.role, content: msg.content });
        }
      }
      
      const reply = await getMedicalChatbotResponse(openAIMessages);
      
      // Parse medicines from response
      const medicinesMatch = reply.match(/RECOMMENDED MEDICINES:([^]*?)(?=HOME REMEDIES:|WHEN TO SEE|$)/);
      const medicines: Medicine[] = [];
      
      if (medicinesMatch) {
        const medicineText = medicinesMatch[1];
        const items = medicineText.split(/\n-|^-/).filter(item => item.trim());
        items.forEach(item => {
          const parts = item.split(/[–—]/);
          if (parts.length >= 2) {
            medicines.push({
              name: parts[0].trim().split(/\(|,/)[0],
              dosage: parts[1].trim().split(/,|Frequency/)[0] || "As directed",
              frequency: parts[2]?.trim() || "Varies",
              notes: "Consult pharmacist before use",
            });
          }
        });
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        medicines: medicines.length > 0 ? medicines : undefined,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble analyzing that right now. Please try again with a clearer image or different description.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {item.imageUri && (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.messageImage}
            />
          )}
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
          
          {item.medicines && item.medicines.length > 0 && (
            <View style={styles.medicinesBox}>
              <View style={styles.medicinesHeader}>
                <Ionicons name="medical" size={18} color="#fff" />
                <Text style={styles.medicinesTitle}>Recommended Medicines</Text>
              </View>
              {item.medicines.map((med, idx) => (
                <View key={idx} style={styles.medicineItem}>
                  <Text style={styles.medicineName}>{med.name}</Text>
                  <Text style={styles.medicineDetails}>
                    Dose: {med.dosage} • Frequency: {med.frequency}
                  </Text>
                  {med.notes && (
                    <Text style={styles.medicineNotes}>⚠️ {med.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
          
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  }, []);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <LinearGradient colors={["#FF6B6B", "#FF8E72"]} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>🏥 MedBot</Text>
            <Text style={styles.headerSubtitle}>Health & Medicine Assistant</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.onlineIndicator} />
          </View>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#FF6B6B" />
            <Text style={styles.loadingText}>Analyzing...</Text>
          </View>
        </View>
      )}

      {/* Image Preview */}
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={28} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input area */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity 
            style={styles.imageButton}
            onPress={handleImageMenu}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#FF6B6B", "#FF8E72"]}
              style={styles.imageButtonGradient}
            >
              <Ionicons name="camera" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Describe your symptoms or ask a health question..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, (!(inputText.trim() || selectedImage) || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!(inputText.trim() || selectedImage) || isLoading}
          >
            <LinearGradient
              colors={(!(inputText.trim() || selectedImage) || isLoading) ? ["#ccc", "#ccc"] : ["#FF6B6B", "#FF8E72"]}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  backButton: {
    padding: 8,
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "center",
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "white",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 6,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  assistantMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: "#FF6B6B",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: "white",
  },
  assistantText: {
    color: "#333",
  },
  messageImage: {
    width: 200,
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  medicinesBox: {
    backgroundColor: "#FFE5E5",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  medicinesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  medicinesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C92A2A",
  },
  medicineItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 107, 107, 0.2)",
  },
  medicineName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C92A2A",
    marginBottom: 2,
  },
  medicineDetails: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  medicineNotes: {
    fontSize: 11,
    color: "#A61E1E",
    fontStyle: "italic",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  assistantTimestamp: {
    color: "#999",
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "60%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    fontStyle: "italic",
  },
  imagePreviewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
  },
  removeImageButton: {
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 48,
    gap: 8,
  },
  imageButton: {
    padding: 6,
  },
  imageButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 4,
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
