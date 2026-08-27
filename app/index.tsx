import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, Modal, Vibration } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [targetLocation, setTargetLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    let subscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Ative a localização para ligar o radar GPS.');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          const currentCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          setUserLocation(currentCoords);

          // Cria o alvo ~20 metros de distância da sua posição inicial para você testar
          setTargetLocation((prevTarget) => {
            if (!prevTarget) {
              return {
                latitude: currentCoords.latitude + 0.0002, // Pequeno deslocamento
                longitude: currentCoords.longitude + 0.0002,
              };
            }
            return prevTarget;
          });

          if (mapRef.current) {
            mapRef.current.animateToRegion({
              ...currentCoords,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            }, 500);
          }
        }
      );
    })();

    return () => subscription?.remove();
  }, []);

  // Calcula a distância sempre que o usuário se mover ou o alvo for definido
  useEffect(() => {
    if (userLocation && targetLocation) {
      const dist = getDistance(userLocation, targetLocation);
      setDistance(dist);

      if (dist <= 8 && !isUnlocked) {
        setIsUnlocked(true);
        Vibration.vibrate([0, 500, 200, 500]);
      }
    }
  }, [userLocation, targetLocation]);

  const getHudTheme = () => {
    if (distance === null) return { color: '#7f8c8d', status: 'Conectando GPS...' };
    if (distance > 100) return { color: '#2980b9', status: 'Gelado ❄️' };
    if (distance >= 20) return { color: '#e67e22', status: 'Quente 🔥' };
    return { color: '#c0392b', status: 'Fogo! 💥' };
  };

  const theme = getHudTheme();

  return (
    <View style={styles.container}>
      {userLocation && (
        <MapView
          ref={mapRef}
          style={styles.map}
          mapType="satellite"
          showsUserLocation={true}
          showsMyLocationButton={true}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.001,
            longitudeDelta: 0.001,
          }}
        >
          {targetLocation && distance !== null && distance < 10 && (
            <Marker
              coordinate={targetLocation}
              title="Tesouro do Fundador 🏆"
              description="Você encontrou o código digital!"
            />
          )}
        </MapView>
      )}

      <View style={[styles.hud, { backgroundColor: theme.color }]}>
        <Text style={styles.hudStatus}>{theme.status}</Text>
        <Text style={styles.hudDistance}>
          {distance !== null ? `${distance} metros` : 'Buscando...'}
        </Text>
      </View>

      <Modal visible={isUnlocked} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.victoryTitle}>🎉 Tesouro Desbloqueado!</Text>
            <Text style={styles.victoryText}>
              Parabéns! Você alcançou o ponto exato e resgatou O Código do Fundador.
            </Text>
            <TouchableOpacity
              style={styles.rewardButton}
              onPress={() => Alert.alert('Recompensa', 'Código do Fundador: #SESI_FOUNDER_2026')}
            >
              <Text style={styles.rewardButtonText}>Resgatar Recompensa 🏆</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={() => setIsUnlocked(false)}
            >
              <Text style={styles.resetButtonText}>Fechar / Recomeçar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  hud: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 8,
  },
  hudStatus: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  hudDistance: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
  },
  victoryTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  victoryText: { fontSize: 15, color: '#7f8c8d', textAlign: 'center', marginBottom: 20 },
  rewardButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  rewardButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  resetButton: { paddingVertical: 10 },
  resetButtonText: { color: '#7f8c8d', fontSize: 14, textDecorationLine: 'underline' },
});