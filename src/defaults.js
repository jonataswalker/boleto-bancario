export const cedente = {
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

export const pagador = {
  nome: '',
  cpf: '',
  endereco: ''
};

export const boleto = {
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

export const codBanco = {
  bb: 1
};

export const moeda = 9;

export const contraApresentacao = false;
