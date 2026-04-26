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
}
