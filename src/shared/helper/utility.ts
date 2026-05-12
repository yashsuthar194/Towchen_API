export class Utility {
  static generateOtp(length: number): number {
    let otp = '';
    const characters = '0123456789';
    for (let i = 0; i < length; i++) {
      otp += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return parseInt(otp, 10);
  }

  /**
   * Merges address components into a single full address string.
   * @param location - The location object containing address components
   * @returns Formatted full address string
   */
  static formatAddress(location: any): string {
    if (!location) return '';
    const { address, street, area, landmark, city, state, pincode, country } = location;
    return [address, street, area, landmark, city, state, pincode, country]
      .filter((part) => part && part.trim() !== '')
      .join(', ');
  }
  /**
   * Calculates the straight-line (Haversine) distance between two lat/lng points in kilometres.
   * Useful for quick pre-filtering before calling mapping APIs.
   */
  static calculateHaversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
