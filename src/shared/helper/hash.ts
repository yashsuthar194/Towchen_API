import * as argon2 from 'argon2';

export class Hash {
  /**
   * Hashes the given text using the Argon2 algorithm.
   * @param text - The text to be hashed.
   * @returns The hashed text.
   */
  static async hashAsync(text: string): Promise<string> {
    const hashedText = await argon2.hash(text);
    return hashedText;
  }

  /**
   * Verifies if the given text matches the provided hash using the Argon2 algorithm.
   * @param text - The text to be verified.
   * @param hash - The hash to compare against.
   * @returns A boolean indicating whether the text matches the hash.
   */
  static async verifyAsync(text: string, hash: string): Promise<boolean> {
    const isMatch = await argon2.verify(hash, text);
    return isMatch;
  }
}
