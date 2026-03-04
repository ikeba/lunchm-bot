// Builds a URL path with query params from an object, omitting undefined values.
export function buildPath(
  path: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [k, String(v)])

  if (entries.length === 0) {
    return path
  }

  return `${path}?${new URLSearchParams(entries).toString()}`
}
