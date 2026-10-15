import { ComingSoonScreen } from '@/components/coming-soon-screen';

export default function MapScreen() {
  return (
    <ComingSoonScreen
      description="Estamos preparando una forma sencilla de encontrar comercios locales en el mapa."
      symbol={{ ios: 'map.fill', android: 'map', web: 'map' }}
      title="Tu barrio en el mapa"
    />
  );
}
