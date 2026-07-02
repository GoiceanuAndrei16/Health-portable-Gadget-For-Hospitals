import { getLoggedUser } from "@/services/session";
import axios from "axios";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVER_URL = "https://beckend-medical.onrender.com";

export default function PacientNouScreen() {
  const [tab, setTab] = useState<"demografice" | "medicale" | "valori">("demografice");
  const [loading, setLoading] = useState(false);
  const [idEsp32, setIdEsp32] = useState<string | null>(null);

  const [form, setForm] = useState({
    nume: "", prenume: "", varsta: "", cnp: "", telefon: "", email: "",
    strada: "", oras: "", judet: "", profesie: "", locMunca: "",
    istoricMedical: "", alergii: "", consultatiiCardiologice: "",
    pulsMin: "60", pulsMax: "100", tempMin: "36", tempMax: "37.5",
  });

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSalveaza = async () => {
    if (!form.nume || !form.prenume || !form.cnp) {
      Alert.alert("Atenție", "Completează cel puțin Nume, Prenume și CNP!");
      return;
    }

    setLoading(true);
    try {
      const user = await getLoggedUser();
      const response = await axios.post(`${SERVER_URL}/api/pacienti`, {
        ...form,
        varsta: parseInt(form.varsta) || 0,
        pulsMin: parseInt(form.pulsMin),
        pulsMax: parseInt(form.pulsMax),
        tempMin: parseFloat(form.tempMin),
        tempMax: parseFloat(form.tempMax),
        puls: 0,
        temperatura: 0,
        ecg: "Normal",
        status: "ok",
        medicUid: user._id,
      });

      const pacient = response.data.pacient;
      setIdEsp32(pacient._id);

    } catch (err: any) {
      const mesaj = err.response?.data?.mesaj || "Eroare la salvare.";
      Alert.alert("❌ Eroare", mesaj);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      nume: "", prenume: "", varsta: "", cnp: "", telefon: "", email: "",
      strada: "", oras: "", judet: "", profesie: "", locMunca: "",
      istoricMedical: "", alergii: "", consultatiiCardiologice: "",
      pulsMin: "60", pulsMax: "100", tempMin: "36", tempMax: "37.5",
    });
    setTab("demografice");
    setIdEsp32(null);
  };

  // Ecran succes cu ID ESP32
  if (idEsp32) {
    return (
      <SafeAreaView style={stiluri.safeArea}>
        <ScrollView contentContainerStyle={stiluri.scroll}>
          <View style={stiluri.successCard}>
            <View style={stiluri.successIcon}>
              <Text style={{ fontSize: 40 }}>✅</Text>
            </View>
            <Text style={stiluri.successTitlu}>Fișă creată cu succes!</Text>
            <Text style={stiluri.successSubtitlu}>
              Copiază ID-ul de mai jos și pune-l în codul ESP32 la{" "}
              <Text style={{ fontWeight: "800", color: "#7c3aed" }}>PACIENT_ID</Text>
            </Text>

            <View style={stiluri.idBox}>
              <Text style={stiluri.idLabel}>ID DISPOZITIV IOT (ESP32)</Text>
              <Text style={stiluri.idText} selectable>{idEsp32}</Text>
            </View>

            <View style={stiluri.warningBox}>
              <Text style={stiluri.warningText}>
                ⚠️ Pune acest ID în fișierul{" "}
                <Text style={{ fontWeight: "700" }}>esp32_sanatate.ino</Text>:{"\n"}
                <Text style={stiluri.codeText}>
                  const char* PACIENT_ID = "{idEsp32}";
                </Text>
              </Text>
            </View>

            <TouchableOpacity style={stiluri.buton} onPress={resetForm}>
              <Text style={stiluri.butonText}>Adaugă alt pacient</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={stiluri.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={stiluri.header}>
          <Text style={stiluri.titlu}>👤 Pacient Nou</Text>
        </View>

        {/* Tab-uri */}
        <View style={stiluri.tabBar}>
          {(["demografice", "medicale", "valori"] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[stiluri.tab, tab === t && stiluri.tabActiv]}
              onPress={() => setTab(t)}
            >
              <Text style={[stiluri.tabText, tab === t && stiluri.tabTextActiv]}>
                {t === "demografice" ? "Date" : t === "medicale" ? "Medical" : "Valori"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={stiluri.scroll} keyboardShouldPersistTaps="handled">

          {/* Tab Date Demografice */}
          {tab === "demografice" && (
            <View style={stiluri.sectiune}>
              <Field label="Nume *" value={form.nume} onChangeText={v => updateForm("nume", v)} placeholder="ex: Popescu" />
              <Field label="Prenume *" value={form.prenume} onChangeText={v => updateForm("prenume", v)} placeholder="ex: Ion" />
              <Field label="CNP *" value={form.cnp} onChangeText={v => updateForm("cnp", v)} placeholder="13 cifre" keyboardType="numeric" maxLength={13} />
              <Field label="Vârstă" value={form.varsta} onChangeText={v => updateForm("varsta", v)} placeholder="ex: 65" keyboardType="numeric" />
              <Field label="Telefon" value={form.telefon} onChangeText={v => updateForm("telefon", v)} placeholder="ex: 0722-123-456" keyboardType="phone-pad" />
              <Field label="Email" value={form.email} onChangeText={v => updateForm("email", v)} placeholder="ex: ion@email.com" keyboardType="email-address" />
              <Field label="Stradă" value={form.strada} onChangeText={v => updateForm("strada", v)} placeholder="ex: Str. Florilor nr. 12" />
              <Field label="Oraș" value={form.oras} onChangeText={v => updateForm("oras", v)} placeholder="ex: Timișoara" />
              <Field label="Județ" value={form.judet} onChangeText={v => updateForm("judet", v)} placeholder="ex: Timiș" />
              <Field label="Profesie" value={form.profesie} onChangeText={v => updateForm("profesie", v)} placeholder="ex: Pensionar" />
              <Field label="Loc de muncă" value={form.locMunca} onChangeText={v => updateForm("locMunca", v)} placeholder="ex: Pensionat" />
            </View>
          )}

          {/* Tab Date Medicale */}
          {tab === "medicale" && (
            <View style={stiluri.sectiune}>
              <FieldMultiline label="Istoric Medical" value={form.istoricMedical} onChangeText={v => updateForm("istoricMedical", v)} placeholder="ex: Hipertensiune arterială..." />
              <FieldMultiline label="Alergii" value={form.alergii} onChangeText={v => updateForm("alergii", v)} placeholder="ex: Penicilină, Aspirină..." />
              <FieldMultiline label="Consultații Cardiologice" value={form.consultatiiCardiologice} onChangeText={v => updateForm("consultatiiCardiologice", v)} placeholder="ex: Ultima consultație: 10.01.2026..." />
            </View>
          )}

          {/* Tab Valori Normale */}
          {tab === "valori" && (
            <View style={stiluri.sectiune}>
              <Text style={stiluri.infoText}>
                Definește valorile normale pentru acest pacient. Sistemul va genera alarme automat când valorile depășesc limitele.
              </Text>
              <View style={stiluri.grid}>
                <View style={stiluri.gridItem}>
                  <Field label="Puls minim (bpm)" value={form.pulsMin} onChangeText={v => updateForm("pulsMin", v)} placeholder="60" keyboardType="numeric" />
                </View>
                <View style={stiluri.gridItem}>
                  <Field label="Puls maxim (bpm)" value={form.pulsMax} onChangeText={v => updateForm("pulsMax", v)} placeholder="100" keyboardType="numeric" />
                </View>
                <View style={stiluri.gridItem}>
                  <Field label="Temp. minimă (°C)" value={form.tempMin} onChangeText={v => updateForm("tempMin", v)} placeholder="36.0" keyboardType="decimal-pad" />
                </View>
                <View style={stiluri.gridItem}>
                  <Field label="Temp. maximă (°C)" value={form.tempMax} onChangeText={v => updateForm("tempMax", v)} placeholder="37.5" keyboardType="decimal-pad" />
                </View>
              </View>
            </View>
          )}

        </ScrollView>

        {/* Butoane navigare */}
        <View style={stiluri.footer}>
          {tab !== "demografice" && (
            <TouchableOpacity
              style={stiluri.butonSecundar}
              onPress={() => setTab(tab === "valori" ? "medicale" : "demografice")}
            >
              <Text style={stiluri.butonSecundarText}>← Înapoi</Text>
            </TouchableOpacity>
          )}
          {tab !== "valori" ? (
            <TouchableOpacity
              style={[stiluri.buton, { flex: 1 }]}
              onPress={() => setTab(tab === "demografice" ? "medicale" : "valori")}
            >
              <Text style={stiluri.butonText}>Continuă →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[stiluri.butonVerde, { flex: 1 }, loading && stiluri.butonDisabled]}
              onPress={handleSalveaza}
              disabled={loading}
            >
              <Text style={stiluri.butonText}>
                {loading ? "Se salvează..." : "💾 Salvează Pacient"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", maxLength }: { label: string; value: string; onChangeText: (text: string) => void; placeholder?: string; keyboardType?: any; maxLength?: number }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={stiluri.label}>{label}</Text>
      <TextInput
        style={stiluri.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a0aec0"
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );
}

function FieldMultiline({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (text: string) => void; placeholder?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={stiluri.label}>{label}</Text>
      <TextInput
        style={[stiluri.input, { height: 90, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a0aec0"
        multiline
        numberOfLines={4}
      />
    </View>
  );
}

const stiluri = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f8fc" },
  scroll: { padding: 16, paddingBottom: 20 },

  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  titlu: { fontSize: 26, fontWeight: "800", color: "#16324f" },

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

  sectiune: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },

  infoText: { fontSize: 13, color: "#8b98a7", lineHeight: 20, marginBottom: 16, fontStyle: "italic" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridItem: { width: "48%" },

  label: { fontSize: 12, fontWeight: "600", color: "#7f8c8d", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { backgroundColor: "#f8f9fa", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e0e0e0", fontSize: 15, color: "#2c3e50" },

  footer: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f4f8",
  },
  buton: { backgroundColor: "#8b5cf6", padding: 14, borderRadius: 12, alignItems: "center" },
  butonVerde: { backgroundColor: "#16a34a", padding: 14, borderRadius: 12, alignItems: "center" },
  butonDisabled: { backgroundColor: "#95a5a6" },
  butonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  butonSecundar: { backgroundColor: "#f0f4f8", padding: 14, borderRadius: 12, alignItems: "center", paddingHorizontal: 20 },
  butonSecundarText: { color: "#6b7a90", fontSize: 15, fontWeight: "600" },

  // Ecran succes
  successCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, margin: 16, alignItems: "center", elevation: 3 },
  successIcon: { marginBottom: 16 },
  successTitlu: { fontSize: 22, fontWeight: "800", color: "#16324f", marginBottom: 8, textAlign: "center" },
  successSubtitlu: { fontSize: 15, color: "#6b7a90", textAlign: "center", lineHeight: 22, marginBottom: 20 },
  idBox: { width: "100%", backgroundColor: "#f8f0ff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#c4b5fd", marginBottom: 16 },
  idLabel: { fontSize: 11, fontWeight: "700", color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  idText: { fontSize: 14, color: "#4c1d95", fontFamily: "monospace", fontWeight: "600" },
  warningBox: { width: "100%", backgroundColor: "#fffbeb", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#fcd34d", marginBottom: 20 },
  warningText: { fontSize: 13, color: "#92400e", lineHeight: 20 },
  codeText: { fontSize: 12, fontFamily: "monospace", color: "#78350f" },
});
