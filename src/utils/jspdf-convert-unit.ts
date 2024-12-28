// https://gist.github.com/AnalyzePlatypus/55d806caa739ba6c2b27ede752fa3c9c

export function convertPointsToUnit(points: number, unit: string): number {
  // Unit table from https://github.com/MrRio/jsPDF/blob/ddbfc0f0250ca908f8061a72fa057116b7613e78/jspdf.js#L791
  let multiplier: number;
  switch(unit) {
    case 'pt':  multiplier = 1;          break;
    case 'mm':  multiplier = 72 / 25.4;  break;
    case 'cm':  multiplier = 72 / 2.54;  break;
    case 'in':  multiplier = 72;         break;
    case 'px':  multiplier = 96 / 72;    break;
    case 'pc':  multiplier = 12;         break;
    case 'em':  multiplier = 12;         break;
    case 'ex':  multiplier = 6;          break;
    default:
      throw ('Invalid unit: ' + unit);
  }
  return points * multiplier;
}

export function convertPointsFromUnit(points: number, unit: string): number {
  let divisor: number;
  switch(unit) {
    case 'pt':  divisor = 1;          break;
    case 'mm':  divisor = 72 / 25.4;  break;
    case 'cm':  divisor = 72 / 2.54;  break;
    case 'in':  divisor = 72;         break;
    case 'px':  divisor = 96 / 72;    break;
    case 'pc':  divisor = 12;         break;
    case 'em':  divisor = 12;         break;
    case 'ex':  divisor = 6;          break;
    default:
      throw ('Invalid unit: ' + unit);
  }
  return points / divisor;
}
