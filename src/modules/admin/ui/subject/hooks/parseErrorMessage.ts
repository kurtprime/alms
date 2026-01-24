// Helper function to parse error messages
export function parseErrorMessage(error: string | null): string {
  if (!error) return "";

  // Check if it looks like JSON (starts with [ or {)
  const trimmed = error.trim();
  const isJson = trimmed.startsWith("[") || trimmed.startsWith("{");

  if (!isJson) {
    return error; // Return as-is if not JSON
  }

  try {
    const parsed = JSON.parse(trimmed);

    // Handle array of errors (Zod validation style)
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return error;

      // Extract messages from each error object
      const messages = parsed.map((err) => {
        if (err.message) return err.message;
        if (err.path && Array.isArray(err.path)) {
          return `${err.path.join(".")}: ${err.message || "Invalid"}`;
        }
        return JSON.stringify(err);
      });

      // Join multiple errors with semicolons
      return messages.join("; ");
    }

    // Handle single error object
    if (parsed.message) return parsed.message;
    if (parsed.error)
      return typeof parsed.error === "string"
        ? parsed.error
        : JSON.stringify(parsed.error);

    // Fallback for unknown JSON structure
    return JSON.stringify(parsed);
  } catch (e) {
    // If JSON parsing fails, return original string
    return error;
  }
}
