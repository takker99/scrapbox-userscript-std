export const pinNumber = (): number =>
  Number.MAX_SAFE_INTEGER - Math.floor(Date.now() / 1000);
