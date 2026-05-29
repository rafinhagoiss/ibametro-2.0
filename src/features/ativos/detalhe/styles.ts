import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },

  back: {
    color: '#2f6ea8',
    fontWeight: 'bold',
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  content: {
    padding: 16,
    paddingBottom: 50,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  patrimonio: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2f6ea8',
  },

  tipo: {
    fontSize: 16,
    marginTop: 4,
  },

  setor: {
    marginTop: 6,
    color: '#64748b',
  },
  metadataBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#64748b',
  },

  badge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeDisponivel: {
    backgroundColor: '#dcfce7',
  },

  badgeAtivo: {
    backgroundColor: '#dbeafe',
  },

  badgeManutencao: {
    backgroundColor: '#fee2e2',
  },

  badgeText: {
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },

  componentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },

  componentName: {
    fontSize: 14,
  },

  ok: {
    color: '#16a34a',
    fontWeight: 'bold',
  },

  defeito: {
    color: '#dc2626',
    fontWeight: 'bold',
  },

  nota: {
    fontSize: 13,
    marginBottom: 8,
    color: '#475569',
  },

  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    minHeight: 90,
    marginTop: 10,
    textAlignVertical: 'top',
  },

  btnNota: {
    backgroundColor: '#2f6ea8',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  btnSalvar: {
    backgroundColor: '#16a34a',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnSalvarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
