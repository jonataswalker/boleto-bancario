<template>
<div id="container">
  <div class="boleto">
    <table class="header" cellspacing="0" cellpadding="0">
      <tr>
        <td class="logoBanco"><img :src="logoBanco" /></td>
        <td class="codBanco"><div>{{ B.codBanco }}</div></td>
        <td class="linhaDigitavel">{{ linhaDigitavel }}</td>
      </tr>
    </table>

    <table class="line" cellspacing="0" cellpadding="0">
      <tr class="titulos">
        <td class="cedente">Cedente</td>
        <td class="agCedente">Agência / Código do Cedente</td>
        <td class="especie">Espécie</td>
        <td class="qtd">Quantidade</td>
        <td class="nossoNumero">Nosso número</td>
      </tr>
      <tr class="campos">
        <td class="cedente">{{ C.nome }}</td>
        <td class="agCedente">{{ C.agenciaCodigo }}</td>
        <td class="especie">{{ B.especie }}</td>
        <td class="qtd">{{ B.qtde }}</td>
        <td class="nossoNumero">{{ B.nossoNumero }}</td>
      </tr>
    </table>

    <table class="line" cellspacing="0" cellpadding="0">
      <tr class="titulos">
        <td class="numDoc">Número do documento</td>
        <td class="contrato">Contrato</td>
        <td class="cpfCnpj">CPF/CEI/CNPJ</td>
        <td class="vencimento">Vencimento</td>
        <td class="valorDoc">Valor documento</td>
      </tr>
      <tr class="campos">
        <td class="numDoc">{{ B.numDoc }}</td>
        <td class="contrato">{{ C.contrato }}</td>
        <td class="cpfCnpj">{{ C.cpfCnpj }}</td>
        <td class="vencimento">{{ B.dataVencimento }}</td>
        <td class="valorDoc">{{ B.valor }}</td>
      </tr>
    </table>

    <table class="line" cellspacing="0" cellpadding="0">
      <tr class="titulos">
        <td class="desconto">(-) Desconto / Abatimento</td>
        <td class="outrasDeducoes">(-) Outras deduções</td>
        <td class="moraMulta">(+) Mora / Multa</td>
        <td class="outrosAcrescimos">(+) Outros acréscimos</td>
        <td class="valorCobrado">(=) Valor cobrado</td>
      </tr>
      <tr class="campos">
        <td class="desconto">&nbsp;</td>
        <td class="outrasDeducoes">&nbsp;</td>
        <td class="moraMulta">&nbsp;</td>
        <td class="outrosAcrescimos">&nbsp;</td>
        <td class="valorCobrado">&nbsp;</td>
      </tr>
    </table>


    <table class="line" cellspacing="0" cellpadding="0">
      <tr class="titulos"><td class="sacado">Sacado</td></tr>
      <tr class="campos">
        <td class="sacado">{{ nomeCedente }}</td>
      </tr>
    </table>

    <div class="footer"><p>Autenticação mecânica</p></div>
    <div class="cut"><p>Corte na linha pontilhada</p></div>

    <table class="header" cellspacing="0" cellpadding="0">
      <tr>
        <td class="logoBanco"><img :src="logoBanco" /></td>
        <td class="codBanco"><div>{{ B.codBanco }}</div></td>
        <td class="linhaDigitavel">{{ linhaDigitavel }}</td>
      </tr>
    </table>

    <table class="line" cellspacing="0" cellpadding="0">
      <tr class="titulos">
        <td class="localPgto">Local de pagamento</td>
        <td class="vencimento2">Vencimento</td>
      </tr>
      <tr class="campos">
        <td class="localPgto">QUALQUER BANCO ATÉ O VENCIMENTO</td>
        <td class="vencimento2">{{ B.dataVencimento }}</td>
      </tr>
    </table>

    <table class="line" cellspacing="0" cellpadding="0">
      <tr class="titulos">
        <td class="cedente2">Cedente</td>
        <td class="agCedente2">Agência/Código cedente</td>
      </tr>
      <tr class="campos">
        <td class="cedente2">{{ C.nome }}</td>
        <td class="agCedente2">{{ C.agenciaCodigo }}</td>
      </tr>
    </table>

    <table class="line" cellspacing="0" cellpadding="0">
      <tr class="titulos">
        <td class="dataDoc">Data do documento</td>
        <td class="numDoc2">No. documento</td>
        <td class="especieDoc">Espécie doc.</td>
        <td class="aceite">Aceite</td>
        <td class="dataProcess">Data process.</td>
        <td class="nossoNumero2">Nosso número</td>
      </tr>
      <tr class="campos">
        <td class="dataDoc">{{ B.dataEmissao }}</td>
        <td class="numDoc2">{{ B.numDoc }}</td>
        <td class="especieDoc">{{ B.especie }}</td>
        <td class="aceite">{{ B.aceite }}</td>
        <td class="dataProcess">{{ B.dataEmissao }}</td>
        <td class="nossoNumero2">{{ B.nossoNumero }}</td>
      </tr>
    </table>

    <table class="line" cellspacing="0" cellpadding="0">
      <tr class="titulos">
        <td class="reservado">Uso do banco</td>
        <td class="carteira">Carteira</td>
        <td class="especie2">Espécie</td>
        <td class="qtd2">Quantidade</td>
        <td class="xvalor">Valor</td>
        <td class="valorDoc">(=) Valor documento</td>
      </tr>
      <tr class="campos">
        <td class="reservado">&nbsp;</td>
        <td class="carteira">
          {{ B.carteira + B.variacaoCarteira ? B.variacaoCarteira : ' ' }}
        </td>
        <td class="especie2">{{ B.especie }}</td>
        <td class="qtd2">{{ B.qtde }}</td>
        <td class="xvalor"></td>
        <td class="valorDoc">{{ B.valor }}</td>
      </tr>
    </table>

    <table class="line" cellspacing="0" cellpadding="0">
      <tr>
        <td class="lastLine" rowspan="6">
          <table class="line" cellspacing="0" cellpadding="0">
            <tr class="titulos">
                <td class="instrucoes">
                  Instruções (Texto de responsabilidade do cedente)
                </td>
            </tr>
            <tr class="campos">
              <td class="instrucoes" rowspan="5">
                <p>{{ B.instrucao1 }}</p>
                <p>{{ B.instrucao2 }}</p>
                <p>{{ B.instrucao3 }}</p>
                <p>{{ B.instrucao4 }}</p>
                <p>{{ B.instrucao5 }}</p>
                <p>{{ B.instrucao6 }}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td>
          <table class="line" cellspacing="0" cellpadding="0">
            <tr class="titulos">
              <td class="desconto2">(-) Desconto / Abatimento</td>
            </tr>
            <tr class="campos"><td class="desconto2">&nbsp;</td></tr>
          </table>
          </td>
        </tr>

      <tr>
        <td>
          <table class="line" cellspacing="0" cellpadding="0">
            <tr class="titulos">
              <td class="outras_deducoes2">(-) Outras deduções</td>
            </tr>
            <tr class="campos"><td class="outrasDeducoes2">&nbsp;</td></tr>
          </table>
        </td>
      </tr>

      <tr>
        <td>
          <table class="line" cellspacing="0" cellpadding="0">
            <tr class="titulos">
              <td class="moraMulta2">(+) Mora / Multa</td>
            </tr>
            <tr class="campos"><td class="moraMulta2">&nbsp;</td></tr>
          </table>
        </td>
      </tr>

      <tr>
        <td>
          <table class="line" cellspacing="0" cellpadding="0">
            <tr class="titulos">
              <td class="outrosAcrescimos2">(+) Outros Acréscimos</td>
            </tr>
            <tr class="campos"><td class="outrosAcrescimos2">&nbsp;</td></tr>
          </table>
        </td>
      </tr>

      <tr>
        <td class="lastLine">
          <table class="line" cellspacing="0" cellpadding="0">
            <tr class="titulos">
              <td class="valorCobrado2">(=) Valor cobrado</td>
            </tr>
            <tr class="campos"><td class="valorCobrado2">&nbsp;</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <table class="line" cellspacing="0" cellpadding="0">
      <tr class="titulos"><td class="sacado2">Sacado</td></tr>
      <tr class="campos">
        <td class="sacado2">
          <p>{{ nomeCedente }}</p>
          <p>{{ P.endereco }}</p>
        </td>
      </tr>
    </table>

    <table class="line" cellspacing="0" cellpadding="0">
      <tr class="titulos">
        <td class="sacadorAvalista" colspan="2">Sacador/Avalista</td>
      </tr>
      <tr class="campos">
        <td class="sacadorAvalista">&nbsp;</td>
        <td class="codBaixa">Cód. baixa</td>
      </tr>
    </table>
    <div class="footer2">Autenticação mecânica - Ficha de Compensação</div>
    <div class="barcode" v-html="codigoBarras"></div>
    <div class="cut"><p>Corte na linha pontilhada</p></div>
  </div>
</div>
</template>

<script>
import BB from '../bb';
import A from '../abstract';

export default {
  props: {
    cedente: Object,
    pagador: Object,
    boleto: Object
  },
  data() {
    return {
      C: this.cedente,
      P: this.pagador,
      B: this.boleto,
      nomeCedente: '',
      codigoBarras: '',
      linhaDigitavel: ''
    };
  },
  mounted() {
    this.nomeCedente = this.P.nome + ' - CPF/CNPJ: ' + this.P.cpfCnpj;
    this.B.nossoNumero = BB.geraNossoNumero();
    this.C.agenciaCodigo = A.getAgenciaCodigoCedente();
    this.codigoBarras = A.getImagemCodigoDeBarras();
    this.linhaDigitavel = A.getLinhaDigitavel();
  }
};
</script>
