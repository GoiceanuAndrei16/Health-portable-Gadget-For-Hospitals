import { getLoggedUser, removeLoggedUser } from "@/services/session";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVER_URL = "https://beckend-medical.onrender.com";

interface DateSenzori {
  puls_mediu: number | string;
  temperatura_medie: number | string;
  mesaj?: string;
}

export default function HomeScreen() {
  const [dateSenzori, setDateSenzori] = useState<DateSenzori | null>(null);
  const [numePacient, setNumePacient] = useState("");
  const [loading, setLoading] = useState(true);
  const [fisaGasita, setFisaGasita] = useState(true);
  const router = useRouter();

  const fetchDate = async () => {
    try {
      const user = await getLoggedUser();
      if (!user?._id) return;

      setNumePacient(user.nume || "Pacient");

      const fisaResponse = await axios.get(
        `${SERVER_URL}/api/pacient-fisa/${user._id}`
      );
      const fisa = fisaResponse.data;

      if (!fisa?._id) {
        setFisaGasita(false);
        setDateSenzori({ puls_mediu: "--", temperatura_medie: "--" });
        return;
      }

      setFisaGasita(true);
      const dateResponse = await axios.get<DateSenzori>(
        `${SERVER_URL}/api/date-pacient/${fisa._id}`
      );
      setDateSenzori(dateResponse.data);
    } catch (error: any) {
      setFisaGasita(false);
      setDateSenzori({ puls_mediu: "--", temperatura_medie: "--" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogOut = async () => {
    await removeLoggedUser();
    router.replace("/login");
  };

  useEffect(() => {
    fetchDate();
    const interval = setInterval(fetchDate, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={stiluri.safeArea}>

      {/* Header */}
      <View style={stiluri.header}>
        <View>
          <Text style={stiluri.salut}>Bună ziua! 👋</Text>
          <Text style={stiluri.nume}>{numePacient}</Text>
        </View>
        <TouchableOpacity style={stiluri.butonLogout} onPress={handleLogOut}>
          <Text style={stiluri.butonLogoutText}>Ieșire</Text>
        </TouchableOpacity>
      </View>

      {/* Continut */}
      {loading ? (
        <View style={stiluri.centrat}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={stiluri.loadingText}>Se încarcă datele...</Text>
        </View>
      ) : !fisaGasita ? (
        <View style={stiluri.centrat}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏥</Text>
          <Text style={stiluri.fisaLipsaTitlu}>Fișă medicală inexistentă</Text>
          <Text style={stiluri.fisaLipsaSubtitlu}>
            Medicul tău nu a creat încă fișa ta medicală. Revino după consultație.
          </Text>
        </View>
      ) : (
        <View style={stiluri.continut}>

          {/* Card puls */}
          <View style={stiluri.card}>
            <View style={stiluri.cardIconWrap}>
              <Text style={stiluri.cardIcon}>❤️</Text>
            </View>
            <Text style={stiluri.cardLabel}>Puls Cardiac</Text>
            <Text style={stiluri.cardValoare}>
              {dateSenzori?.puls_mediu ?? "--"}
              <Text style={stiluri.cardUnit}> bpm</Text>
            </Text>
          </View>

          {/* Card temperatura */}
          <View style={stiluri.card}>
            <View style={stiluri.cardIconWrap}>
              <Text style={stiluri.cardIcon}>🌡️</Text>
            </View>
            <Text style={stiluri.cardLabel}>Temperatură Corp</Text>
            <Text style={stiluri.cardValoare}>
              {dateSenzori?.temperatura_medie ?? "--"}
              <Text style={stiluri.cardUnit}> °C</Text>
            </Text>
          </View>

          {/* Status live */}
          <View style={stiluri.liveWrap}>
            <View style={stiluri.liveDot} />
            <Text style={stiluri.liveText}>Actualizare automată la 5 secunde</Text>
          </View>

        </View>
      )}

    </SafeAreaView>
  );
}

const stiluri = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f8fc" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  salut: { fontSize: 14, color: "#8b98a7" },
  nume: { fontSize: 22, fontWeight: "800", color: "#16324f", marginTop: 2 },
  butonLogout: {
    backgroundColor: "#fde8e8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  butonLogoutText: { color: "#c0392b", fontWeight: "700", fontSize: 14 },

  centrat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: { marginTop: 12, fontSize: 15, color: "#6b7a90" },
  fisaLipsaTitlu: { fontSize: 20, fontWeight: "700", color: "#16324f", marginBottom: 8, textAlign: "center" },
  fisaLipsaSubtitlu: { fontSize: 14, color: "#8b98a7", textAlign: "center", lineHeight: 22 },

  continut: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#102a43",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f4f8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardIcon: { fontSize: 30 },
  cardLabel: { fontSize: 14, color: "#8b98a7", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  cardValoare: { fontSize: 48, fontWeight: "800", color: "#16324f" },
  cardUnit: { fontSize: 20, fontWeight: "400", color: "#8b98a7" },

  liveWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#27ae60",
  },
  liveText: { fontSize: 13, color: "#8b98a7" },
});
