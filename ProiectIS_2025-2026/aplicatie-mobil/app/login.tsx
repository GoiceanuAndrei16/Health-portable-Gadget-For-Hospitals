import { saveLoggedUser } from "@/services/session";
import axios from "axios";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SERVER_URL = "https://beckend-medical.onrender.com/api/login";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !parola) {
      Alert.alert("Atenție", "Completează toate câmpurile!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(SERVER_URL, {
        email: email.trim().toLowerCase(),
        parola,
        // ✅ Nu mai trimitem rol_cerut - acceptam orice rol
        rol_cerut: undefined,
      });

      const user = response.data.utilizator;
      await saveLoggedUser(user);

      // ✅ Redirectionare in functie de rol
      if (user.rol === "medic") {
        router.replace("/(tabs-medic)" as any);
      } else if (user.rol === "admin") {
        router.replace("/(tabs-medic)" as any); // adminul vede dashboard medic
      } else {
        router.replace("/(tabs)" as any); // pacientul
      }

    } catch (error: any) {
      const mesajEroare =
        error.response?.data?.mesaj ||
        "Email sau parolă greșite.";
      Alert.alert("❌ Eroare", mesajEroare);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={stiluri.container}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={stiluri.header}>
          <Text style={stiluri.titlu}>Bună ziua! 👋</Text>
          <Text style={stiluri.subtitlu}>Sistem Monitorizare Medicală</Text>
        </View>

        {/* Card login */}
        <View style={stiluri.card}>
          <Text style={stiluri.label}>Adresă email</Text>
          <TextInput
            style={stiluri.input}
            placeholder="ex: ion@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={stiluri.label}>Parolă</Text>
          <TextInput
            style={stiluri.input}
            placeholder="Parola ta"
            value={parola}
            onChangeText={setParola}
            secureTextEntry
          />

          <TouchableOpacity
            style={[stiluri.buton, loading && stiluri.butonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={stiluri.textButon}>
              {loading ? "Se conectează..." : "Intră în cont"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Link register */}
        <TouchableOpacity
          onPress={() => router.push("/register" as any)}
          style={stiluri.linkWrap}
        >
          <Text style={stiluri.link}>
            Nu ai cont?{" "}
            <Text style={stiluri.linkAccent}>Înregistrează-te</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const stiluri = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7f6",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  titlu: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
  },
  subtitlu: {
    fontSize: 15,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7f8c8d",
    marginBottom: 5,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontSize: 15,
    color: "#2c3e50",
  },
  buton: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
    shadowColor: "#3498db",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  butonDisabled: {
    backgroundColor: "#95a5a6",
    shadowOpacity: 0,
    elevation: 0,
  },
  textButon: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  linkWrap: {
    alignItems: "center",
  },
  link: {
    fontSize: 15,
    color: "#7f8c8d",
  },
  linkAccent: {
    color: "#3498db",
    fontWeight: "600",
  },
});
