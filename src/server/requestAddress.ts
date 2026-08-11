/**
 * The leftmost `x-forwarded-for` entry is whatever the client sent and is
 * trivially spoofable. The rightmost entry is appended by our own edge/proxy
 * hop and can't be forged by the client, so it's the only entry worth
 * trusting. `x-real-ip` is set directly by that same hop and is preferred
 * when present since it can't contain a forged chain at all.
 */
export function requestAddress(request: Request) {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor.split(",").map((hop) => hop.trim());
    const closestHop = hops[hops.length - 1];
    if (closestHop) return closestHop;
  }

  return "unknown";
}
