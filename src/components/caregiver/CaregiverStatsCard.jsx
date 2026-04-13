import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  DollarSign,
  Calendar,
  Star,
  ChevronRight,
} from 'lucide-react-native';

const STATS = [
  {
    icon: DollarSign,
    label: 'Earned',
    bgColor: '#dcfce7',
    iconColor: '#16a34a',
    route: '/(caregiver)/earnings',
  },
  {
    icon: Calendar,
    label: 'Bookings',
    bgColor: '#dbeafe',
    iconColor: '#2563eb',
  },
  {
    icon: Star,
    label: 'Rating',
    bgColor: '#fef3c7',
    iconColor: '#d97706',
  },
];

type Props = {
  earnings?: number | string;
  completedCount?: number | string;
  avgRating?: number | null;
};

export default function CaregiverStatsCard({
  earnings = 0,
  completedCount = 0,
  avgRating = null,
}: Props) {
  const values = [
    { value: `$${earnings}`, stat: STATS[0] },
    { value: completedCount, stat: STATS[1] },
    { value: avgRating ? avgRating.toFixed(1) : '—', stat: STATS[2] },
  ];

  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        {values.map(({ value, stat }) => {
          const Icon = stat.icon;
          const isClickable = !!stat.route;

          const content = (
            <>
              <View style={[styles.iconBox, { backgroundColor: stat.bgColor }]}>
                <Icon size={20} color={stat.iconColor} />
              </View>

              <Text style={styles.value}>{value}</Text>
              <Text style={styles.label}>{stat.label}</Text>

              {isClickable && (
                <View style={styles.chevronWrap}>
                  <ChevronRight size={12} color="#6b7280" />
                </View>
              )}
            </>
          );

          if (isClickable) {
            return (
              <Pressable
                key={stat.label}
                onPress={() => router.push(stat.route as any)}
                style={styles.item}
              >
                {content}
              </Pressable>
            );
          }

          return (
            <View key={stat.label} style={styles.item}>
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 20,
    marginTop: -40,
    zIndex: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  chevronWrap: {
    position: 'absolute',
    right: -4,
    top: 12,
  },
});
