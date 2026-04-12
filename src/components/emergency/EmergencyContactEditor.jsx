import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import BottomSheetSelect from '@/components/BottomSheetSelect';
import { Loader2, Plus, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function EmergencyContactEditor({ emergencyInfo, onSave }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [data, setData] = useState(emergencyInfo || {
    allergies: [],
    current_medications: [],
    secondary_doctors: [],
    emergency_contacts: [],
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      base44.entities.EmergencyInfo.update(emergencyInfo.id, {
        ...data,
        last_updated_by: user?.email,
        last_updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency-info'] });
      toast.success('Emergency information saved');
      onSave?.();
    },
  });

  const createMutation = useMutation({
    mutationFn: (familyGroupId) =>
      base44.entities.EmergencyInfo.create({
        ...data,
        last_updated_by: user?.email,
        last_updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency-info'] });
      toast.success('Emergency information created');
      onSave?.();
    },
  });

  const addField = (array) => {
    const newArray = [...(data[array] || [])];
    if (array === 'allergies') newArray.push({ allergen: '', reaction: '', severity: 'moderate' });
    else if (array === 'current_medications') newArray.push({ name: '', dosage: '', frequency: '', reason: '' });
    else if (array === 'secondary_doctors') newArray.push({ name: '', specialty: '', phone: '', email: '' });
    else if (array === 'emergency_contacts') newArray.push({ name: '', relationship: 'other', phone: '', email: '', priority: newArray.length + 1 });
    setData({ ...data, [array]: newArray });
  };

  const removeField = (array, index) => {
    const newArray = (data[array] || []).filter((_, i) => i !== index);
    setData({ ...data, [array]: newArray });
  };

  const updateArrayField = (array, index, field, value) => {
    const newArray = [...(data[array] || [])];
    newArray[index] = { ...newArray[index], [field]: value };
    setData({ ...data, [array]: newArray });
  };

  const handleSave = async () => {
    if (emergencyInfo) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Blood Type & Hospital */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-2">Blood Type</label>
          <BottomSheetSelect
            value={data.blood_type || ''}
            onChange={(v) => setData({ ...data, blood_type: v })}
            options={['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown'].map(bt => ({ label: bt, value: bt }))}
            placeholder="Select blood type"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-2">Preferred Hospital</label>
          <input
            type="text"
            value={data.hospital_preference || ''}
            onChange={(e) => setData({ ...data, hospital_preference: e.target.value })}
            placeholder="Hospital name"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Allergies */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Allergies</h3>
          <button onClick={() => addField('allergies')} className="text-xs font-semibold text-primary flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {(data.allergies || []).map((allergy, i) => (
            <div key={i} className="p-3 border border-border rounded-lg space-y-2 bg-red-50/30">
              <input
                type="text"
                value={allergy.allergen}
                onChange={(e) => updateArrayField('allergies', i, 'allergen', e.target.value)}
                placeholder="Allergen (e.g., Peanuts)"
                className="w-full px-2 py-1.5 text-sm border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                type="text"
                value={allergy.reaction}
                onChange={(e) => updateArrayField('allergies', i, 'reaction', e.target.value)}
                placeholder="Reaction (e.g., Anaphylaxis)"
                className="w-full px-2 py-1.5 text-sm border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <BottomSheetSelect
                    value={allergy.severity}
                    onChange={(v) => updateArrayField('allergies', i, 'severity', v)}
                    options={[
                      { label: 'Mild', value: 'mild' },
                      { label: 'Moderate', value: 'moderate' },
                      { label: 'Severe', value: 'severe' }
                    ]}
                    placeholder="Select severity"
                  />
                </div>
                 <button onClick={() => removeField('allergies', i)} className="text-red-600 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Medications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Current Medications</h3>
          <button onClick={() => addField('current_medications')} className="text-xs font-semibold text-primary flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {(data.current_medications || []).map((med, i) => (
            <div key={i} className="p-3 border border-border rounded-lg space-y-2 bg-blue-50/30">
              <input
                type="text"
                value={med.name}
                onChange={(e) => updateArrayField('current_medications', i, 'name', e.target.value)}
                placeholder="Medication name"
                className="w-full px-2 py-1.5 text-sm border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) => updateArrayField('current_medications', i, 'dosage', e.target.value)}
                  placeholder="Dosage"
                  className="px-2 py-1.5 text-sm border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <input
                  type="text"
                  value={med.frequency}
                  onChange={(e) => updateArrayField('current_medications', i, 'frequency', e.target.value)}
                  placeholder="Frequency"
                  className="px-2 py-1.5 text-sm border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={med.reason}
                  onChange={(e) => updateArrayField('current_medications', i, 'reason', e.target.value)}
                  placeholder="Reason"
                  className="flex-1 px-2 py-1.5 text-sm border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button onClick={() => removeField('current_medications', i)} className="text-red-600 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Medical Conditions */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-2">Medical Conditions</label>
        <textarea
          value={(data.medical_conditions || []).join(', ')}
          onChange={(e) => setData({ ...data, medical_conditions: e.target.value.split(',').map(c => c.trim()).filter(Boolean) })}
          placeholder="e.g., Diabetes, Hypertension (comma-separated)"
          className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent resize-none h-16 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Primary Doctor */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Primary Doctor</h3>
        <div className="border border-border rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={data.primary_doctor?.name || ''}
            onChange={(e) => setData({ ...data, primary_doctor: { ...data.primary_doctor, name: e.target.value } })}
            placeholder="Doctor name"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            value={data.primary_doctor?.specialty || ''}
            onChange={(e) => setData({ ...data, primary_doctor: { ...data.primary_doctor, specialty: e.target.value } })}
            placeholder="Specialty"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="tel"
            value={data.primary_doctor?.phone || ''}
            onChange={(e) => setData({ ...data, primary_doctor: { ...data.primary_doctor, phone: e.target.value } })}
            placeholder="Phone"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="email"
            value={data.primary_doctor?.email || ''}
            onChange={(e) => setData({ ...data, primary_doctor: { ...data.primary_doctor, email: e.target.value } })}
            placeholder="Email"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            value={data.primary_doctor?.clinic_name || ''}
            onChange={(e) => setData({ ...data, primary_doctor: { ...data.primary_doctor, clinic_name: e.target.value } })}
            placeholder="Clinic/Hospital name"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Pharmacy */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Pharmacy</h3>
        <div className="border border-border rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={data.pharmacy?.name || ''}
            onChange={(e) => setData({ ...data, pharmacy: { ...data.pharmacy, name: e.target.value } })}
            placeholder="Pharmacy name"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="tel"
            value={data.pharmacy?.phone || ''}
            onChange={(e) => setData({ ...data, pharmacy: { ...data.pharmacy, phone: e.target.value } })}
            placeholder="Pharmacy phone"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            value={data.pharmacy?.address || ''}
            onChange={(e) => setData({ ...data, pharmacy: { ...data.pharmacy, address: e.target.value } })}
            placeholder="Address"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Emergency Contacts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Emergency Contacts</h3>
          <button onClick={() => addField('emergency_contacts')} className="text-xs font-semibold text-primary flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {(data.emergency_contacts || []).map((contact, i) => (
            <div key={i} className="p-3 border border-border rounded-lg space-y-2">
              <input
                type="text"
                value={contact.name}
                onChange={(e) => updateArrayField('emergency_contacts', i, 'name', e.target.value)}
                placeholder="Contact name"
                className="w-full px-2 py-1.5 text-sm border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="grid grid-cols-2 gap-2">
              <BottomSheetSelect
                value={contact.relationship}
                onChange={(v) => updateArrayField('emergency_contacts', i, 'relationship', v)}
                options={[
                  { label: 'Spouse', value: 'spouse' },
                  { label: 'Child', value: 'child' },
                  { label: 'Sibling', value: 'sibling' },
                  { label: 'Parent', value: 'parent' },
                  { label: 'Friend', value: 'friend' },
                  { label: 'Other', value: 'other' }
                ]}
                placeholder="Select relationship"
              />
                <input
                  type="number"
                  value={contact.priority}
                  onChange={(e) => updateArrayField('emergency_contacts', i, 'priority', parseInt(e.target.value))}
                  placeholder="Priority"
                  min="1"
                  className="px-2 py-1.5 text-sm border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                />
                </div>
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => updateArrayField('emergency_contacts', i, 'phone', e.target.value)}
                placeholder="Phone"
                className="w-full px-2 py-1.5 text-sm border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-2">
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => updateArrayField('emergency_contacts', i, 'email', e.target.value)}
                  placeholder="Email (optional)"
                  className="flex-1 px-2 py-1.5 text-sm border border-input rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button onClick={() => removeField('emergency_contacts', i)} className="text-red-600 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Instructions */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-2">Special Instructions</label>
        <textarea
          value={data.special_instructions || ''}
          onChange={(e) => setData({ ...data, special_instructions: e.target.value })}
          placeholder="DNR wishes, special medical instructions, etc."
          className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending || createMutation.isPending}
        className="w-full h-11 rounded-xl font-semibold"
      >
        {updateMutation.isPending || createMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Save Emergency Information'
        )}
      </Button>
    </div>
  );
}