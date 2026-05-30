export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

function ageGroupFromIso(dateStr: string | Date): number {
  const birth = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const months = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.5)
  if (months < 12) return 0
  if (months < 84) return 1
  return 2
}

export function scorePost(
  post: { dogBreed: string; dogBreedSize: number; dogBirthDate: string; location: { lat: number; lng: number } },
  myDog: { breed: string; breedSize: number; birthDate: Date } | null,
  myLocation: { lat: number; lng: number } | null
): number {
  let score = 0
  if (myLocation && post.location?.lat) {
    const km = haversineKm(myLocation, post.location)
    score += Math.max(0, 10 - km)
  }
  if (myDog) {
    if (post.dogBreed === myDog.breed) score += 5
    if (post.dogBreedSize === myDog.breedSize) score += 2
    if (ageGroupFromIso(post.dogBirthDate) === ageGroupFromIso(myDog.birthDate)) score += 2
  }
  return score
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}秒前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}時間前`
  return `${Math.floor(hours / 24)}日前`
}
