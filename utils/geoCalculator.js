import _ from 'lodash'

const earthHeightRadius = 6356752.3;
const earthWidthRadius = 6378137

const earthHeightPerimeter = 2 * Math.PI * earthHeightRadius
const earthWidthPerimeter = 2 * Math.PI * earthWidthRadius

const toFixedNumber = (number, fixedPosition) => parseFloat(number.toFixed(fixedPosition));

const extractLongitudes = lines => _.map(lines, v => {
  const longitude = parseFloat(v[1]);
  return earthHeightPerimeter * longitude / 360;
});
const extractLatitudes = lines => _.map(lines, v => {
  const latitude  = parseFloat(v[0]);
  const longitude = parseFloat(v[1]);
  return earthWidthPerimeter * latitude / 360 * Math.cos(longitude * (Math.PI / 180));
});

const recoordinate = (values, baseValue, scale, rotateDegree) => {
  const minValue = _.min(values);
  return _.map(values, v => {
    const floatNumber = (v - minValue) * Math.sin(rotateDegree * (Math.PI / 180)) * scale + baseValue
    return toFixedNumber(floatNumber, 12);
  });
}

export const longitude2Altitude = (lines, baseValue, scale, rotateDegree) => recoordinate(extractLongitudes(lines), baseValue, scale, rotateDegree)
export const latitude2Altitude = (lines, baseValue, scale, rotateDegree) => recoordinate(extractLatitudes(lines), baseValue, scale, rotateDegree)
export const generateOtherAxisValues = (lines, scale, rotateDegree, shouldReplaceLatitude) => {
  const axisValues = _.map(lines, v => shouldReplaceLatitude ? parseFloat(v[0]) : parseFloat(v[1]))
  const baseAxisValue = _.min(axisValues);
  
  return _.map(axisValues, v => {
    const floatNumber = (v - baseAxisValue) * Math.cos(rotateDegree * (Math.PI / 180)) * scale + baseAxisValue;
    return toFixedNumber(floatNumber, 12);
  })
}

export const generateOriginAxisValue = (lines, scale, shouldReplaceLatitude) => {
  const originAxisValues = _.map(lines, v => shouldReplaceLatitude ? parseFloat(v[1]) : parseFloat(v[0]))
  const baseAxisValue = _.min(originAxisValues);
  return _.map(originAxisValues, v => {
    const floatNumber = (v - baseAxisValue) * scale + baseAxisValue;
    return toFixedNumber(floatNumber, 12);
  })
}
