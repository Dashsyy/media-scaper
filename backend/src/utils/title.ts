const sanitizeSeparators = (value: string) => {
  const normalized = value.replace(/\s*[|:\u00b7\uFF5C]+\s*/g, " | ");
  return normalized.replace(/\s+\|\s+/g, " | ");
};

const stripLeadingMetrics = (value: string) => {
  const metricsPattern =
    /^\s*\d+(?:\.\d+)?[KMB]?\s*views?\s*(?:[|:\u00b7\uFF5C])?\s*\d*(?:\.\d+)?[KMB]?\s*reactions?\s*(?:[|:\u00b7\uFF5C])?\s*/i;
  const viewsPattern =
    /^\s*\d+(?:\.\d+)?[KMB]?\s*views?\s*(?:[|:\u00b7\uFF5C])?\s*/i;
  const reactionsPattern =
    /^\s*\d+(?:\.\d+)?[KMB]?\s*reactions?\s*(?:[|:\u00b7\uFF5C])?\s*/i;

  return value.replace(metricsPattern, "").replace(viewsPattern, "").replace(reactionsPattern, "");
};

export const sanitizeTitle = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) {
    return input;
  }

  let output = trimmed;
  output = output.replace(/https?:\/\/\S+/gi, "");
  output = stripLeadingMetrics(output);
  output = sanitizeSeparators(output);
  output = output.replace(/^\s*\|\s*|\s*\|\s*$/g, "");
  output = output.replace(/\s{2,}/g, " ");
  output = output.trim();

  return output.length > 0 ? output : trimmed;
};
