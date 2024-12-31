
export type SVG_LENGTH_TYPE = 
  SVGLength["SVG_LENGTHTYPE_UNKNOWN"] |
  SVGLength["SVG_LENGTHTYPE_NUMBER"] |
  SVGLength["SVG_LENGTHTYPE_PERCENTAGE"] |
  SVGLength["SVG_LENGTHTYPE_EMS"] |
  SVGLength["SVG_LENGTHTYPE_EXS"] |
  SVGLength["SVG_LENGTHTYPE_PX"] |
  SVGLength["SVG_LENGTHTYPE_CM"] |
  SVGLength["SVG_LENGTHTYPE_MM"] |
  SVGLength["SVG_LENGTHTYPE_IN"] |
  SVGLength["SVG_LENGTHTYPE_PT"] |
  SVGLength["SVG_LENGTHTYPE_PC"] 
;

// 
export function convertSVGUserUnitTo(elm: SVGGraphicsElement, n: number, unit: SVG_LENGTH_TYPE = SVGLength.SVG_LENGTHTYPE_MM) {
  const nn = elm.ownerSVGElement?.createSVGLength();
  if (nn) {
    nn.value = n;
    nn.convertToSpecifiedUnits(unit);
  }
  return nn?.valueInSpecifiedUnits;
}

export function getBBoxBy(elm: SVGGraphicsElement, unit: SVG_LENGTH_TYPE = SVGLength.SVG_LENGTHTYPE_MM) {
  const bbox = elm.getBBox();
  return {
    x:      convertSVGUserUnitTo(elm, bbox.x,      unit) || 0,
    y:      convertSVGUserUnitTo(elm, bbox.y,      unit) || 0,
    width:  convertSVGUserUnitTo(elm, bbox.width,  unit) || 0,
    height: convertSVGUserUnitTo(elm, bbox.height, unit) || 0,
  }
}
