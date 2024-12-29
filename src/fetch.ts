// ネットワークリソースの要求とキャッシュ

const cache = new Map<string, any>();

export function fetchData(url: string, receiver: (res: Response) => any) {
  if (!cache.has(url)) {
    cache.set(url, (async () => 
      await fetch(url).then((res: Response) => receiver(res))
    )());
  }
  return cache.get(url);
}
