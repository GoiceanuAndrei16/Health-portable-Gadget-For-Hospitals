import { getLoggedUser } from "@/services/session";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVER_URL = "https://beckend-medical.onrender.com";

interface Pacient {
  _id: string;
  nume: string;
  prenume: string;
}

export default function RecomandariMedicScreen() {
  const [pacienti, setPacienti] = useState<Pacient[]>([]);
  const [pacientSelectat, setPacientSelectat] = useState<Pacient | null>(null);
  const [tip, setTip] = useState("");
  const [durata, setDurata] = useState("");
  const [indicatii, setIndicatii] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPacienti, setLoadingPacienti] = useState(true);

  useEffect(() => {
    const incarcaPacienti = async () => {
      try {
        const user = await getLoggedUser();
        if (!user?._id) return;
        const response = await axios.get(`${SERVER_URL}/api/pacienti/${user._id}`);
        setPacienti(response.data);
      } catch (err) {
        console.log("Eroare:", err);
      } finally {
        setLoadingPacienti(false);
      }
    };
    incarcaPacienti();
  }, []);

  const handleTrimite = async () => {
    if (!pacientSelectat) {
      Alert.alert("Atenție", "Selectează un pacient!");
      return;
    }
    if (!tip.trim() || !indicatii.trim()) {
      Alert.alert("Atenție", "Completează tipul și indicațiile!");
      return;
    }

    setLoading(true);
    try {
      const user = await getLoggedUser();
      await axios.post(`${SERVER_URL}/api/recomandari`, {
        pacientId: pacientSelectat._id,
        medicUid: user._id,
        tip: tip.trim(),
        durata: durata.trim(),
        indicatii: indicatii.trim(),
      });

      Alert.alert("✅ Succes!", `Recomandare trimisă pentru ${pacientSelectat.prenume} ${pacientSelectat.nume}.`);
      setTip("");
      setDurata("");
      setIndicatii("");
      setPacientSelectat(null);
    } catch (err) {
      Alert.alert("❌ Eroare", "Nu s-a putut trimite recomandarea.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPacienti) {
    return (
      <SafeAreaView style={stiluri.centrat}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={stiluri.safeArea}>
      <ScrollView contentContainerStyle={stiluri.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={stiluri.header}>
          <Text style={stiluri.titlu}>📋 Recomandări</Text>
          <Text style={stiluri.subtitlu}>Adaugă recomandări pentru pacienți</Text>
        </View>

        {/* Selectare pacient */}
        <View style={stiluri.sectiune}>
          <Text style={stiluri.sectiuneTitlu}>Selectează pacientul</Text>
          {pacienti.length === 0 ? (
            <Text style={stiluri.golText}>Nu ai pacienți înregistrați.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {pacienti.map(p => (
                <TouchableOpacity
                  key={p._id}
                  onPress={() => setPacientSelectat(p)}
                  style={[
                    stiluri.pacientChip,
                    pacientSelectat?._id === p._id && stiluri.pacientChipActiv
                  ]}
                >
                  <Text style={[
                    stiluri.pacientChipText,
                    pacientSelectat?._id === p._id && stiluri.pacientChipTextActiv
                  ]}>
                    {p.prenume} {p.nume}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Formular recomandare */}
        <View style={stiluri.sectiune}>
          <Text style={stiluri.sectiuneTitlu}>Detalii recomandare</Text>

          <Text style={stiluri.label}>Tip activitate / tratament</Text>
          <TextInput
            style={stiluri.input}
            placeholder="ex: Plimbare ușoară, Medicament X"
            value={tip}
            onChangeText={setTip}
          />

          <Text style={stiluri.label}>Durată</Text>
          <TextInput
            style={stiluri.input}
            placeholder="ex: 30 min/zi, 7 zile"
            value={durata}
            onChangeText={setDurata}
          />

          <Text style={stiluri.label}>Indicații detaliate</Text>
          <TextInput
            style={[stiluri.input, stiluri.inputMultiline]}
            placeholder="ex: Ritm moderat, evitați efortul intens..."
            value={indicatii}
            onChangeText={setIndicatii}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Buton trimite */}
        <TouchableOpacity
          style={[stiluri.buton, loading && stiluri.butonDisabled]}
          onPress={handleTrimite}
          disabled={loading}
        >
          <Text style={stiluri.butonText}>
            {loading ? "Se trimite..." : "Trimite recomandarea"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const stiluri = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f8fc" },
  centrat: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f4f8fc" },

  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  header: { paddingTop: 16, paddingBottom: 12 },
  titlu: { fontSize: 26, fontWeight: "800", color: "#16324f" },
  subtitlu: { fontSize: 14, color: "#8b98a7", marginTop: 4 },

  sectiune: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#102a43",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectiuneTitlu: { fontSize: 16, fontWeight: "700", color: "#16324f", marginBottom: 8 },

  golText: { fontSize: 14, color: "#8b98a7", fontStyle: "italic" },

  pacientChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f4f8",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  pacientChipActiv: {
    backgroundColor: "#8b5cf6",
    borderColor: "#7c3aed",
  },
  pacientChipText: { fontSize: 14, color: "#4a5568", fontWeight: "600" },
  pacientChipTextActiv: { color: "#fff" },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7f8c8d",
    marginBottom: 5,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontSize: 15,
    color: "#2c3e50",
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: "top",
  },

  buton: {
    backgroundColor: "#8b5cf6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#8b5cf6",
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
  butonText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
});
