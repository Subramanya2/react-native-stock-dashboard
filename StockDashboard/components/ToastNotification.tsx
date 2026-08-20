import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useToastStore } from '../store/useToastStore';

export const ToastNotification = () => {
  const toast = useToastStore((state) => state.toast);
  const hideToast = useToastStore((state) => state.hideToast);

  if (!toast) return null;

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'error': return '#dc2626';
      case 'info': return '#2563eb';
      default: return '#059669';
    }
  };

  return (
    <View style={[styles.toastContainer, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.toastText}>{toast.message}</Text>
      <TouchableOpacity style={styles.closeBtn} onPress={hideToast}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
