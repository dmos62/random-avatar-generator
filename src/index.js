function decToHexColor(colorNumber) {
  return `${colorNumber.toString(16).padStart(6, '0')}`;
}

function getBinaryList(number, size) {
  return number.toString(2)
    .padStart(size, '0')
    .split('');
}

function parseAvatarData(data, separator) {
  const ret = {
    xAxis: 0,
    yAxis: 0,
    colorMap: []
  };

  if (!data) {
    return ret;
  }

  data.split(separator).forEach((element, index) => {
    let intVal = parseInt(element, 36);

    switch (index) {
      case 0:
        ret.xAxis = intVal;
        break;
      case 1:
        ret.yAxis = intVal;
        break;

      default:
        ret.colorMap.push(decToHexColor(intVal));
        break;
    }
  });

  return ret;
}

// https://stackoverflow.com/a/47593316/1714997
function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277,
      h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
  return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

// https://stackoverflow.com/a/47593316/1714997
function sfc32(a, b, c, d) {
  return function() {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

function getRandomNumberGenerator(seed) {
  const seedString = String(seed); // Making sure that the seed is a string.
  const seed = cyrb128(seedString);
  return sfc32(seed[0], seed[1], seed[2], seed[3]);
}

export function generateRandomAvatarData(complexity = 16, avatarDataSeparator = '-', seed = Math.random()) {
  const getRandomNumber = getRandomNumberGenerator(seed);
  const xAxis = Math.floor(getRandomNumber() * Math.pow(2, complexity - 1));
  const yAxis = Math.floor(getRandomNumber() * (Math.pow(2, complexity) - 1)) + 1;

  const rows = getBinaryList(yAxis, complexity);
  let ret = `${xAxis.toString(36)}${avatarDataSeparator}${yAxis.toString(36)}`;
  let color;

  rows.forEach(() => {
    color = Math.floor(getRandomNumber() * 16777215);
    ret += `${avatarDataSeparator}${color.toString(36)}`;
  });

  return ret;
}

export function getAvatarFromData(avatarData, renderMethod = 'square', size = 256, avatarDataSeparator = '-') {
  const { xAxis, yAxis, colorMap } = parseAvatarData(avatarData, avatarDataSeparator);
  const complexity = colorMap.length;
  const resolution = Math.floor(size / complexity);

  if (complexity < 1 || xAxis >= Math.pow(2, complexity)) {
    throw Error('Incorrect avatar data');
  }

  let renderProcess = (resolution, indexX, indexY) => `M${indexX * resolution},${indexY * resolution} h${resolution} v${resolution} h${0 - resolution}Z`;

  if (renderMethod === 'circle') {
    renderProcess = (resolution, indexX, indexY) => {
      const radius = resolution / 2;
      return `M${indexX * resolution},${(indexY * resolution) + radius} a${radius} ${radius} 0 1,1 ${resolution},0 a${radius} ${radius} 0 1,1 -${resolution},0`;
    }
  } else if (typeof renderMethod === 'function') {
    renderProcess = renderMethod;
  }

  const rows = getBinaryList(yAxis, complexity);
  const cols = getBinaryList(xAxis, complexity);
  let ret = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${size} ${size}">`;

  rows.forEach((rowItem, indexY) => {
    let draw = [];
    cols.forEach((colItem, indexX) => {
      if (parseInt(rowItem, 10) ^ parseInt(colItem, 10)) {
        draw.push(renderProcess(resolution, indexX, indexY));
      }
    });
    ret += `<path fill="#${colorMap[indexY]}" d="${draw.join(' ')}"/>`;
  });

  return `${ret}</svg>`;
}

export function getRandomAvatar(complexity = 16, renderMethod = 'square', size = 256) {
  let avatarData = generateRandomAvatarData(complexity);
  return getAvatarFromData(avatarData, renderMethod, size);
}
