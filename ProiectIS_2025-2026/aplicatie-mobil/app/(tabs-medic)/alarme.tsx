import { getLoggedUser } from "@/services/session";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native" ;
import { SafeAreaView } from "react-native-safe-area-context";

const SERVER_URL = "https://beckend-medical.onrender.com";

interface Alarma {
  _id: string;
  pacientId: string;
  tip: "alarm" | "warn";
  mesaj: string;
  puls: number;
  temperatura: number;
  rezolvata: boolean;
  timestamp: string;
}

interface Pacient {
  _id: string;
  nume: string;
  prenume: string;
}

export default function AlarmeMedicScreen() {
  const [alarme, setAlarme] = useState<Alarma[]>([]);
  const [pacienti, setPacienti] = useState<Pacient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const incarcaDate = async () => {
    try {
      const user = await getLoggedUser();
      if (!user?._id) return;

      const pacientiRes = await axios.get(`${SERVER_URL}/api/pacienti/${user._id}`);
      const listaPacienti = pacientiRes.data;
      setPacienti(listaPacienti);

      // Incarca alarmele pentru toti pacientii
      const toateAlarmele: Alarma[] = [];
      await Promise.all(
        listaPacienti.map(async (p: Pacient) => {
          try {
            const res = await axios.get(`${SERVER_URL}/api/alarme/${p._id}`);
            toateAlarmele.push(...res.data);
          } catch {}
        })
      );

      // Sorteaza descrescator
      toateAlarmele.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAlarme(toateAlarmele);
    } catch (err) {
      console.log("Eroare alarme:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    incarcaDate();
    const interval = setInterval(incarcaDate, 5000);
    return () => clearInterval(interval);
  }, []);

  const numelePacient = (pacientId: string) => {
    const p = pacienti.find(p => p._id === pacientId);
    return p ? `${p.prenume} ${p.nume}` : "Pacient necunoscut";
  };

  const rezolvaAlarma = async (alarmaId: string) => {
    try {
      await axios.put(`${SERVER_URL}/api/alarme/${alarmaId}/rezolva`);
      incarcaDate();
    } catch (err) {
      console.log("Eroare rezolvare alarma:", err);
    }
  };

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
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={stiluri.loadingText}>Se încarcă alarmele...</Text>
      </SafeAreaView>
    );
  }

  const alarmeActive = alarme.filter(a => !a.rezolvata);
  const alarmeRezolvate = alarme.filter(a => a.rezolvata);

  return (
    <SafeAreaView style={stiluri.safeArea}>
      <View style={stiluri.header}>
        <Text style={stiluri.titlu}>🔔 Alarme</Text>
        <Text style={stiluri.subtitlu}>
          {alarmeActive.length > 0
            ? `${alarmeActive.length} alarme active`
            : "Nicio alarmă activă"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={stiluri.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); incarcaDate(); }} />
        }
      >
        {alarme.length === 0 ? (
          <View style={stiluri.gol}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
            <Text style={stiluri.golTitlu}>Totul în regulă</Text>
            <Text style={stiluri.golSubtitlu}>Niciun pacient nu are valori în afara limitelor.</Text>
          </View>
        ) : (
          <>
            {/* Alarme active */}
            {alarmeActive.length > 0 && (
              <>
                <Text style={stiluri.sectiuneTitlu}>🚨 Active ({alarmeActive.length})</Text>
                {alarmeActive.map(a => (
                  <View key={a._id} style={[stiluri.card, a.tip === "alarm" ? stiluri.cardRosu : stiluri.cardGalben]}>
                    <View style={stiluri.cardHeader}>
                      <View>
                        <Text style={stiluri.cardTip}>
                          {a.tip === "alarm" ? "🚨 ALARMĂ CRITICĂ" : "⚠️ AVERTIZARE"}
                        </Text>
                        <Text style={stiluri.cardPacient}>{numelePacient(a.pacientId)}</Text>
                      </View>
                    </View>
                    <Text style={stiluri.cardMesaj}>{a.mesaj}</Text>
                    <View style={stiluri.cardValori}>
                      {a.puls > 0 && <Text style={stiluri.cardValoare}>❤️ {a.puls} bpm</Text>}
                      {a.temperatura > 0 && <Text style={stiluri.cardValoare}>🌡️ {a.temperatura}°C</Text>}
                    </View>
                    <View style={stiluri.cardFooter}>
                      <Text style={stiluri.cardData}>{formatData(a.timestamp)}</Text>
                      <TouchableOpacity
                        style={stiluri.butonRezolva}
                        onPress={() => rezolvaAlarma(a._id)}
                      >
                        <Text style={stiluri.butonRezolvaText}>✓ Rezolvă</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Alarme rezolvate */}
            {alarmeRezolvate.length > 0 && (
              <>
                <Text style={[stiluri.sectiuneTitlu, { marginTop: 16 }]}>
                  ✅ Rezolvate ({alarmeRezolvate.length})
                </Text>
                {alarmeRezolvate.slice(0, 10).map(a => (
                  <View key={a._id} style={[stiluri.card, stiluri.cardGri]}>
                    <View style={stiluri.cardHeader}>
                      <Text style={stiluri.cardTipGri}>
                        {a.tip === "alarm" ? "Alarmă" : "Avertizare"} — rezolvată
                      </Text>
                    </View>
                    <Text style={stiluri.cardPacientGri}>{numelePacient(a.pacientId)}</Text>
                    <Text style={stiluri.cardData}>{formatData(a.timestamp)}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const stiluri = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f8fc" },
  centrat: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f4f8fc" },
  loadingText: { marginTop: 12, fontSize: 15, color: "#6b7a90" },

  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  titlu: { fontSize: 26, fontWeight: "800", color: "#16324f" },
  subtitlu: { fontSize: 13, color: "#8b98a7", marginTop: 2 },

  scroll: { padding: 16, paddingBottom: 40 },

  sectiuneTitlu: { fontSize: 15, fontWeight: "700", color: "#4a5568", marginBottom: 10 },

  card: {
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
  cardRosu: { backgroundColor: "#fff5f5", borderLeftColor: "#e74c3c" },
  cardGalben: { backgroundColor: "#fffbf0", borderLeftColor: "#f39c12" },
  cardGri: { backgroundColor: "#f8f9fa", borderLeftColor: "#a0aec0" },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  cardTip: { fontSize: 13, fontWeight: "800", color: "#2d3748" },
  cardTipGri: { fontSize: 13, fontWeight: "600", color: "#718096" },
  cardPacient: { fontSize: 16, fontWeight: "700", color: "#16324f", marginTop: 2 },
  cardPacientGri: { fontSize: 14, color: "#718096", marginBottom: 4 },
  cardMesaj: { fontSize: 14, color: "#4a5568", lineHeight: 20, marginBottom: 8 },
  cardValori: { flexDirection: "row", gap: 16, marginBottom: 8 },
  cardValoare: { fontSize: 14, fontWeight: "700", color: "#2d3748" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardData: { fontSize: 11, color: "#a0aec0" },

  butonRezolva: {
    backgroundColor: "#ebf8f4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27ae60",
  },
  butonRezolvaText: { fontSize: 13, color: "#27ae60", fontWeight: "700" },

  gol: { alignItems: "center", paddingTop: 80 },
  golTitlu: { fontSize: 20, fontWeight: "700", color: "#16324f", marginBottom: 8 },
  golSubtitlu: { fontSize: 14, color: "#8b98a7", textAlign: "center", lineHeight: 20 },
});
