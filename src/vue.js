import Vue from 'vue';
import Boleto from './components/Boleto.vue';
import { cedente, pagador, boleto, codBanco } from './defaults';

const vm = new Vue({
  data() {
    return { cedente, pagador, boleto, bancoAtivo: codBanco.bb };
  },
  render(h) {
    return h(Boleto, {
      props: {
        cedente: this.cedente,
        pagador: this.pagador,
        boleto: this.boleto
      }
    });
  }
});

export default vm;
