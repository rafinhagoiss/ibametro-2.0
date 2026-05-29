import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView } from 'expo-camera';

import { TIPOS_CODIGO_BARRAS } from '../constants';
import { styles } from '../styles';

interface ScannerModalProps {
  visivel: boolean;
  scaneado: boolean;
  onBarcodeScanned: ({ data }: { data: string }) => void;
  onFechar: () => void;
}

export function ScannerModal({
  visivel,
  scaneado,
  onBarcodeScanned,
  onFechar,
}: ScannerModalProps) {
  return (
    <Modal visible={visivel} animationType="slide" transparent={false}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: [...TIPOS_CODIGO_BARRAS],
        }}
        onBarcodeScanned={scaneado ? undefined : onBarcodeScanned}
      >
        <View style={styles.overlayContainer}>
          <Text style={styles.scanInstructions}>
            Alinhe a linha vermelha com o código de barras
          </Text>

          <View style={styles.scanTarget}>
            <View style={styles.scanLaser} />
          </View>

          <TouchableOpacity style={styles.closeScanButton} onPress={onFechar}>
            <Text style={styles.closeScanText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </Modal>
  );
}
