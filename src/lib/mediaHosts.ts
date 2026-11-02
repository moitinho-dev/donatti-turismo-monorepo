import { appBaseUrl } from "./meta"

const hostOf = (url: string | undefined) => {
  if (!url) return null
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).host
  } catch {
    return null
  }
}

/** Hosts onde o próprio app guarda as artes: o app, o bucket S3 (ou a URL pública dele) e o Supabase */
export function ownMediaHosts(): string[] {
  const bucket = process.env.AWS_S3_BUCKET
  const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || "us-east-1"
  const hosts = [
    hostOf(appBaseUrl()),
    hostOf(process.env.AWS_S3_PUBLIC_URL),
    bucket ? `${bucket}.s3.${region}.amazonaws.com` : null,
    hostOf(process.env.NEXT_PUBLIC_SUPABASE_URL),
  ]
  return [...new Set(hosts.filter((h): h is string => !!h))]
}

/** URL https servida por um host do próprio app */
export function isOwnMediaUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === "https:" && ownMediaHosts().includes(u.host)
  } catch {
    return false
  }
}
