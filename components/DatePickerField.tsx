import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  required?: boolean;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  error,
  required,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && '*'}
      </Text>
      <Pressable
        style={[styles.button, error && styles.buttonError]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.buttonText, !value && styles.placeholder]}>
          {value ? formatDate(value) : 'Select date'}
        </Text>
        <Calendar size={20} color="#666666" />
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {open && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setOpen(false);
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a472a',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonError: {
    borderColor: '#dc2626',
  },
  buttonText: {
    fontSize: 16,
    color: '#333333',
  },
  placeholder: {
    color: '#999999',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
});
