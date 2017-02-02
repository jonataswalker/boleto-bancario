import moment from 'moment';
import VM from './vue';
import { zeroPad, numberFormat } from './utils';
import BB from './bb';
import { moeda, contraApresentacao } from './defaults';

export default {
  /**
   * Retorna o campo Agência/Cedente do boleto
   * @return string
   */
  getAgenciaCodigoCedente() {
    const c = VM.$data.cedente;
    const ag = c.agenciaDv ? [c.agencia, c.agenciaDv].join('-') : c.agencia;
    const conta = c.contaDv ? [c.conta, c.contaDv].join('-') : c.conta;
    return [ag, conta].join(' / ');
  },

  /**
   * Retorna a string contendo as imagens do código de barras,
   * segundo o padrão Febraban
   * @return string
   */
  getImagemCodigoDeBarras() {
    let codigo = this.getNumeroFebraban();
    const barcodes = [
      '00110', '10001', '01001', '11000', '00101',
      '10100', '01100', '00011', '10010', '01010'
    ];

    for (let f1 = 9; f1 >= 0; f1--) {
      for (let f2 = 9; f2 >= 0; f2--) {
        const f = (f1 * 10) + f2;
        let txt = '';

        for (let i = 1; i < 6; i++) {
          txt += barcodes[f1].substr(i - 1, 1) + barcodes[f2].substr(i - 1, 1);
        }

        barcodes[f] = txt;
      }
    }

    // Guarda inicial
    let retorno = [
      '<div class="barcode">',
      '<div class="black thin"></div>',
      '<div class="white thin"></div>',
      '<div class="black thin"></div>',
      '<div class="white thin"></div>'
    ].join('');

    if (codigo.length % 2 !== 0) codigo = '0' + codigo;

    // Draw dos dados
    while (codigo.length > 0) {
      const i = Math.round(+this.caracteresEsquerda(codigo, 2));
      const f = barcodes[i];

      codigo = this.caracteresDireita(codigo, codigo.length - 2);

      for (let ii = 1; ii < 11; ii += 2) {
        const f1 = f.substr(ii - 1, 1) === '0' ? 'thin' : 'large';
        const f2 = f.substr(ii, 1) === '0' ? 'thin' : 'large';
        retorno += '<div class="black ' + f1 + '"></div>';
        retorno += '<div class="white ' + f2 + '"></div>';
      }
    }

    // Final
    return [
      retorno,
      '<div class="black large"></div>',
      '<div class="white thin"></div>',
      '<div class="black thin"></div>',
      '</div>'
    ].join('');
  },

  /**
   * Retorna a linha digitável do boleto
   * @return string
   */
  getLinhaDigitavel() {
    const chave = BB.getCampoLivre();

    // Break down febraban positions 20 to 44 into 3 blocks of 5, 10 and 10
    // characters each.
    const blocks = {
      '20-24': chave.substr(0, 5),
      '25-34': chave.substr(5, 10),
      '35-44': chave.substr(15, 10)
    };

    // Concatenates bankCode + currencyCode + first block of 5 characters and
    // calculates its check digit for part1.
    let checkDigit = this.modulo10([
      BB.getCodigoBanco(), moeda, blocks['20-24']
    ].join(''));

    // Shift in a dot on block 20-24 (5 characters) at its 2nd position.
    blocks['20-24'] =
      [blocks['20-24'][0], '.', blocks['20-24'].substr(1)].join('');

    // Concatenates bankCode + currencyCode + first block of 5 characters +
    // checkDigit.
    const part1 =
      [BB.getCodigoBanco(), moeda, blocks['20-24'], checkDigit].join('');

    // Calculates part2 check digit from 2nd block of 10 characters.
    checkDigit = this.modulo10(blocks['25-34']);

    let part2 = blocks['25-34'] + checkDigit;
    // Shift in a dot at its 6th position.
    part2 = [part2.substr(0, 5), '.', part2.substr(5)].join('');

    // Calculates part3 check digit from 3rd block of 10 characters.
    checkDigit = this.modulo10(blocks['35-44']);

    // As part2, we do the same process again for part3.
    let part3 = blocks['35-44'] + checkDigit;
    part3 = [part3.substr(0, 5), '.', part3.substr(5)].join('');

    // Check digit for the human readable number.
    const cd = this.getDigitoVerificador();

    // Put part4 together.
    const part4  = this.getFatorVencimento() + this.getValorZeroFill();

    // Now put everything together.
    return [part1, part2, part3, cd, part4].join(' ');
  },

  /**
   * Retorna o número Febraban
   * @return string
   */
  getNumeroFebraban() {
    return [
      zeroPad(VM.$data.bancoAtivo, 3),
      moeda,
      this.getDigitoVerificador(),
      this.getFatorVencimento(),
      this.getValorZeroFill(),
      BB.getCampoLivre()
    ].join('');
  },

  /**
   * Retorna o dígito verificador do código Febraban
   * @return int
   */
  getDigitoVerificador() {
    const num = [
      zeroPad(VM.$data.bancoAtivo, 4),
      moeda,
      this.getFatorVencimento(),
      this.getValorZeroFill(),
      BB.getCampoLivre()
    ].join('');

    const modulo = this.modulo11(num);
    return [0, 1, 10].includes(modulo.resto) ? 1 : 11 - modulo.resto;
  },

  /**
   * Retorna o Nosso Número calculado.
   *
   * @param bool $incluirFormatacao Incluir formatação ou não
   * (pontuação, espaços e barras)
   * @return string
   */
  getNossoNumero(incluirFormatacao = true) {
    let numero = VM.$data.boleto.nossoNumero;
    return incluirFormatacao ? numero : numero.replace(/[^\d]/g, '');
  },

  /**
   * Retorna o número de dias de 07/10/1997 até a data de vencimento do boleto
   * Ou 0000 caso não tenha data de vencimento (contra-apresentação)
   *
   * @return string
   */
  getFatorVencimento() {
    if (!contraApresentacao) {
      const vencimento = moment(VM.$data.boleto.dataVencimento, 'DD/MM/YYYY');
      return vencimento.diff(moment('1997-10-07', 'YYYY-MM-DD'), 'days');
    } else {
      return '0000';
    }
  },

  /**
   * Retorna o valor do boleto com 10 dígitos e remoção dos pontos/vírgulas
   *
   * @return string
   */
  getValorZeroFill() {
    const valor = VM.$data.boleto.valor;
    return zeroPad(numberFormat(valor, 2, '', ''), 10);
  },

  /**
   * Helper para obter os caracteres à esquerda
   *
   * @param string $string
   * @param int $num Quantidade de caracteres para se obter
   * @return string
   */
  caracteresEsquerda(string, num) {
    return string.substr(0, num);
  },

  /**
   * Helper para se obter os caracteres à direita
   *
   * @param string $string
   * @param int $num Quantidade de caracteres para se obter
   * @return string
   */
  caracteresDireita(string, num) {
    return string.substr(string.length - num, num);
  },

  /**
   * Calcula e retorna o dígito verificador usando o algoritmo Modulo 10
   *
   * @param string $num
   * @see Documentação em http://www.febraban.org.br/Acervo1.asp?id_texto=195&id_pagina=173&palavra=
   * @return int
   */
  modulo10(num) {
    let numtotal10 = 0;
    let fator = 2;
    let numeros = [], parcial = [];

    //  Separacao dos numeros.
    for (let i = num.length; i > 0; i--) {
      //  Pega cada numero isoladamente.
      numeros[i] = num.substr(i - 1, 1);
      //  Efetua multiplicacao do numero pelo (falor 10).
      let temp = numeros[i] * fator;
      const temp0 = temp.toString().split('').reduce((a, b) => (+a) + (+b), 0);

      parcial[i] = temp0;
      //  Monta sequencia para soma dos digitos no (modulo 10).
      numtotal10 += parcial[i];
      fator = fator === 2 ? 1 : 2;
    }

    const remainder  = numtotal10 % 10;
    let digito = 10 - remainder;

    return digito === 10 ? 0 : digito;
  },

  /**
   * Calcula e retorna o dígito verificador usando o algoritmo Modulo 11
   *
   * @param string num
   * @param int base
   * @see Documentação em
   * http://www.febraban.org.br/Acervo1.asp?id_texto=195&id_pagina=173&palavra=
   * @return array Retorna um array com as chaves 'digito' e 'resto'
   */
  modulo11(num, base = 9) {
    let fator = 2;
    let soma = 0;
    let numeros = [], parcial = [];
    let result = {};
    let i;

    // Separacao dos numeros.
    for (i = num.length; i > 0; i--) {
      //  Pega cada numero isoladamente.
      numeros[i] = num.substr(i - 1, 1);
      //  Efetua multiplicacao do numero pelo falor.
      parcial[i] = numeros[i] * fator;
      //  Soma dos digitos.
      soma += parcial[i];
      //  Restaura fator de multiplicacao para 2.
      if (fator === base) fator = 1;
      fator++;
    }
    result.digito = (soma * 10) % 11;
    result.resto = soma % 11;
    result.digito = result.digito === 10 ? 0 : result.digito;

    return result;
  }
};
