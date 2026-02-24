export class Utility {
  static generateOtp(length: number): number {
    let otp = '';
    const characters = '0123456789';
    for (let i = 0; i < length; i++) {
      otp += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return parseInt(otp, 10);
  }
}
