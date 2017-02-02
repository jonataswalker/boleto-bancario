import VM from './vue';
import { zeroPad } from './utils';
import A from './abstract';

export default {
  getCodigoBanco() {
    return '001';
  },
  geraNossoNumero() {
    const boleto = VM.$data.boleto;
    const convenio = boleto.convenio;
    const sequencial = boleto.sequencial;
    const carteira = boleto.carteira;
    let numero = null;

    switch (convenio.toString().length) {
      // Convênio de 4 dígitos, são 11 dígitos no nosso número
      case 4:
        numero = zeroPad(convenio, 4) + zeroPad(sequencial, 7);
        break;
      // Convênio de 6 dígitos, são 11 dígitos no nosso número
      case 6:
        // Exceto no caso de ter a carteira 21, onde são 17 dígitos
        numero = carteira === 21
          ? zeroPad(sequencial, 17)
          : zeroPad(convenio, 6) + zeroPad(sequencial, 5);
        break;
      // Convênio de 7 dígitos, são 17 dígitos no nosso número
      case 7:
        numero = zeroPad(convenio, 7) + zeroPad(sequencial, 10);
        break;
      // Não é com 4, 6 ou 7 dígitos? Não existe.
      default:
        throw new Error('O código do convênio precisa ter 4, 6 ou 7 dígitos!');
    }

    // Quando o nosso número tiver menos de 17 dígitos, colocar o dígito
    if (numero.length < 17) {
      const modulo = A.modulo11(numero);
      numero += '-' + modulo.digito;
    }
    return numero;
  },
  /**
   * Método para gerar o código da posição de 20 a 44
   * @return string
   */
  getCampoLivre() {
    const boleto = VM.$data.boleto;
    const len = boleto.convenio.toString().length;
    let nossoNumero = boleto.nossoNumero;
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
        return [zeroPad(boleto.convenio, 6), nossoNumero, 21].join('');
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
          zeroPad(VM.$data.cedente.agencia, 4),
          zeroPad(VM.$data.cedente.conta, 8),
          zeroPad(boleto.carteira, 2)
        ].join('');
      case 7:
        // Zeros (6) + Nosso número (17) + Carteira (2)
        return ['000000', nossoNumero, zeroPad(boleto.carteira, 2)].join('');
    }

    throw new Error('O código do convênio precisa ter 4, 6 ou 7 dígitos!');
  }
};
