import { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function FindCareRedirect() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace('/findcare-demo'), 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={styles.container}> 
      <ActivityIndicator size="large" color="#0071E3" />
      <Text style={styles.text}>
        {Platform.OS === 'web' ? 'Loading Find Care demo…' : 'Opening Find Care demo…'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  }
});
