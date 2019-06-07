import _ from 'lodash'

const earthHeight = 6356752.3;
const earthWidth = 6378137

const extractLongitudes = lines => _.map(lines, v => {
  const longitude = v[1];
  return longitude / 90 * earthHeight;
});
const extractLatitudes = lines => _.map(lines, v => {
  const latitude  = v[0];
  return latitude / 180 * earthWidth;
});

const recoordinate = (values, baseValue, scale) => {
  const minValue = _.min(values);
  return _.map(values, v => {
    return (v - minValue) * scale + baseValue
  });
}

export const longitude2Altitude = (lines, baseValue, scale) => recoordinate(extractLongitudes(lines), baseValue, scale)
export const latitude2Altitude = (lines, baseValue, scale) => recoordinate(extractLatitudes(lines), baseValue, scale)
