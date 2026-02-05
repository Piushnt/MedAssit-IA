
/**
 * Simple PII Anonymizer to protect user data before sending to APIs.
 * In a real-world scenario, this would use more sophisticated NLP.
 */
export const anonymizeText = (text: string): string => {
  let processed = text;

  // Mask Emails
  processed = processed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

  // Mask Phone Numbers (Common formats)
  processed = processed.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE]');

  // Mask Social Security Numbers / ID patterns (Generic 9-digit)
  processed = processed.replace(/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, '[ID]');

  // Mask Names - This is tricky without NLP, but we can look for "Name: [Value]" or "Mr./Ms. [Value]"
  processed = processed.replace(/(Name|Nom|Patient):\s*([A-Z][a-z]+(\s+[A-Z][a-z]+)*)/g, '$1: [PATIENT_NAME]');
  processed = processed.replace(/(Mr\.|Ms\.|Mrs\.|Dr\.)\s+([A-Z][a-z]+)/g, '$1 [NAME]');

  return processed;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};
