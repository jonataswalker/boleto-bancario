/*!
 * boleto-bancario - v0.0.1
 * Solução para geração de boletos bancários
 * https://github.com/jonataswalker/boleto-bancario
 * Built: Sat Jan 28 2017 11:50:48 GMT-0200 (BRST)
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('vue'), require('moment')) :
	typeof define === 'function' && define.amd ? define(['vue', 'moment'], factory) :
	(global.BoletoBancario = factory(global.Vue,global.moment));
}(this, (function (Vue,moment) { 'use strict';

Vue = 'default' in Vue ? Vue['default'] : Vue;
moment = 'default' in moment ? moment['default'] : moment;

var U = {
  /** Pad a number with 0 on the left */
  zeroPad: function zeroPad(number, digits) {
    var num = number + '';
    while (num.length < digits) { num = '0' + num; }
    return num;
  },
  formataDinheiro: function formataDinheiro(n) {
    return n.toFixed(2)
      .replace('.', ',')
      .replace(/(\d)(?=(\d{3})+,)/g, '$1.');
  },
  /**
   * http://stackoverflow.com/a/14428340/4640499
   * @param integer number: number to be processed
   * @param integer n: length of decimal
   * @param integer x: length of whole part
   * @param mixed   s: sections delimiter
   * @param mixed   c: decimal delimiter
   */
  format: function format(number, n, x, s, c) {
    var re = [
      '\\d(?=(\\d{',
      (x || 3),
      '})+',
      (n > 0 ? '\\D' : '$'),
      ')'
    ].join('');
    var num = number.toFixed(Math.max(0, ~~n));

    return (c ? num.replace('.', c) : num)
      .replace(new RegExp(re, 'g'), '$&' + (s || ','));
  },
  /**
   * http://locutus.io/php/strings/number_format/
   */
  numberFormat: function numberFormat(number, decimals, decPoint, thousandsSep) {
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number;
    var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
    var sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep;
    var dec = (typeof decPoint === 'undefined') ? '.' : decPoint;
    var s = '';

    var toFixedFix = function (nn, preci) {
      var k = Math.pow(10, preci);
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
  },

  /**
   * Overwrites obj1's values with obj2's and adds
   * obj2's if non existent in obj1
   * @returns obj3 a new object based on obj1 and obj2
   */
  merge: function merge(obj1, obj2) {
    var obj3 = {};
    for (var attr1 in obj1) { obj3[attr1] = obj1[attr1]; }
    for (var attr2 in obj2) { obj3[attr2] = obj2[attr2]; }
    return obj3;
  },
  assert: function assert(condition, message) {
    if ( message === void 0 ) message = 'Assertion failed';

    if (!condition) {
      if (typeof Error !== 'undefined') {
        throw new Error(message);
      }
      throw message; // Fallback
    }
  }
};

var cedente = {
  agencia: '',
  agenciaDv: '',
  agenciaCodigo: '', // interno
  conta: '',
  contaDv: '',
  codigo: '',
  codigoDv: '',
  contrato: '',
  nome: '',
  cnpj: ''
};

var pagador = {
  nome: '',
  cpf: '',
  endereco: ''
};

var boleto = {
  // variadas/internas
  codBanco: '001-9', // TODO
  especie: 'R$',
  aceite: 'N',
  qtde: 1,
  carteira: 18,
  variacaoCarteira: '',
  nossoNumero: 12345,
  numDoc: 12345,
  sequencial: 1234567, // Para gerar o nosso número
  convenio: 1234, // 4, 6 ou 7 dígitos
  // datas
  dataEmissao: '',
  dataVencimento: '',
  // valores
  valor: '',
  // taxas
  taxaJuros: '',
  taxaMulta: '',
  // instrucoes
  instrucao1: '',
  instrucao2: '',
  instrucao3: '',
  instrucao4: '',
  instrucao5: '',
  instrucao6: ''
};

var codBanco = {
  bb: 1
};

var moeda = 9;

var contraApresentacao = false;

