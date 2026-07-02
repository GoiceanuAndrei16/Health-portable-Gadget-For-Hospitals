import { getLoggedUser } from "@/services/session";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVER_URL = "https://beckend-medical.onrender.com";

interface Masuratoare {
  _id: string;
  puls_mediu: number;
  temperatura_medie: number;
  timestamp: string;
}

interface Alarma {
  _id: string;
  tip: "alarm" | "warn";
  mesaj: string;
  puls: number;
  temperatura: number;
  rezolvata: boolean;
  timestamp: string;
}

export default function IstoricScreen() {
  const [tabActiv, setTabActiv] = useState<"valori" | "alarme">("valori");
  const [masuratori, setMasuratori] = useState<Masuratoare[]>([]);
  const [alarme, setAlarme] = useState<Alarma[]>([]);
  const [loading, setLoading] = useState(true);
  const [eroare, setEroare] = useState("");

  const incarcaDate = async () => {
    try {
      setLoading(true);
      setEroare("");

      const user = await getLoggedUser();
      if (!user?._id) {
        setEroare("Nu există utilizator logat.");
        return;
      }

      const fisaRes = await axios.get(`${SERVER_URL}/api/pacient-fisa/${user._id}`);
      const fisa = fisaRes.data;

      if (!fisa?._id) {
        setEroare("Nu există fișă asociată acestui cont.");
        return;
      }

      const [masRes, alarmeRes] = await Promise.all([
        axios.get<Masuratoare[]>(`${SERVER_URL}/api/masuratori/${fisa._id}`),
        axios.get<Alarma[]>(`${SERVER_URL}/api/alarme/${fisa._id}`),
      ]);

      const masSort = [...masRes.data].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setMasuratori(masSort);
      setAlarme(alarmeRes.data);
    } catch (err: any) {
      setEroare("Eroare la încărcarea datelor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    incarcaDate();
  }, []);

  const formatData = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ro-RO", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={stiluri.centrat}>
        <ActivityIndicator size="large" color="#2f80ed" />
        <Text style={stiluri.loadingText}>Se încarcă istoricul...</Text>
      </SafeAreaView>
    );
  }

  if (eroare) {
    return (
      <SafeAreaView style={stiluri.centrat}>
        <Text style={stiluri.eroare}>{eroare}</Text>
        <TouchableOpacity style={stiluri.butonReload} onPress={incarcaDate}>
          <Text style={stiluri.butonReloadText}>Încearcă din nou</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={stiluri.safeArea}>
      {/* Header */}
      <View style={stiluri.header}>
        <Text style={stiluri.titlu}>Istoric</Text>
        <TouchableOpacity onPress={incarcaDate}>
          <Text style={stiluri.refresh}>↻ Actualizare</Text>
        </TouchableOpacity>
      </View>

      {/* Tab-uri */}
      <View style={stiluri.tabBar}>
        <TouchableOpacity
          style={[stiluri.tab, tabActiv === "valori" && stiluri.tabActiv]}
          onPress={() => setTabActiv("valori")}
        >
          <Text style={[stiluri.tabText, tabActiv === "valori" && stiluri.tabTextActiv]}>
            📊 Valori ({masuratori.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[stiluri.tab, tabActiv === "alarme" && stiluri.tabActiv]}
          onPress={() => setTabActiv("alarme")}
        >
          <Text style={[stiluri.tabText, tabActiv === "alarme" && stiluri.tabTextActiv]}>
            🔔 Alarme {alarme.filter(a => !a.rezolvata).length > 0
              ? `(${alarme.filter(a => !a.rezolvata).length})`
              : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={stiluri.scroll} showsVerticalScrollIndicator={false}>

        {/* TAB VALORI */}
        {tabActiv === "valori" && (
          masuratori.length === 0 ? (
            <View style={stiluri.cardGol}>
              <Text style={stiluri.golTitlu}>Nicio măsurătoare</Text>
              <Text style={stiluri.golSubtitlu}>
                Datele de la senzori vor apărea după ce dispozitivul wearable trimite prima măsurătoare.
              </Text>
            </View>
          ) : (
            <View style={stiluri.card}>
              <Text style={stiluri.cardTitlu}>📋 Toate măsurătorile</Text>
              {masuratori.map((m) => (
                <View key={m._id} style={stiluri.randul}>
                  <Text style={stiluri.randulData}>{formatData(m.timestamp)}</Text>
                  <View style={stiluri.randulDreapta}>
                    <View style={[stiluri.badge, { backgroundColor: "#fde8e8" }]}>
                      <Text style={[stiluri.badgeText, { color: "#c0392b" }]}>
                        ❤️ {m.puls_mediu} bpm
                      </Text>
                    </View>
                    <View style={[stiluri.badge, { backgroundColor: "#fef3e2" }]}>
                      <Text style={[stiluri.badgeText, { color: "#d35400" }]}>
                        🌡️ {m.temperatura_medie?.toFixed(1)}°C
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )
        )}

        {/* TAB ALARME */}
        {tabActiv === "alarme" && (
          alarme.length === 0 ? (
            <View style={stiluri.cardGol}>
              <Text style={stiluri.golTitlu}>Nicio alarmă</Text>
              <Text style={stiluri.golSubtitlu}>
                Nu ai primit nicio alarmă sau avertizare până acum.
              </Text>
            </View>
          ) : (
            <View style={stiluri.card}>
              <Text style={stiluri.cardTitlu}>🔔 Istoricul alarmelor ({alarme.length})</Text>
              {alarme.map((a) => (
                <View
                  key={a._id}
                  style={[
                    stiluri.alarmaCard,
                    a.tip === "alarm" ? stiluri.alarmaRosie : stiluri.alarmaGalbena,
                  ]}
                >
                  <View style={stiluri.alarmaHeader}>
                    <Text style={stiluri.alarmaTip}>
                      {a.tip === "alarm" ? "🚨 ALARMĂ" : "⚠️ AVERTIZARE"}
                    </Text>
                    {a.rezolvata && (
                      <Text style={stiluri.rezolvat}>✓ Rezolvată</Text>
                    )}
                  </View>
                  <Text style={stiluri.alarmaMesaj}>{a.mesaj}</Text>
                  <View style={stiluri.alarmaValori}>
                    {a.puls > 0 && (
                      <Text style={stiluri.alarmaValoareText}>❤️ {a.puls} bpm</Text>
                    )}
                    {a.temperatura > 0 && (
                      <Text style={stiluri.alarmaValoareText}>🌡️ {a.temperatura?.toFixed(1)}°C</Text>
                    )}
                  </View>
                  <Text style={stiluri.alarmaData}>{formatData(a.timestamp)}</Text>
                </View>
              ))}
            </View>
          )
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const stiluri = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f8fc" },
  centrat: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f4f8fc", padding: 24 },
  loadingText: { marginTop: 12, fontSize: 15, color: "#6b7a90" },
  eroare: { fontSize: 16, color: "#e74c3c", textAlign: "center", marginBottom: 16 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titlu: { fontSize: 26, fontWeight: "800", color: "#16324f" },
  refresh: { fontSize: 14, color: "#2f80ed", fontWeight: "600" },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#e8f0f7",
    borderRadius: 14,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
  tabActiv: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  tabText: { fontSize: 13, color: "#6b7a90", fontWeight: "600" },
  tabTextActiv: { color: "#16324f" },

  scroll: { paddingHorizontal: 16, paddingBottom: 30 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#102a43",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitlu: { fontSize: 16, fontWeight: "700", color: "#16324f", marginBottom: 12 },

  cardGol: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 36,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
  },
  golTitlu: { fontSize: 18, fontWeight: "700", color: "#16324f", marginBottom: 8 },
  golSubtitlu: { fontSize: 14, color: "#8b98a7", textAlign: "center", lineHeight: 20 },

  randul: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f4f8",
  },
  randulData: { fontSize: 12, color: "#8b98a7", marginBottom: 6 },
  randulDreapta: { flexDirection: "row", gap: 6 },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  alarmaCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  alarmaRosie: { backgroundColor: "#fff5f5", borderLeftColor: "#e74c3c" },
  alarmaGalbena: { backgroundColor: "#fffbf0", borderLeftColor: "#f39c12" },
  alarmaHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  alarmaTip: { fontSize: 13, fontWeight: "800", color: "#2d3748" },
  rezolvat: { fontSize: 12, color: "#27ae60", fontWeight: "600" },
  alarmaMesaj: { fontSize: 14, color: "#2d3748", marginBottom: 8, lineHeight: 20 },
  alarmaValori: { flexDirection: "row", gap: 12, marginBottom: 6 },
  alarmaValoareText: { fontSize: 13, color: "#4a5568", fontWeight: "600" },
  alarmaData: { fontSize: 11, color: "#a0aec0" },

  butonReload: {
    backgroundColor: "#2f80ed",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  butonReloadText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
