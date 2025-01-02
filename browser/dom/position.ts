/** Position information within the Scrapbox editor
 * Represents the cursor or selection position using line and character coordinates
 */
export interface Position {
  /** Line number (1-based index) */ line: number;
  /** Character position within the line (0-based index)
   * Represents the number of characters before the cursor position
   */ char: number;
}
