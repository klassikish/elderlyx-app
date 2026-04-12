/**
 * Independence Score formula
 * Score = 0
 * if backgroundCheckClear: +30
 * if videoScore > 7: +20
 * if quizScore > 80: +15
 * if experience > 1 year: +15
 * if fast onboarding: +10
 * if good answers: +10
 * Max = 100
 */

export const INDEPENDENCE_CRITERIA = [
  {
    key: 'background_check_clear',
    label: 'Identity Verified',
    points: 30,
    check: (s) => !!s.background_check_clear,
  },
  {
    key: 'video_score',
    label: 'Video Assessment > 7',
    points: 20,
    check: (s) => (s.video_score || 0) > 7,
  },
  {
    key: 'quiz_score',
    label: 'Wellness Quiz > 80',
    points: 15,
    check: (s) => (s.quiz_score || 0) > 80,
  },
  {
    key: 'experience_years',
    label: 'Independent > 1 yr',
    points: 15,
    check: (s) => (s.experience_years || 0) > 1,
  },
  {
    key: 'fast_onboarding',
    label: 'Fast Onboarding',
    points: 10,
    check: (s) => !!s.fast_onboarding,
  },
  {
    key: 'good_answers',
    label: 'Quality Responses',
    points: 10,
    check: (s) => !!s.good_answers,
  },
];

export function calcIndependenceScore(senior) {
  return INDEPENDENCE_CRITERIA.reduce(
    (sum, c) => sum + (c.check(senior) ? c.points : 0),
    0
  );
}