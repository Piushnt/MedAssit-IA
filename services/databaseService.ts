import { supabase } from '../lib/supabase';

export const DatabaseService = {
    /**
     * Saves a new medical record (AI analysis) to the database.
     */
    async saveMedicalRecord(data: {
        doctor_id: string;
        patient_id?: string;
        type: 'SOAP' | 'ANALYSIS' | 'SUMMARY' | 'DIRECTIVE';
        query?: string;
        response: string;
        sources?: any[];
    }) {
        const { error } = await supabase
            .from('medical_records')
            .insert([
                {
                    doctor_id: data.doctor_id,
                    patient_id: data.patient_id || 'anonymous',
                    type: data.type,
                    query: data.query,
                    response: data.response,
                    sources: data.sources || []
                }
            ]);

        if (error) {
            console.error('Error saving medical record:', error);
            throw error;
        }
    },

    /**
     * Fetches a doctor's profile.
     */
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        return data;
    },

    /**
     * Saves a new prescription.
     */
    async savePrescription(data: {
        doctor_id: string;
        patient_id: string;
        patient_name: string;
        medications: any[];
        special_instructions?: string;
    }) {
        const { error } = await supabase
            .from('prescriptions')
            .insert([data]);

        if (error) {
            console.error('Error saving prescription:', error);
            throw error;
        }
    },

    /**
     * Fetches prescriptions for the current doctor.
     */
    async getPrescriptions(doctorId: string) {
        const { data, error } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching prescriptions:', error);
            return [];
        }
        return data;
    }
};
