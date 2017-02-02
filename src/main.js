import VM from './vue';
import { merge } from './utils';

export default class BoletoBB {
  constructor(obj) {
    if (obj && typeof obj == 'object') {
      obj.hasOwnProperty('cedente') && this.setCedente(obj.cedente);
      obj.hasOwnProperty('pagador') && this.setPagador(obj.pagador);
      obj.hasOwnProperty('boleto') && this.geraBoleto(obj.boleto);
    }
  }

  setCedente(obj) {
    VM.$data.cedente = merge(VM.$data.cedente, obj);
  }

  setPagador(obj) {
    VM.$data.pagador = merge(VM.$data.pagador, obj);
  }

  geraBoleto(obj) {
    VM.$data.boleto = merge(VM.$data.boleto, obj);
  }

  render(el) {
    VM.$mount(el);
  }
}
