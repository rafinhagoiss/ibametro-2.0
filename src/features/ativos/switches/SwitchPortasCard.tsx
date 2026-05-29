import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SwitchPortasCardProps {
  totalPortas: string;
  portasUsadas: string;
  portasOcupadas: number[];
  editavel?: boolean;
  onChangeTotalPortas: (valor: string) => void;
  onChangePortasUsadas: (valor: string) => void;
  onChangePortasOcupadas: (portas: number[]) => void;
}

function normalizarNumero(valor: string) {
  return valor.replace(/\D/g, '');
}

function calcularUso(totalPortas: string, portasUsadas: string) {
  const total = Number(totalPortas) || 0;
  const usadas = Number(portasUsadas) || 0;

  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((usadas / total) * 100)));
}

function gerarPortasOcupadasPorQuantidade(totalPortas: number, usadas: number) {
  const totalSeguro = Math.max(0, totalPortas);
  const usadasSeguras = Math.min(Math.max(0, usadas), totalSeguro);

  return Array.from({ length: usadasSeguras }, (_, index) => index + 1);
}

export function SwitchPortasCard({
  totalPortas,
  portasUsadas,
  portasOcupadas,
  editavel = true,
  onChangeTotalPortas,
  onChangePortasUsadas,
  onChangePortasOcupadas,
}: SwitchPortasCardProps) {
  const total = Number(totalPortas) || 0;
  const usadas = portasOcupadas.length || Number(portasUsadas) || 0;
  const percentualUso = calcularUso(totalPortas, String(usadas));
  const portasLivres = Math.max(0, total - usadas);
  const portas = Array.from({ length: Math.min(total, 48) }, (_, index) => index + 1);
  const temMaisPortas = total > 48;

  const handleChangeTotal = (valor: string) => {
    const totalLimpo = normalizarNumero(valor);
    const totalNovo = Number(totalLimpo) || 0;
    const portasValidas = portasOcupadas.filter((porta) => porta <= totalNovo);

    onChangeTotalPortas(totalLimpo);
    onChangePortasOcupadas(portasValidas);
    onChangePortasUsadas(String(portasValidas.length));
  };

  const handleChangeUsadas = (valor: string) => {
    const usadasLimpas = normalizarNumero(valor);
    const usadasNovas = Number(usadasLimpas) || 0;
    const novasPortas = gerarPortasOcupadasPorQuantidade(total, usadasNovas);

    onChangePortasUsadas(usadasLimpas);
    onChangePortasOcupadas(novasPortas);
  };

  const alternarPorta = (porta: number) => {
    if (!editavel) return;

    const jaOcupada = portasOcupadas.includes(porta);
    const proximasPortas = jaOcupada
      ? portasOcupadas.filter((item) => item !== porta)
      : [...portasOcupadas, porta].sort((a, b) => a - b);

    onChangePortasOcupadas(proximasPortas);
    onChangePortasUsadas(String(proximasPortas.length));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Switch - Portas</Text>
      <Text style={styles.subtitle}>
        Toque nas portas para marcar quais estão em uso.
      </Text>

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total de portas</Text>
          <TextInput
            style={styles.input}
            value={totalPortas}
            onChangeText={handleChangeTotal}
            placeholder="Ex: 24"
            keyboardType="numeric"
            editable={editavel}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Portas usadas</Text>
          <TextInput
            style={styles.input}
            value={String(usadas)}
            onChangeText={handleChangeUsadas}
            placeholder="Ex: 18"
            keyboardType="numeric"
            editable={editavel}
          />
        </View>
      </View>

      <View style={styles.switchFace}>
        <View style={styles.brandArea}>
          <View style={styles.statusDot} />
          <View style={styles.statusDotMuted} />
          <Text style={styles.brandText}>SWITCH</Text>
        </View>

        <View style={styles.portsArea}>
          {portas.length === 0 ? (
            <Text style={styles.emptyPortsText}>
              Informe o total de portas para montar o painel.
            </Text>
          ) : (
            portas.map((porta) => {
              const ocupada = portasOcupadas.includes(porta);

              return (
                <TouchableOpacity
                  key={porta}
                  style={[styles.port, ocupada && styles.portOccupied]}
                  onPress={() => alternarPorta(porta)}
                  disabled={!editavel}
                >
                  <View style={styles.portHole} />
                  <Text style={[styles.portLabel, ocupada && styles.portLabelActive]}>
                    {porta}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      {temMaisPortas && (
        <Text style={styles.limitText}>
          Mostrando 48 portas para manter a visualização leve.
        </Text>
      )}

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendFree]} />
          <Text style={styles.legendText}>Livre</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendUsed]} />
          <Text style={styles.legendText}>Em uso</Text>
        </View>
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>{percentualUso}% em uso</Text>
        <Text style={styles.progressText}>{portasLivres} livres</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentualUso}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    height: 44,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#334155',
  },
  switchFace: {
    marginTop: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
  },
  brandArea: {
    width: 58,
    borderRightWidth: 1,
    borderColor: '#cbd5e1',
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  brandText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '800',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  statusDotMuted: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#cbd5e1',
  },
  portsArea: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignContent: 'flex-start',
  },
  port: {
    width: 34,
    height: 34,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94a3b8',
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portOccupied: {
    backgroundColor: '#1e293b',
    borderColor: '#0f172a',
  },
  portHole: {
    width: 18,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#111827',
    marginBottom: 2,
  },
  portLabel: {
    fontSize: 8,
    color: '#334155',
    fontWeight: '800',
  },
  portLabelActive: {
    color: '#f8fafc',
  },
  emptyPortsText: {
    color: '#64748b',
    fontSize: 12,
    paddingVertical: 20,
    textAlign: 'center',
    flex: 1,
  },
  limitText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendFree: {
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#94a3b8',
  },
  legendUsed: {
    backgroundColor: '#1e293b',
  },
  legendText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2f6ea8',
  },
});
