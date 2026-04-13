import { View, Text, StyleSheet } from 'react-native';
import { User, Clock3, MapPin } from 'lucide-react-native';
import { format } from 'date-fns';

type Booking = {
  service_type?: string;
  senior_name?: string;
  scheduled_date?: string | Date;
  address?: string;
  price?: number;
};

type BookingInfoCardProps = {
  booking: Booking;
};

export default function BookingInfoCard({ booking }: BookingInfoCardProps) {
  const icon = booking.service_type === 'companionship' ? '❤️' : '🚗';

  let formattedDate = '';
  try {
    formattedDate = booking.scheduled_date
      ? format(new Date(booking.scheduled_date), 'MMM d, h:mm a')
      : 'No date set';
  } catch {
    formattedDate = 'Invalid date';
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            {booking.service_type ? `${booking.service_type} Visit` : 'Visit'}
          </Text>

          <View style={styles.infoRow}>
            <User size={12} />
            <Text style={styles.infoText}>{booking.senior_name || 'Unknown senior'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock3 size={12} />
            <Text style={styles.infoText}>{formattedDate}</Text>
          </View>

          {!!booking.address && (
            <View style={styles.infoRow}>
              <MapPin size={12} />
              <Text style={styles.infoText}>{booking.address}</Text>
            </View>
          )}
        </View>

        <Text style={styles.price}>${booking.price || 35}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    textTransform: 'capitalize',
    color: '#111827',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    flexShrink: 1,
  },
  price: {
    fontWeight: '900',
    fontSize: 20,
    color: '#0f766e',
  },
});
