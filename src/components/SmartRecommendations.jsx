import { Lightbulb, CheckCircle2 } from 'lucide-react';

export default function SmartRecommendations({ playbacks }) {
  if (!playbacks.length) return null;

  const recommendations = [];

  // Analyze patterns
  const lowMoodCount = playbacks.filter(p => p.mood === 'low').length;
  const eatingIssues = playbacks.filter(p => p.eating !== 'full').length;
  const confusionCount = playbacks.filter(p => p.confusion_observed).length;

  if (lowMoodCount > playbacks.length * 0.3) {
    recommendations.push('Schedule more engagement activities to boost mood');
  }
  if (eatingIssues > playbacks.length * 0.4) {
    recommendations.push('Increase meal prep visits or adjust food preferences');
  }
  if (confusionCount > 0) {
    recommendations.push('Consider cognitive stimulation during visits');
  }
  if (playbacks.filter(p => p.medication_taken).length < playbacks.length * 0.9) {
    recommendations.push('Set daily medication reminders with caregiver');
  }

  if (recommendations.length === 0) {
    recommendations.push('Current care plan is working well — maintain routine');
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-blue-600" />
        <p className="text-xs font-bold text-blue-900">Smart Recommendations</p>
      </div>
      <ul className="space-y-1.5">
        {recommendations.map((rec, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-blue-900">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}