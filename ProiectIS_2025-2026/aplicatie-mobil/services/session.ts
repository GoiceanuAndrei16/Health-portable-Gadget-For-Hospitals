import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "logged_user";

export async function saveLoggedUser(user: any) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getLoggedUser() {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export async function removeLoggedUser() {
  await AsyncStorage.removeItem(USER_KEY);
}
