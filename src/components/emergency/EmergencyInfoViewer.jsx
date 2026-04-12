import { AlertCircle, Phone, Mail, Heart, Pill, Hospital } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmergencyInfoViewer({ emergencyInfo }) {
  if (!emergencyInfo) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No emergency information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Critical Alert Banner */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900 text-sm">Emergency Information</p>
            <p className="text-xs text-red-700 mt-1">This information is visible to authorized caregivers. Keep it updated.</p>
          </div>
        </div>
      </motion.div>

      {/* Blood Type & Hospital */}
      {(emergencyInfo.blood_type || emergencyInfo.hospital_preference) && (
        <div className="grid grid-cols-2 gap-4">
          {emergencyInfo.blood_type && (
            <div className="bg-red-100/30 border border-red-200/50 rounded-lg p-3">
              <p className="text-[10px] font-bold text-red-700 uppercase mb-1">Blood Type</p>
              <p className="text-lg font-black text-red-600">{emergencyInfo.blood_type}</p>
            </div>
          )}
          {emergencyInfo.hospital_preference && (
            <div className="bg-blue-100/30 border border-blue-200/50 rounded-lg p-3">
              <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Preferred Hospital</p>
              <p className="text-sm font-bold text-blue-900">{emergencyInfo.hospital_preference}</p>
            </div>
          )}
        </div>
      )}

      {/* Allergies */}
      {emergencyInfo.allergies?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-sm text-foreground">Allergies</h3>
          </div>
          <div className="space-y-2">
            {emergencyInfo.allergies.map((allergy, i) => (
              <div key={i} className={`rounded-lg p-3 border ${
                allergy.severity === 'severe' ? 'bg-red-50 border-red-200' :
                allergy.severity === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <p className="font-bold text-sm text-foreground">{allergy.allergen}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{allergy.reaction}</p>
                <span className={`text-[10px] font-bold mt-2 inline-block px-1.5 py-0.5 rounded ${
                  allergy.severity === 'severe' ? 'bg-red-200 text-red-900' :
                  allergy.severity === 'moderate' ? 'bg-yellow-200 text-yellow-900' :
                  'bg-blue-200 text-blue-900'
                }`}>
                  {allergy.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Medications */}
      {emergencyInfo.current_medications?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pill className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-foreground">Current Medications</h3>
          </div>
          <div className="space-y-2">
            {emergencyInfo.current_medications.map((med, i) => (
              <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="font-bold text-sm text-foreground">{med.name}</p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                  <span>{med.dosage}</span>
                  <span>•</span>
                  <span>{med.frequency}</span>
                </div>
                {med.reason && <p className="text-xs text-muted-foreground mt-1">For: {med.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Conditions */}
      {emergencyInfo.medical_conditions?.length > 0 && (
        <div>
          <h3 className="font-bold text-sm text-foreground mb-2">Medical Conditions</h3>
          <div className="flex flex-wrap gap-2">
            {emergencyInfo.medical_conditions.map((condition, i) => (
              <span key={i} className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-full">
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Primary Doctor */}
      {emergencyInfo.primary_doctor?.name && (
        <div>
          <h3 className="font-bold text-sm text-foreground mb-3">Primary Doctor</h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2.5">
            <div>
              <p className="font-bold text-sm text-foreground">{emergencyInfo.primary_doctor.name}</p>
              {emergencyInfo.primary_doctor.specialty && (
                <p className="text-xs text-muted-foreground">{emergencyInfo.primary_doctor.specialty}</p>
              )}
            </div>
            {emergencyInfo.primary_doctor.clinic_name && (
              <p className="text-xs text-muted-foreground">{emergencyInfo.primary_doctor.clinic_name}</p>
            )}
            {emergencyInfo.primary_doctor.phone && (
              <a href={`tel:${emergencyInfo.primary_doctor.phone}`} className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80">
                <Phone className="w-3 h-3" /> {emergencyInfo.primary_doctor.phone}
              </a>
            )}
            {emergencyInfo.primary_doctor.email && (
              <a href={`mailto:${emergencyInfo.primary_doctor.email}`} className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80">
                <Mail className="w-3 h-3" /> {emergencyInfo.primary_doctor.email}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Pharmacy */}
      {emergencyInfo.pharmacy?.name && (
        <div>
          <h3 className="font-bold text-sm text-foreground mb-3">Pharmacy</h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2.5">
            <p className="font-bold text-sm text-foreground">{emergencyInfo.pharmacy.name}</p>
            {emergencyInfo.pharmacy.phone && (
              <a href={`tel:${emergencyInfo.pharmacy.phone}`} className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80">
                <Phone className="w-3 h-3" /> {emergencyInfo.pharmacy.phone}
              </a>
            )}
            {emergencyInfo.pharmacy.address && (
              <p className="text-xs text-muted-foreground">{emergencyInfo.pharmacy.address}</p>
            )}
          </div>
        </div>
      )}

      {/* Emergency Contacts */}
      {emergencyInfo.emergency_contacts?.length > 0 && (
        <div>
          <h3 className="font-bold text-sm text-foreground mb-3">Emergency Contacts</h3>
          <div className="space-y-2">
            {[...emergencyInfo.emergency_contacts]
              .sort((a, b) => (a.priority || 999) - (b.priority || 999))
              .map((contact, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{contact.relationship}</p>
                    </div>
                    {contact.priority && (
                      <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">
                        #{contact.priority}
                      </span>
                    )}
                  </div>
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 mt-2">
                      <Phone className="w-3 h-3" /> {contact.phone}
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80">
                      <Mail className="w-3 h-3" /> {contact.email}
                    </a>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Special Instructions */}
      {emergencyInfo.special_instructions && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-bold text-sm text-orange-900 mb-2">Special Instructions</h3>
          <p className="text-sm text-orange-800 whitespace-pre-wrap">{emergencyInfo.special_instructions}</p>
        </div>
      )}

      {/* Last Updated */}
      {emergencyInfo.last_updated_at && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Last updated {new Date(emergencyInfo.last_updated_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}