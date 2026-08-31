function processClinicalRules(extractedData) {
  const { document_type, patient_age, ai_confidence_score, extracted_values } = extractedData;
  let status = 'Needs Review';
  let failure_reason = null;
  let finalMeasure = null;
  let finalDate = null;
  let rules_passed = 0;
  let format_validity = 0;
  let score = 0;

  if (document_type === 'UNKNOWN' || !extracted_values || extracted_values.length === 0) {
    return {
      document_type,
      measure: null,
      measurement_date: null,
      patient_age,
      status: 'Needs Review',
      confidence_score: 0,
      failure_reason: 'No clear BP or HbA1c measure identified',
      raw_ai_response: extractedData
    };
  }

  if (patient_age !== null && patient_age < 18) {
    return {
      document_type,
      measure: null,
      measurement_date: null,
      patient_age,
      status: 'Needs Review',
      confidence_score: 0,
      failure_reason: 'Patient under 18 years old.',
      raw_ai_response: extractedData
    };
  }

  if (document_type === 'BP') {
    const invalidLabels = ['goal', 'target', 'previous', 'past', 'baseline', 'reference'];
    const validEntries = extracted_values.filter(entry => {
      const labelLower = (entry.label || '').toLowerCase();
      return !invalidLabels.some(invalid => labelLower.includes(invalid));
    });

    const formatRegex = /^\d{2,3}\/\d{2,3}$/;
    const formattedEntries = validEntries.filter(entry => formatRegex.test(entry.value));

    if (formattedEntries.length === 0) {
      failure_reason = 'No valid BP format found.';
    } else {
      format_validity = 1;
      rules_passed = 1;
      
      formattedEntries.sort((a, b) => {
        if (a.date && b.date && a.date !== b.date) {
          return new Date(b.date) - new Date(a.date); // Most recent first
        }
        // If dates unavailable/identical, lowest combined sum
        const [aSystolic, aDiastolic] = a.value.split('/').map(Number);
        const [bSystolic, bDiastolic] = b.value.split('/').map(Number);
        return (aSystolic + aDiastolic) - (bSystolic + bDiastolic);
      });

      const selected = formattedEntries[0];
      finalMeasure = selected.value;
      finalDate = selected.date;
    }
  } else if (document_type === 'A1C') {
    const invalidLabels = ['goal', 'target', 'reference range', 'historical'];
    const validEntries = extracted_values.filter(entry => {
      const labelLower = (entry.label || '').toLowerCase();
      return !invalidLabels.some(invalid => labelLower.includes(invalid));
    });

    const parsedEntries = validEntries.map(entry => {
      const numericVal = parseFloat(entry.value.replace(/[^0-9.]/g, ''));
      return { ...entry, numericVal };
    }).filter(entry => !isNaN(entry.numericVal));

    if (parsedEntries.length === 0) {
      failure_reason = 'No valid HbA1c numeric value found.';
    } else {
      format_validity = 1;
      rules_passed = 1;

      parsedEntries.sort((a, b) => a.numericVal - b.numericVal);
      const selected = parsedEntries[0];
      const val = selected.numericVal;
      finalDate = selected.date;

      if (val > 5.9) {
        finalMeasure = `${val}% (Diabetes)`;
      } else if (val > 5.7 && val <= 5.9) {
        finalMeasure = `${val}% (Prediabetes)`;
      } else {
        finalMeasure = `${val}%`;
      }
    }
  }

  score = (ai_confidence_score * 0.4) + (format_validity * 0.3) + (rules_passed * 0.3);

  if (score >= 0.80) {
    status = 'Success';
  } else if (score >= 0.50) {
    status = 'Needs Review';
  } else {
    status = 'Failed';
  }

  if (failure_reason && status === 'Success') {
    status = 'Needs Review';
  }

  return {
    document_type,
    measure: finalMeasure,
    measurement_date: finalDate,
    patient_age,
    status,
    confidence_score: score,
    failure_reason,
    raw_ai_response: extractedData
  };
}

module.exports = { processClinicalRules };
