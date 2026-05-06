export function extractJsonObject(rawText: string): string {
  const trimmed = rawText.trim();

  // 1. Try ```json ... ``` (with language tag)
  const jsonFencedMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonFencedMatch) {
    const inner = jsonFencedMatch[1].trim();
    if (inner.startsWith("{") && inner.endsWith("}")) {
      return inner;
    }
  }

  // 2. Try ``` ... ``` (without language tag, but looks like JSON)
  const genericFencedMatch = trimmed.match(/```\s*(\{[\s\S]*?\})\s*```/);
  if (genericFencedMatch) {
    return genericFencedMatch[1].trim();
  }

  // 3. Try to find a JSON object span: from first { to last }
  const openBrace = trimmed.indexOf("{");
  const closeBrace = trimmed.lastIndexOf("}");

  if (openBrace !== -1 && closeBrace > openBrace) {
    return trimmed.slice(openBrace, closeBrace + 1).trim();
  }

  // 4. Return as-is, will throw on JSON.parse
  return trimmed;
}
