import { getLoggedUser, removeLoggedUser } from "@/services/session";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVER_URL = "https://beckend-medical.onrender.com";

interface Pacient {
  _id: string;
  nume: string;
  prenume: string;
  varsta: number;
  puls: number;
  temperatura: number;
  pulsMin: number;
  pulsMax: number;
  tempMin: number;
  tempMax: number;
  status: string;
}

function calculeazaStatus(p: Pacient) {
  const pulsMin = p.pulsMin || 60;
  const pulsMax = p.pulsMax || 100;
  const tempMin = p.tempMin || 36;
  const tempMax = p.tempMax || 37.5;

  if (p.puls > pulsMax * 1.2 || p.puls < pulsMin * 0.8 || p.temperatura > tempMax + 1 || p.temperatura < tempMin - 0.5) return "alarm";
  if (p.puls > pulsMax || p.puls < pulsMin || p.temperatura > tempMax || p.temperatura < tempMin) return "warn";
  return "ok";
}

export default function DashboardMedicScreen() {
  const [pacienti, setPacienti] = useState<Pacient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [numeMedic, setNumeMedic] = useState("");
  const router = useRouter();

  const incarcaPacienti = async () => {
    try {
      const user = await getLoggedUser();
      if (!user?._id) return;
      setNumeMedic(user.nume || "Medic");

      const response = await axios.get(`${SERVER_URL}/api/pacienti/${user._id}`);
      setPacienti(response.data);
    } catch (err) {
      console.log("Eroare la încărcare pacienți:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    incarcaPacienti();
    const interval = setInterval(incarcaPacienti, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await removeLoggedUser();
    router.replace("/login" as any);
  };

  const statusColor = (status: string) => {
    if (status === "alarm") return "#e74c3c";
    if (status === "warn") return "#f39c12";
    return "#27ae60";
  };

  const statusText = (status: string) => {
    if (status === "alarm") return "🚨 Alarmă";
    if (status === "warn") return "⚠️ Avertizare";
    return "✅ Normal";
  };

  if (loading) {
    return (
      <SafeAreaView style={stiluri.centrat}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={stiluri.loadingText}>Se încarcă pacienții...</Text>
      </SafeAreaView>
    );
  }

  const alarme = pacienti.filter(p => calculeazaStatus(p) === "alarm");
  const avertizari = pacienti.filter(p => calculeazaStatus(p) === "warn");

  return (
    <SafeAreaView style={stiluri.safeArea}>
      {/* Header */}
      <View style={stiluri.header}>
        <View>
          <Text style={stiluri.titlu}>👨‍⚕️ Dr. {numeMedic}</Text>
          <Text style={stiluri.subtitlu}>{pacienti.length} pacienți înregistrați</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={stiluri.butonLogout}>
          <Text style={stiluri.butonLogoutText}>Ieșire</Text>
        </TouchableOpacity>
      </View>

      {/* Sumar alarme */}
      {(alarme.length > 0 || avertizari.length > 0) && (
        <View style={stiluri.sumarAlarme}>
          {alarme.length > 0 && (
            <View style={[stiluri.badgeAlarma, { backgroundColor: "#fde8e8" }]}>
              <Text style={[stiluri.badgeText, { color: "#c0392b" }]}>
                🚨 {alarme.length} alarme active
              </Text>
            </View>
          )}
          {avertizari.length > 0 && (
            <View style={[stiluri.badgeAlarma, { backgroundColor: "#fef3e2" }]}>
              <Text style={[stiluri.badgeText, { color: "#d35400" }]}>
                ⚠️ {avertizari.length} avertizări
              </Text>
            </View>
          )}
        </View>
      )}

      <ScrollView
        contentContainerStyle={stiluri.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); incarcaPacienti(); }} />
        }
      >
        {pacienti.length === 0 ? (
          <View style={stiluri.gol}>
            <Text style={stiluri.golTitlu}>Niciun pacient</Text>
            <Text style={stiluri.golSubtitlu}>Adaugă pacienți din aplicația web.</Text>
          </View>
        ) : (
          pacienti.map((p) => {
            const status = calculeazaStatus(p);
            const culoare = statusColor(status);
            return (
              <View key={p._id} style={[stiluri.card, { borderLeftColor: culoare }]}>
                <View style={stiluri.cardHeader}>
                  <View style={[stiluri.avatar, { backgroundColor: culoare + "22" }]}>
                    <Text style={[stiluri.avatarText, { color: culoare }]}>
                      {(p.prenume?.[0] || "?")}{(p.nume?.[0] || "?")}
                    </Text>
                  </View>
                  <View style={stiluri.cardInfo}>
                    <Text style={stiluri.cardNume}>{p.prenume} {p.nume}</Text>
                    <Text style={stiluri.cardVarsta}>{p.varsta} ani</Text>
                  </View>
                  <View style={[stiluri.statusBadge, { backgroundColor: culoare + "22" }]}>
                    <Text style={[stiluri.statusText, { color: culoare }]}>
                      {statusText(status)}
                    </Text>
                  </View>
                </View>

                <View style={stiluri.valori}>
                  <View style={stiluri.valoareWrap}>
                    <Text style={stiluri.valoareIcon}>❤️</Text>
                    <Text style={[stiluri.valoare, { color: (p.puls > (p.pulsMax || 100) || p.puls < (p.pulsMin || 60)) ? "#e74c3c" : "#2d3748" }]}>
                      {p.puls} bpm
                    </Text>
                    <Text style={stiluri.limite}>({p.pulsMin}-{p.pulsMax})</Text>
                  </View>
                  <View style={stiluri.valoareWrap}>
                    <Text style={stiluri.valoareIcon}>🌡️</Text>
                    <Text style={[stiluri.valoare, { color: (p.temperatura > (p.tempMax || 37.5) || p.temperatura < (p.tempMin || 36)) ? "#e74c3c" : "#2d3748" }]}>
                      {p.temperatura}°C
                    </Text>
                    <Text style={stiluri.limite}>({p.tempMin}-{p.tempMax})</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const stiluri = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f8fc" },
  centrat: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f4f8fc" },
  loadingText: { marginTop: 12, fontSize: 15, color: "#6b7a90" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titlu: { fontSize: 22, fontWeight: "800", color: "#16324f" },
  subtitlu: { fontSize: 13, color: "#8b98a7", marginTop: 2 },
  butonLogout: {
    backgroundColor: "#fde8e8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  butonLogoutText: { color: "#c0392b", fontWeight: "700", fontSize: 14 },

  sumarAlarme: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  badgeAlarma: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { fontSize: 13, fontWeight: "700" },

  scroll: { paddingHorizontal: 16, paddingBottom: 30 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#102a43",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: "800" },
  cardInfo: { flex: 1 },
  cardNume: { fontSize: 16, fontWeight: "700", color: "#16324f" },
  cardVarsta: { fontSize: 13, color: "#8b98a7", marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "700" },

  valori: { flexDirection: "row", gap: 16 },
  valoareWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  valoareIcon: { fontSize: 16 },
  valoare: { fontSize: 15, fontWeight: "700" },
  limite: { fontSize: 11, color: "#a0aec0" },

  gol: {
    alignItems: "center",
    paddingTop: 60,
  },
  golTitlu: { fontSize: 18, fontWeight: "700", color: "#16324f", marginBottom: 8 },
  golSubtitlu: { fontSize: 14, color: "#8b98a7", textAlign: "center" },
});
