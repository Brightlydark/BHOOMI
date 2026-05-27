import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const FarmMap = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Map preview is not available on Web.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginVertical: 16,
  },
  text: {
    color: '#6B7280',
    fontSize: 14,
  },
});
