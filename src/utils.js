/** Pad a number with 0 on the left */
export function zeroPad(number, digits) {
  let num = number + '';
  while (num.length < digits) num = '0' + num;
  return num;
}

export function formataDinheiro(n) {
  return n.toFixed(2)
    .replace('.', ',')
    .replace(/(\d)(?=(\d{3})+,)/g, '$1.');
}

/**
 * http://stackoverflow.com/a/14428340/4640499
 * @param integer number: number to be processed
 * @param integer n: length of decimal
 * @param integer x: length of whole part
 * @param mixed   s: sections delimiter
 * @param mixed   c: decimal delimiter
 */
export function format(number, n, x, s, c) {
  const re = [
    '\\d(?=(\\d{',
    (x || 3),
    '})+',
    (n > 0 ? '\\D' : '$'),
    ')'
  ].join('');
  let num = number.toFixed(Math.max(0, ~~n));

  return (c ? num.replace('.', c) : num)
    .replace(new RegExp(re, 'g'), '$&' + (s || ','));
}

/**
 * http://locutus.io/php/strings/number_format/
 */
export function numberFormat(number, decimals, decPoint, thousandsSep) {
  number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
  const n = !isFinite(+number) ? 0 : +number;
  const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
  const sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep;
  const dec = (typeof decPoint === 'undefined') ? '.' : decPoint;
  let s = '';

  const toFixedFix = (nn, preci) => {
    const k = Math.pow(10, preci);
    return '' + (Math.round(nn * k) / k).toFixed(preci);
  };

  // @todo: for IE parseFloat(0.55).toFixed(0) = 0;
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
  }
  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1).join('0');
  }

  return s.join(dec);
}

/**
 * Overwrites obj1's values with obj2's and adds
 * obj2's if non existent in obj1
 * @returns obj3 a new object based on obj1 and obj2
 */
export function merge(obj1, obj2) {
  let obj3 = {};
  for (let attr1 in obj1) { obj3[attr1] = obj1[attr1]; }
  for (let attr2 in obj2) { obj3[attr2] = obj2[attr2]; }
  return obj3;
}

export function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    if (typeof Error !== 'undefined') {
      throw new Error(message);
    }
    throw message; // Fallback
  }
}
