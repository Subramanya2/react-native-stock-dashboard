import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useOrderExecution } from '../hooks/useOrderExecution';

interface TradeModalProps {
  visible: boolean;
  symbol: string;
  currentPrice: number;
  initialType?: 'BUY' | 'SELL';
  onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  visible,
  symbol,
  currentPrice,
  initialType = 'BUY',
  onClose,
}) => {
  const [type, setType] = useState<'BUY' | 'SELL'>(initialType);
  const [orderStyle, setOrderStyle] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [sharesText, setSharesText] = useState('1');
  const [limitPriceText, setLimitPriceText] = useState(currentPrice.toFixed(2));
  const [simulateError, setSimulateError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const { mutate: executeOrder, isPending } = useOrderExecution();

  const shares = Math.max(1, parseInt(sharesText, 10) || 1);
  const priceToUse = orderStyle === 'LIMIT' ? (parseFloat(limitPriceText) || currentPrice) : currentPrice;
  const totalCost = shares * priceToUse;

  const handleIncrement = () => setSharesText((shares + 1).toString());
  const handleDecrement = () => setSharesText(Math.max(1, shares - 1).toString());

  const handleConfirmOrder = () => {
    setNotice(null);
    executeOrder(
      {
        symbol,
        type,
        shares,
        price: priceToUse,
        simulateError,
      },
      {
        onSuccess: (data) => {
          setNotice(`✅ ${data.message || 'Order placed successfully!'}`);
          setTimeout(() => {
            setNotice(null);
            onClose();
          }, 1200);
        },
        onError: (err: any) => {
          setNotice(`❌ Trade failed: ${err.message}. Portfolio rolled back.`);
        },
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{type} {symbol}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Trade Type Selector */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, type === 'BUY' && styles.buyActive]}
              onPress={() => setType('BUY')}
            >
              <Text style={[styles.toggleText, type === 'BUY' && styles.activeText]}>BUY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, type === 'SELL' && styles.sellActive]}
              onPress={() => setType('SELL')}
            >
              <Text style={[styles.toggleText, type === 'SELL' && styles.activeText]}>SELL</Text>
            </TouchableOpacity>
          </View>

          {/* Order Type (Market vs Limit) */}
          <View style={styles.orderTypeRow}>
            <TouchableOpacity
              style={[styles.chip, orderStyle === 'MARKET' && styles.chipActive]}
              onPress={() => setOrderStyle('MARKET')}
            >
              <Text style={[styles.chipText, orderStyle === 'MARKET' && styles.chipTextActive]}>Market Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, orderStyle === 'LIMIT' && styles.chipActive]}
              onPress={() => setOrderStyle('LIMIT')}
            >
              <Text style={[styles.chipText, orderStyle === 'LIMIT' && styles.chipTextActive]}>Limit Order</Text>
            </TouchableOpacity>
          </View>

          {/* Price & Quantity inputs */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Execution Price</Text>
            {orderStyle === 'MARKET' ? (
              <Text style={styles.readOnlyPrice}>${currentPrice.toFixed(2)} (Market)</Text>
            ) : (
              <TextInput
                style={styles.input}
                value={limitPriceText}
                onChangeText={setLimitPriceText}
                keyboardType="decimal-pad"
              />
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Shares Quantity</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity style={styles.counterBtn} onPress={handleDecrement}>
                <Text style={styles.counterBtnText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.counterInput]}
                value={sharesText}
                onChangeText={setSharesText}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={styles.counterBtn} onPress={handleIncrement}>
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Total calculation */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Estimated Cost</Text>
            <Text style={styles.summaryValue}>${totalCost.toFixed(2)}</Text>
          </View>

          {/* Error Simulation Toggle */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setSimulateError(!simulateError)}
          >
            <View style={[styles.checkbox, simulateError && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>Simulate API Failure (Test Rollback)</Text>
          </TouchableOpacity>

          {notice && <Text style={styles.noticeText}>{notice}</Text>}

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.submitBtn, type === 'BUY' ? styles.buySubmit : styles.sellSubmit]}
            onPress={handleConfirmOrder}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {type === 'BUY' ? 'Place Buy Order' : 'Place Sell Order'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#141c2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0b0f17',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  buyActive: {
    backgroundColor: '#059669',
  },
  sellActive: {
    backgroundColor: '#e11d48',
  },
  toggleText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeText: {
    color: '#ffffff',
  },
  orderTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0b0f17',
    alignItems: 'center',
  },
  chipActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#818cf8',
    fontWeight: 'bold',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 6,
  },
  readOnlyPrice: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 6,
  },
  input: {
    backgroundColor: '#0b0f17',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterBtn: {
    backgroundColor: '#1e293b',
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  counterInput: {
    flex: 1,
    textAlign: 'center',
  },
  summaryBox: {
    backgroundColor: '#0b0f17',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  summaryValue: {
    color: '#10b981',
    fontSize: 22,
    fontWeight: 'bold',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#64748b',
  },
  checkboxChecked: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  checkboxLabel: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  noticeText: {
    color: '#60a5fa',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 13,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buySubmit: {
    backgroundColor: '#059669',
  },
  sellSubmit: {
    backgroundColor: '#e11d48',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
