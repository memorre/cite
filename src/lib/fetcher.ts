export const fetcher = async (url: string) => {
  const res = await fetch(url);
  // Throw on errors so SWR keeps the last good data instead of replacing it with an error body.
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};
