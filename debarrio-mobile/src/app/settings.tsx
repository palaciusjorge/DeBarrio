import { ComingSoonScreen } from '@/components/coming-soon-screen';

export default function SettingsScreen() {
  return (
    <ComingSoonScreen
      description="Pronto podrás personalizar tu experiencia en DeBarrio."
      symbol={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
      title="Ajustes"
    />
  );
}
