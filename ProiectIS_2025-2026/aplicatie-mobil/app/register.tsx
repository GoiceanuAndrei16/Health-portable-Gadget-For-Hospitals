import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
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
} from 'react-native';

const SERVER_URL = "https://beckend-medical.onrender.com/api/register";

export default function RegisterScreen() {
  const router = useRouter();

  const [nume, setNume] = useState('');
  const [email, setEmail] = useState('');
  const [parola, setParola] = useState('');
  const [confirmaParola, setConfirmaParola] = useState('');
  const [cnp, setCnp] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Validari ────────────────────────────────────────────
  const valideaza = () => {
    if (!nume.trim()) {
      Alert.alert("Atenție", "Completează numele complet.");
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert("Atenție", "Completează o adresă de email validă.");
      return false;
    }
    if (parola.length < 6) {
      Alert.alert("Atenție", "Parola trebuie să aibă cel puțin 6 caractere.");
      return false;
    }
    if (parola !== confirmaParola) {
      Alert.alert("Atenție", "Parolele nu coincid.");
      return false;
    }
    if (cnp.trim().length !== 13 || !/^\d+$/.test(cnp.trim())) {
      Alert.alert("Atenție", "CNP-ul trebuie să aibă exact 13 cifre.");
      return false;
    }
    return true;
  };

  // ── Inregistrare ────────────────────────────────────────
  const handleRegister = async () => {
    if (!valideaza()) return;

    setLoading(true);
    try {
      const response = await axios.post(SERVER_URL, {
        nume: nume.trim(),
        email: email.trim().toLowerCase(),
        parola,
        rol: 'pacient',
        cnp: cnp.trim(),
      });

      // Redirect automat la login, fara sa mai astepte confirmarea utilizatorului
      router.replace('/login' as any);

    } catch (error: any) {
      const mesajEroare = error.response?.data?.mesaj || "Eroare la creare cont. Verifică conexiunea.";
      Alert.alert("❌ Eroare", mesajEroare);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={stiluri.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={stiluri.header}>
          <Text style={stiluri.titlu}>Creare Cont</Text>
          <Text style={stiluri.subtitlu}>Sistem Monitorizare Medicală</Text>
        </View>

        {/* Sectiunea: Date cont */}
        <View style={stiluri.sectiune}>
          <Text style={stiluri.sectiuneTitlu}>👤 Date cont</Text>

          <Text style={stiluri.label}>Nume complet</Text>
          <TextInput
            style={stiluri.input}
            placeholder="ex: Ion Popescu"
            value={nume}
            onChangeText={setNume}
            autoCapitalize="words"
          />

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
            placeholder="Minim 6 caractere"
            value={parola}
            onChangeText={setParola}
            secureTextEntry
          />

          <Text style={stiluri.label}>Confirmă parola</Text>
          <TextInput
            style={stiluri.input}
            placeholder="Repetă parola"
            value={confirmaParola}
            onChangeText={setConfirmaParola}
            secureTextEntry
          />
        </View>

        {/* Sectiunea: Date medicale */}
        <View style={stiluri.sectiune}>
          <Text style={stiluri.sectiuneTitlu}>🏥 Date medicale</Text>
          <Text style={stiluri.infoText}>
            CNP-ul este folosit pentru a lega contul tău de fișa medicală
            creată de medicul tău.
          </Text>

          <Text style={stiluri.label}>CNP</Text>
          <TextInput
            style={stiluri.input}
            placeholder="13 cifre"
            value={cnp}
            onChangeText={(text) => setCnp(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={13}
          />
          {cnp.length > 0 && (
            <Text style={[
              stiluri.cnpContor,
              { color: cnp.length === 13 ? '#27ae60' : '#e74c3c' }
            ]}>
              {cnp.length}/13 cifre {cnp.length === 13 ? '✓' : ''}
            </Text>
          )}
        </View>

        {/* Buton register */}
        <TouchableOpacity
          style={[stiluri.buton, loading && stiluri.butonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={stiluri.butonText}>
            {loading ? "Se creează contul..." : "Înregistrează-te"}
          </Text>
        </TouchableOpacity>

        {/* Link login */}
        <TouchableOpacity
          onPress={() => router.replace('/login' as any)}
          style={stiluri.linkWrap}
        >
          <Text style={stiluri.link}>
            Ai deja cont? <Text style={stiluri.linkAccent}>Loghează-te aici</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const stiluri = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f4f7f6',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titlu: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  subtitlu: {
    fontSize: 15,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 6,
  },
  sectiune: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectiuneTitlu: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 5,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 15,
    color: '#2c3e50',
  },
  infoText: {
    fontSize: 13,
    color: '#95a5a6',
    lineHeight: 19,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  cnpContor: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 2,
  },
  buton: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#27ae60',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  butonDisabled: {
    backgroundColor: '#95a5a6',
    shadowOpacity: 0,
    elevation: 0,
  },
  butonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  linkWrap: {
    alignItems: 'center',
    marginTop: 20,
  },
  link: {
    fontSize: 15,
    color: '#7f8c8d',
  },
  linkAccent: {
    color: '#3498db',
    fontWeight: '600',
  },
});
