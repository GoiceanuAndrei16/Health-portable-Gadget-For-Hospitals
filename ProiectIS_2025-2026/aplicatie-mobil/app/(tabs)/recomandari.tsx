import { getLoggedUser } from "@/services/session";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Recomandare {
  _id: string;
  pacientId: string;
  medicUid: string;
  tip: string;
  durata: string;
  indicatii: string;
  timestamp: string;
}

interface FisaPacient {
  _id: string;
  pacientUid: string;
  nume: string;
  prenume: string;
}

export default function RecomandariScreen() {
  const [recomandari, setRecomandari] = useState<Recomandare[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const fetchRecomandari = async () => {
    try {
      setLoading(true);
      setErrorText("");

      const user = await getLoggedUser();

      if (!user || !user._id) {
        setErrorText("Nu exista utilizator logat.");
        return;
      }

      const fisaResponse = await axios.get<FisaPacient>(
        `https://beckend-medical.onrender.com/api/pacient-fisa/${user._id}`,
      );

      const fisa = fisaResponse.data;

      if (!fisa || !fisa._id) {
        setErrorText("Nu exista fisa asociata acestui pacient.");
        return;
      }

      const recomandariResponse = await axios.get<Recomandare[]>(
        `https://beckend-medical.onrender.com/api/recomandari/${fisa._id}`,
      );

      setRecomandari(recomandariResponse.data);
    } catch (error: any) {
      console.log("Eroare la recomandari:", error.message);
      setErrorText("A aparut o eroare la preluarea recomandarilor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecomandari();
  }, []);

  const formatDate = (dateString: string) => {
    const data = new Date(dateString);
    return data.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerWrapper}>
          <View style={styles.headerCard}>
            <Text style={styles.title}>Recomandari medicale</Text>
            <Text style={styles.subtitle}>
              Urmareste recomandarile primite de la medicul tau
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color="#2f80ed" />
            <Text style={styles.loadingText}>Se incarca recomandarile...</Text>
          </View>
        ) : errorText ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyTitle}>Eroare</Text>
            <Text style={styles.emptyText}>{errorText}</Text>
          </View>
        ) : recomandari.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyTitle}>Nu exista recomandari</Text>
            <Text style={styles.emptyText}>
              In momentul de fata nu ai recomandari medicale disponibile.
            </Text>
          </View>
        ) : (
          recomandari.map((item) => (
            <View key={item._id} style={styles.card}>
              <View style={styles.accentBar} />

              <View style={styles.cardContent}>
                <View style={styles.topRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.tip}</Text>
                  </View>

                  <View style={styles.dateChip}>
                    <Text style={styles.dateChipText}>
                      {formatDate(item.timestamp)}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoBlock}>
                  <Text style={styles.sectionLabel}>Durata</Text>
                  <Text style={styles.sectionValue}>{item.durata}</Text>
                </View>

                <View style={styles.infoBlock}>
                  <Text style={styles.sectionLabel}>Indicatii</Text>
                  <Text style={styles.indicatii}>{item.indicatii}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f8fc",
  },

  container: {
    flexGrow: 1,
    backgroundColor: "#f4f8fc",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 34,
  },

  headerWrapper: {
    paddingTop: 10,
    marginBottom: 22,
  },

  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    paddingVertical: 24,
    paddingHorizontal: 22,
    shadowColor: "#102a43",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  title: {
    fontSize: 29,
    fontWeight: "800",
    color: "#16324f",
    marginBottom: 8,
    letterSpacing: 0.2,
  },

  subtitle: {
    fontSize: 15,
    color: "#6c7a89",
    lineHeight: 23,
  },

  stateCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 28,
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#102a43",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: "#6b7a90",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    marginBottom: 18,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#102a43",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  accentBar: {
    width: 6,
    backgroundColor: "#2f80ed",
  },

  cardContent: {
    flex: 1,
    padding: 20,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    gap: 10,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f1ff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  badgeText: {
    color: "#2f80ed",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  dateChip: {
    backgroundColor: "#f3f6fa",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  dateChipText: {
    fontSize: 12,
    color: "#708090",
    fontWeight: "600",
  },

  infoBlock: {
    marginBottom: 16,
  },

  sectionLabel: {
    fontSize: 12,
    color: "#8b98a7",
    marginBottom: 7,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
  },

  sectionValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2d3d",
  },

  indicatii: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 25,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2d3d",
    marginBottom: 10,
  },

  emptyText: {
    fontSize: 15,
    color: "#6b7a90",
    textAlign: "center",
    lineHeight: 22,
  },
});
