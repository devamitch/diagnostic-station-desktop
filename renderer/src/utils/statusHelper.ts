export const getStatusColor = (strainText: string, styles: any) => {
  switch (strainText) {
    case "Low":
      return styles.normal;
    case "Moderate":
      return styles.blinkrate;
    case "High":
      return styles.eyestrain;
    default:
      return styles.normal;
  }
};

export const getStatusText = (
  strainText: string,
  statusLabels: {
    normal: string;
    blinkRate: string;
    eyeStrain: string;
  }
) => {
  switch (strainText) {
    case "Low":
      return statusLabels.normal;
    case "Moderate":
      return statusLabels.blinkRate;
    case "High":
      return statusLabels.eyeStrain;
    default:
      return statusLabels.normal;
  }
};


export const getStatusLevel = (score: number, thresholds: number[], labels: string[]) => {
  for (let i = 0; i < thresholds.length; i++) {
    if (score < thresholds[i]) {
      return { text: labels[i], status: labels[i].toLowerCase().replace(' ', '-') };
    }
  }
  return {
    text: labels[labels.length - 1],
    status: labels[labels.length - 1].toLowerCase().replace(' ', '-'),
  };
};

export const getBlinkRateStatusHelper = (value: number, labels: string[]) => {
  if (value < 10) return labels[2];
  if (value < 15) return labels[1];
  return labels[0];
};

export const getStatusClassHelper = (value: number, type: 'blinkRate' | 'perClose', styles: any) => {
  if (type === 'blinkRate') {
    if (value <= 10) return styles.poor;
    if (value <= 15) return styles.good;
    if (value <= 20) return styles.moderate;
    return styles.high;
  }
  if (value <= 20) return styles.good;
  if (value <= 40) return styles.moderate;
  return styles.poor;
};