var A = {
  /**
   * Retorna o campo Agência/Cedente do boleto
   * @return string
   */
  getAgenciaCodigoCedente: function getAgenciaCodigoCedente() {
    var c = vm.$data.cedente;
    var ag = c.agenciaDv ? [c.agencia, c.agenciaDv].join('-') : c.agencia;
    var conta = c.contaDv ? [c.conta, c.contaDv].join('-') : c.conta;
    return [ag, conta].join(' / ');
  },

  /**
   * Retorna a string contendo as imagens do código de barras,
   * segundo o padrão Febraban
   * @return string
   */
  getImagemCodigoDeBarras: function getImagemCodigoDeBarras() {
    var this$1 = this;

    var codigo = this.getNumeroFebraban();
    var barcodes = [
      '00110', '10001', '01001', '11000', '00101',
      '10100', '01100', '00011', '10010', '01010'
    ];

    for (var f1 = 9; f1 >= 0; f1--) {
      for (var f2 = 9; f2 >= 0; f2--) {
        var f = (f1 * 10) + f2;
        var txt = '';

        for (var i = 1; i < 6; i++) {
          txt += barcodes[f1].substr(i - 1, 1) + barcodes[f2].substr(i - 1, 1);
        }

        barcodes[f] = txt;
      }
    }

    // Guarda inicial
    var retorno = [
      '<div class="barcode">',
      '<div class="black thin"></div>',
      '<div class="white thin"></div>',
      '<div class="black thin"></div>',
      '<div class="white thin"></div>'
    ].join('');

    if (codigo.length % 2 !== 0) { codigo = '0' + codigo; }

    // Draw dos dados
    while (codigo.length > 0) {
      var i$1 = Math.round(+this$1.caracteresEsquerda(codigo, 2));
      var f$1 = barcodes[i$1];

      codigo = this$1.caracteresDireita(codigo, codigo.length - 2);

      for (var ii = 1; ii < 11; ii += 2) {
        var f1$1 = f$1.substr(ii - 1, 1) === '0' ? 'thin' : 'large';
        var f2$1 = f$1.substr(ii, 1) === '0' ? 'thin' : 'large';
        retorno += '<div class="black ' + f1$1 + '"></div>';
        retorno += '<div class="white ' + f2$1 + '"></div>';
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
  getLinhaDigitavel: function getLinhaDigitavel() {
    var chave = BB.getCampoLivre();

    // Break down febraban positions 20 to 44 into 3 blocks of 5, 10 and 10
    // characters each.
    var blocks = {
      '20-24': chave.substr(0, 5),
      '25-34': chave.substr(5, 10),
      '35-44': chave.substr(15, 10)
    };

    // Concatenates bankCode + currencyCode + first block of 5 characters and
    // calculates its check digit for part1.
    var checkDigit = this.modulo10([
      BB.getCodigoBanco(), moeda, blocks['20-24']
    ].join(''));

    // Shift in a dot on block 20-24 (5 characters) at its 2nd position.
    blocks['20-24'] =
      [blocks['20-24'][0], '.', blocks['20-24'].substr(1)].join('');

    // Concatenates bankCode + currencyCode + first block of 5 characters +
    // checkDigit.
    var part1 =
      [BB.getCodigoBanco(), moeda, blocks['20-24'], checkDigit].join('');

    // Calculates part2 check digit from 2nd block of 10 characters.
    checkDigit = this.modulo10(blocks['25-34']);

    var part2 = blocks['25-34'] + checkDigit;
    // Shift in a dot at its 6th position.
    part2 = [part2.substr(0, 5), '.', part2.substr(5)].join('');

    // Calculates part3 check digit from 3rd block of 10 characters.
    checkDigit = this.modulo10(blocks['35-44']);

    // As part2, we do the same process again for part3.
    var part3 = blocks['35-44'] + checkDigit;
    part3 = [part3.substr(0, 5), '.', part3.substr(5)].join('');

    // Check digit for the human readable number.
    var cd = this.getDigitoVerificador();

    // Put part4 together.
    var part4  = this.getFatorVencimento() + this.getValorZeroFill();

    // Now put everything together.
    return [part1, part2, part3, cd, part4].join(' ');
  },

  /**
   * Retorna o número Febraban
   * @return string
   */
  getNumeroFebraban: function getNumeroFebraban() {
    return [
      U.zeroPad(vm.$data.bancoAtivo, 3),
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
  getDigitoVerificador: function getDigitoVerificador() {
    var num = [
      U.zeroPad(vm.$data.bancoAtivo, 4),
      moeda,
      this.getFatorVencimento(),
      this.getValorZeroFill(),
      BB.getCampoLivre()
    ].join('');

    var modulo = this.modulo11(num);
    return [0, 1, 10].includes(modulo.resto) ? 1 : 11 - modulo.resto;
  },

  /**
   * Retorna o Nosso Número calculado.
   *
   * @param bool $incluirFormatacao Incluir formatação ou não
   * (pontuação, espaços e barras)
   * @return string
   */
  getNossoNumero: function getNossoNumero(incluirFormatacao) {
    if ( incluirFormatacao === void 0 ) incluirFormatacao = true;

    var numero = vm.$data.boleto.nossoNumero;
    return incluirFormatacao ? numero : numero.replace(/[^\d]/g, '');
  },

  /**
   * Retorna o número de dias de 07/10/1997 até a data de vencimento do boleto
   * Ou 0000 caso não tenha data de vencimento (contra-apresentação)
   *
   * @return string
   */
  getFatorVencimento: function getFatorVencimento() {
    if (!contraApresentacao) {
      var vencimento = moment(vm.$data.boleto.dataVencimento, 'DD/MM/YYYY');
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
  getValorZeroFill: function getValorZeroFill() {
    var valor = vm.$data.boleto.valor;
    return U.zeroPad(U.numberFormat(valor, 2, '', ''), 10);
  },

  /**
   * Helper para obter os caracteres à esquerda
   *
   * @param string $string
   * @param int $num Quantidade de caracteres para se obter
   * @return string
   */
  caracteresEsquerda: function caracteresEsquerda(string, num) {
    return string.substr(0, num);
  },

  /**
   * Helper para se obter os caracteres à direita
   *
   * @param string $string
   * @param int $num Quantidade de caracteres para se obter
   * @return string
   */
  caracteresDireita: function caracteresDireita(string, num) {
    return string.substr(string.length - num, num);
  },

  /**
   * Calcula e retorna o dígito verificador usando o algoritmo Modulo 10
   *
   * @param string $num
   * @see Documentação em http://www.febraban.org.br/Acervo1.asp?id_texto=195&id_pagina=173&palavra=
   * @return int
   */
  modulo10: function modulo10(num) {
    var numtotal10 = 0;
    var fator = 2;
    var numeros = [], parcial = [];

    //  Separacao dos numeros.
    for (var i = num.length; i > 0; i--) {
      //  Pega cada numero isoladamente.
      numeros[i] = num.substr(i - 1, 1);
      //  Efetua multiplicacao do numero pelo (falor 10).
      var temp = numeros[i] * fator;
      var temp0 = temp.toString().split('').reduce(function (a, b) { return (+a) + (+b); }, 0);

      parcial[i] = temp0;
      //  Monta sequencia para soma dos digitos no (modulo 10).
      numtotal10 += parcial[i];
      fator = fator === 2 ? 1 : 2;
    }

    var remainder  = numtotal10 % 10;
    var digito = 10 - remainder;

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
  modulo11: function modulo11(num, base) {
    if ( base === void 0 ) base = 9;

    var fator = 2;
    var soma = 0;
    var numeros = [], parcial = [];
    var result = {};
    var i;

    // Separacao dos numeros.
    for (i = num.length; i > 0; i--) {
      //  Pega cada numero isoladamente.
      numeros[i] = num.substr(i - 1, 1);
      //  Efetua multiplicacao do numero pelo falor.
      parcial[i] = numeros[i] * fator;
      //  Soma dos digitos.
      soma += parcial[i];
      //  Restaura fator de multiplicacao para 2.
      if (fator === base) { fator = 1; }
      fator++;
    }
    result.digito = (soma * 10) % 11;
    result.resto = soma % 11;
    result.digito = result.digito === 10 ? 0 : result.digito;

    return result;
  }
};

var BB = {
  getCodigoBanco: function getCodigoBanco() {
    return '001';
  },
  geraNossoNumero: function geraNossoNumero() {
    var boleto = vm.$data.boleto;
    var convenio = boleto.convenio;
    var sequencial = boleto.sequencial;
    var carteira = boleto.carteira;
    var numero = null;

    switch (convenio.toString().length) {
      // Convênio de 4 dígitos, são 11 dígitos no nosso número
      case 4:
        numero = U.zeroPad(convenio, 4) + U.zeroPad(sequencial, 7);
        break;
      // Convênio de 6 dígitos, são 11 dígitos no nosso número
      case 6:
        // Exceto no caso de ter a carteira 21, onde são 17 dígitos
        numero = carteira === 21
          ? U.zeroPad(sequencial, 17)
          : U.zeroPad(convenio, 6) + U.zeroPad(sequencial, 5);
        break;
      // Convênio de 7 dígitos, são 17 dígitos no nosso número
      case 7:
        numero = U.zeroPad(convenio, 7) + U.zeroPad(sequencial, 10);
        break;
      // Não é com 4, 6 ou 7 dígitos? Não existe.
      default:
        throw new Error('O código do convênio precisa ter 4, 6 ou 7 dígitos!');
    }

    // Quando o nosso número tiver menos de 17 dígitos, colocar o dígito
    if (numero.length < 17) {
      var modulo = A.modulo11(numero);
      numero += '-' + modulo.digito;
    }
    return numero;
  },
  /**
   * Método para gerar o código da posição de 20 a 44
   * @return string
   */
  getCampoLivre: function getCampoLivre() {
    var boleto = vm.$data.boleto;
    var len = boleto.convenio.toString().length;
    var nossoNumero = boleto.nossoNumero;
    // Nosso número sem o DV - repare que ele só vem com DV
    // quando o mesmo é menor que 17 caracteres
    // Então removemos o dígito (e o traço) apenas quando seu tamanho
    // for menor que 17 caracteres
    nossoNumero = A.getNossoNumero().length < 17 ?
        nossoNumero.substr(0, nossoNumero.length - 2) : nossoNumero;

    // Sequencial do cliente com 17 dígitos
    // Apenas para convênio com 6 dígitos, modalidade sem
    // registro - carteira 16 e 18 (definida para 21)
    if (boleto.sequencial.toString().length > 10) {
      if (len === 6 && boleto.carteira === 21) {
        // Convênio (6) + Nosso número (17) + Carteira (2)
        return [U.zeroPad(boleto.convenio, 6), nossoNumero, 21].join('');
      } else {
        // eslint-disable-next-line max-len
        throw new Error('Só é possível criar um boleto com mais de 10 dígitos no nosso número quando a carteira é 21 e o convênio possuir 6 dígitos.');
      }
    }

    switch (len) {
      case 4:
      case 6:
        // Nosso número (11) + Agencia (4) + Conta (8) + Carteira (2)
        return [
          nossoNumero,
          U.zeroPad(vm.$data.cedente.agencia, 4),
          U.zeroPad(vm.$data.cedente.conta, 8),
          U.zeroPad(boleto.carteira, 2)
        ].join('');
      case 7:
        // Zeros (6) + Nosso número (17) + Carteira (2)
        return ['000000', nossoNumero, U.zeroPad(boleto.carteira, 2)].join('');
    }

    throw new Error('O código do convênio precisa ter 4, 6 ou 7 dígitos!');
  }
};

var Boleto = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{attrs:{"id":"container"}},[_c('div',{staticClass:"boleto"},[_c('table',{staticClass:"header",attrs:{"cellspacing":"0","cellpadding":"0"}},[_c('tr',[_c('td',{staticClass:"logoBanco"},[_c('img',{attrs:{"src":_vm.logoBanco}})]),_c('td',{staticClass:"codBanco"},[_c('div',[_vm._v(_vm._s(_vm.B.codBanco))])]),_c('td',{staticClass:"linhaDigitavel"},[_vm._v(_vm._s(_vm.linhaDigitavel))])])]),_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_vm._m(0),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"cedente"},[_vm._v(_vm._s(_vm.C.nome))]),_c('td',{staticClass:"agCedente"},[_vm._v(_vm._s(_vm.C.agenciaCodigo))]),_c('td',{staticClass:"especie"},[_vm._v(_vm._s(_vm.B.especie))]),_c('td',{staticClass:"qtd"},[_vm._v(_vm._s(_vm.B.qtde))]),_c('td',{staticClass:"nossoNumero"},[_vm._v(_vm._s(_vm.B.nossoNumero))])])]),_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_vm._m(1),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"numDoc"},[_vm._v(_vm._s(_vm.B.numDoc))]),_c('td',{staticClass:"contrato"},[_vm._v(_vm._s(_vm.C.contrato))]),_c('td',{staticClass:"cpfCnpj"},[_vm._v(_vm._s(_vm.C.cpfCnpj))]),_c('td',{staticClass:"vencimento"},[_vm._v(_vm._s(_vm.B.dataVencimento))]),_c('td',{staticClass:"valorDoc"},[_vm._v(_vm._s(_vm.B.valor))])])]),_vm._m(2),_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_vm._m(3),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"sacado"},[_vm._v(_vm._s(_vm.nomeCedente))])])]),_vm._m(4),_vm._m(5),_c('table',{staticClass:"header",attrs:{"cellspacing":"0","cellpadding":"0"}},[_c('tr',[_c('td',{staticClass:"logoBanco"},[_c('img',{attrs:{"src":_vm.logoBanco}})]),_c('td',{staticClass:"codBanco"},[_c('div',[_vm._v(_vm._s(_vm.B.codBanco))])]),_c('td',{staticClass:"linhaDigitavel"},[_vm._v(_vm._s(_vm.linhaDigitavel))])])]),_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_vm._m(6),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"localPgto"},[_vm._v("QUALQUER BANCO ATÉ O VENCIMENTO")]),_c('td',{staticClass:"vencimento2"},[_vm._v(_vm._s(_vm.B.dataVencimento))])])]),_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_vm._m(7),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"cedente2"},[_vm._v(_vm._s(_vm.C.nome))]),_c('td',{staticClass:"agCedente2"},[_vm._v(_vm._s(_vm.C.agenciaCodigo))])])]),_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_vm._m(8),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"dataDoc"},[_vm._v(_vm._s(_vm.B.dataEmissao))]),_c('td',{staticClass:"numDoc2"},[_vm._v(_vm._s(_vm.B.numDoc))]),_c('td',{staticClass:"especieDoc"},[_vm._v(_vm._s(_vm.B.especie))]),_c('td',{staticClass:"aceite"},[_vm._v(_vm._s(_vm.B.aceite))]),_c('td',{staticClass:"dataProcess"},[_vm._v(_vm._s(_vm.B.dataEmissao))]),_c('td',{staticClass:"nossoNumero2"},[_vm._v(_vm._s(_vm.B.nossoNumero))])])]),_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_vm._m(9),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"reservado"},[_vm._v(" ")]),_c('td',{staticClass:"carteira"},[_vm._v(_vm._s(_vm.B.carteira + _vm.B.variacaoCarteira ? _vm.B.variacaoCarteira : ' '))]),_c('td',{staticClass:"especie2"},[_vm._v(_vm._s(_vm.B.especie))]),_c('td',{staticClass:"qtd2"},[_vm._v(_vm._s(_vm.B.qtde))]),_c('td',{staticClass:"xvalor"}),_c('td',{staticClass:"valorDoc"},[_vm._v(_vm._s(_vm.B.valor))])])]),_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_c('tr',[_c('td',{staticClass:"lastLine",attrs:{"rowspan":"6"}},[_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_vm._m(10),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"instrucoes",attrs:{"rowspan":"5"}},[_c('p',[_vm._v(_vm._s(_vm.B.instrucao1))]),_c('p',[_vm._v(_vm._s(_vm.B.instrucao2))]),_c('p',[_vm._v(_vm._s(_vm.B.instrucao3))]),_c('p',[_vm._v(_vm._s(_vm.B.instrucao4))]),_c('p',[_vm._v(_vm._s(_vm.B.instrucao5))]),_c('p',[_vm._v(_vm._s(_vm.B.instrucao6))])])])])])]),_vm._m(11),_vm._m(12),_vm._m(13),_vm._m(14),_vm._m(15)]),_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_vm._m(16),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"sacado2"},[_c('p',[_vm._v(_vm._s(_vm.nomeCedente))]),_c('p',[_vm._v(_vm._s(_vm.P.endereco))])])])]),_vm._m(17),_c('div',{staticClass:"footer2"},[_vm._v("Autenticação mecânica - Ficha de Compensação")]),_c('div',{staticClass:"barcode",domProps:{"innerHTML":_vm._s(_vm.codigoBarras)}}),_vm._m(18)])])},staticRenderFns: [function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"cedente"},[_vm._v("Cedente")]),_c('td',{staticClass:"agCedente"},[_vm._v("Agência / Código do Cedente")]),_c('td',{staticClass:"especie"},[_vm._v("Espécie")]),_c('td',{staticClass:"qtd"},[_vm._v("Quantidade")]),_c('td',{staticClass:"nossoNumero"},[_vm._v("Nosso número")])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"numDoc"},[_vm._v("Número do documento")]),_c('td',{staticClass:"contrato"},[_vm._v("Contrato")]),_c('td',{staticClass:"cpfCnpj"},[_vm._v("CPF/CEI/CNPJ")]),_c('td',{staticClass:"vencimento"},[_vm._v("Vencimento")]),_c('td',{staticClass:"valorDoc"},[_vm._v("Valor documento")])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"desconto"},[_vm._v("(-) Desconto / Abatimento")]),_c('td',{staticClass:"outrasDeducoes"},[_vm._v("(-) Outras deduções")]),_c('td',{staticClass:"moraMulta"},[_vm._v("(+) Mora / Multa")]),_c('td',{staticClass:"outrosAcrescimos"},[_vm._v("(+) Outros acréscimos")]),_c('td',{staticClass:"valorCobrado"},[_vm._v("(=) Valor cobrado")])]),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"desconto"},[_vm._v(" ")]),_c('td',{staticClass:"outrasDeducoes"},[_vm._v(" ")]),_c('td',{staticClass:"moraMulta"},[_vm._v(" ")]),_c('td',{staticClass:"outrosAcrescimos"},[_vm._v(" ")]),_c('td',{staticClass:"valorCobrado"},[_vm._v(" ")])])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"sacado"},[_vm._v("Sacado")])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"footer"},[_c('p',[_vm._v("Autenticação mecânica")])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"cut"},[_c('p',[_vm._v("Corte na linha pontilhada")])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"localPgto"},[_vm._v("Local de pagamento")]),_c('td',{staticClass:"vencimento2"},[_vm._v("Vencimento")])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"cedente2"},[_vm._v("Cedente")]),_c('td',{staticClass:"agCedente2"},[_vm._v("Agência/Código cedente")])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"dataDoc"},[_vm._v("Data do documento")]),_c('td',{staticClass:"numDoc2"},[_vm._v("No. documento")]),_c('td',{staticClass:"especieDoc"},[_vm._v("Espécie doc.")]),_c('td',{staticClass:"aceite"},[_vm._v("Aceite")]),_c('td',{staticClass:"dataProcess"},[_vm._v("Data process.")]),_c('td',{staticClass:"nossoNumero2"},[_vm._v("Nosso número")])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"reservado"},[_vm._v("Uso do banco")]),_c('td',{staticClass:"carteira"},[_vm._v("Carteira")]),_c('td',{staticClass:"especie2"},[_vm._v("Espécie")]),_c('td',{staticClass:"qtd2"},[_vm._v("Quantidade")]),_c('td',{staticClass:"xvalor"},[_vm._v("Valor")]),_c('td',{staticClass:"valorDoc"},[_vm._v("(=) Valor documento")])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"instrucoes"},[_vm._v("Instruções (Texto de responsabilidade do cedente)")])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',[_c('td',[_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"desconto2"},[_vm._v("(-) Desconto / Abatimento")])]),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"desconto2"},[_vm._v(" ")])])])])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',[_c('td',[_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"outras_deducoes2"},[_vm._v("(-) Outras deduções")])]),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"outrasDeducoes2"},[_vm._v(" ")])])])])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',[_c('td',[_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"moraMulta2"},[_vm._v("(+) Mora / Multa")])]),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"moraMulta2"},[_vm._v(" ")])])])])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',[_c('td',[_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"outrosAcrescimos2"},[_vm._v("(+) Outros Acréscimos")])]),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"outrosAcrescimos2"},[_vm._v(" ")])])])])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',[_c('td',{staticClass:"lastLine"},[_c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"valorCobrado2"},[_vm._v("(=) Valor cobrado")])]),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"valorCobrado2"},[_vm._v(" ")])])])])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"sacado2"},[_vm._v("Sacado")])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('table',{staticClass:"line",attrs:{"cellspacing":"0","cellpadding":"0"}},[_c('tr',{staticClass:"titulos"},[_c('td',{staticClass:"sacadorAvalista",attrs:{"colspan":"2"}},[_vm._v("Sacador/Avalista")])]),_c('tr',{staticClass:"campos"},[_c('td',{staticClass:"sacadorAvalista"},[_vm._v(" ")]),_c('td',{staticClass:"codBaixa"},[_vm._v("Cód. baixa")])])])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"cut"},[_c('p',[_vm._v("Corte na linha pontilhada")])])}],
  props: {
    cedente: Object,
    pagador: Object,
    boleto: Object
  },
  data: function data() {
    return {
      C: this.cedente,
      P: this.pagador,
      B: this.boleto,
      nomeCedente: '',
      codigoBarras: '',
      linhaDigitavel: ''
    };
  },
  mounted: function mounted() {
    this.nomeCedente = this.P.nome + ' - CPF/CNPJ: ' + this.P.cpfCnpj;
    this.B.nossoNumero = BB.geraNossoNumero();
    this.C.agenciaCodigo = A.getAgenciaCodigoCedente();
    this.codigoBarras = A.getImagemCodigoDeBarras();
    this.linhaDigitavel = A.getLinhaDigitavel();
  }
};

var vm = new Vue({
  data: function data() {
    return { cedente: cedente, pagador: pagador, boleto: boleto, bancoAtivo: codBanco.bb };
  },
  render: function render(h) {
    return h(Boleto, {
      props: {
        cedente: this.cedente,
        pagador: this.pagador,
        boleto: this.boleto
      }
    });
  }
});

var BoletoBB = function BoletoBB(obj) {
  if (obj && typeof obj == 'object') {
    obj.hasOwnProperty('cedente') && this.setCedente(obj.cedente);
    obj.hasOwnProperty('pagador') && this.setPagador(obj.pagador);
    obj.hasOwnProperty('boleto') && this.geraBoleto(obj.boleto);
  }
};

BoletoBB.prototype.setCedente = function setCedente (obj) {
  vm.$data.cedente = U.merge(vm.$data.cedente, obj);
};

BoletoBB.prototype.setPagador = function setPagador (obj) {
  vm.$data.pagador = U.merge(vm.$data.pagador, obj);
};

BoletoBB.prototype.geraBoleto = function geraBoleto (obj) {
  vm.$data.boleto = U.merge(vm.$data.boleto, obj);
};

BoletoBB.prototype.render = function render (el) {
  vm.$mount(el);
};

return BoletoBB;

})));
