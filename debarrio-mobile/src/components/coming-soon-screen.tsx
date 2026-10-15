import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type ComingSoonScreenProps = {
  description: string;
  symbol: {
    ios: 'map.fill' | 'gearshape.fill';
    android: 'map' | 'settings';
    web: 'map' | 'settings';
  };
  title: string;
};

export function ComingSoonScreen({
  description,
  symbol,
  title,
}: ComingSoonScreenProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <SymbolView name={symbol} tintColor={colors.primary} size={30} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.iconBackground,
    borderRadius: 22,
    height: 68,
    justifyContent: 'center',
    marginBottom: 20,
    width: 68,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 300,
    textAlign: 'center',
  },
});
