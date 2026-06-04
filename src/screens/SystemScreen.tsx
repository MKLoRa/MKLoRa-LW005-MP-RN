import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'System'> | { title: string };

const SystemScreen: React.FC<Props> = () => (
  <View style={styles.container}>
    <Text style={styles.title}>System</Text>
    <Text style={styles.hint}>页面占位 — 后续按 iOS MKMPSystemController 实现</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5'},
  title: {fontSize: 20, fontWeight: '600', color: '#333'},
  hint: {fontSize: 14, color: '#999', marginTop: 12, paddingHorizontal: 24, textAlign: 'center'},
});

export default SystemScreen;
