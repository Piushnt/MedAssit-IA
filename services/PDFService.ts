// @ts-ignore
import html2pdf from 'html2pdf.js';

export const PDFService = {
    /**
     * Generates a professional PDF from an HTML element.
     */
    generatePDF: async (elementId: string, filename: string) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('PDF Generation Error:', error);
        }
    },

    /**
     * Layout helpers for the PDF components.
     * Using classes that strictly follow the app's charte graphique.
     */
    styles: {
        header: "flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8",
        doctorInfo: "text-left",
        doctorName: "text-xl font-black text-slate-900",
        doctorSpecialty: "text-xs font-bold text-indigo-600 uppercase tracking-widest",
        clinicName: "text-right font-black text-slate-400 text-xs uppercase tracking-[0.3em]",
        watermark: "fixed inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-45deg] text-6xl font-black text-slate-900 z-0",
        footer: "mt-12 pt-4 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest"
    }
};
