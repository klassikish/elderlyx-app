import { View, Text, StyleSheet } from 'react-native';
import CaregiverLocationTracker from '@/components/CaregiverLocationTracker';
import TransportTimer from '@/components/TransportTimer';

type Trip = {
  id: string | number;
  senior_name?: string;
};

type Props = {
  trips?: Trip[];
};

export default function InProgressTrips({ trips = [] }: Props) {
  if (trips.length === 0) return null;

  return (
    <>
      {trips.map((b) => (
        <View key={String(b.id)} style={styles.outer}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>
                🚗 Trip in Progress — {b.senior_name || 'Unknown'}
              </Text>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>In Progress</Text>
              </View>
            </View>

            <CaregiverLocationTracker bookingId={b.id} />
            <TransportTimer booking={b} />
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
    color: '#111827',
  },
  badge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7c3aed',
  },
});
