export const tryParseJson = (input: string): any | null => {
  if (!input) {
    return null;
  }

  if(input) {
    try {
      return JSON.parse(input);
    } catch(e) {
      return null;
    }
  }
};
