import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ativoEhArquimedes,
  ativoEhComputador,
  ativoEhSwitch,
  calcularStatusAtivo,
} from '../src/features/ativos/detalhe/utils.ts';
import {
  montarEmailInstitucional,
  usuarioSeguePadraoInstitucional,
} from '../src/features/usuarios/utils.ts';

const componentesOk = {
  memoriaRam: 'OK',
  placaMae: 'OK',
  armazenamento: 'OK',
  fonte: 'OK',
};

test('Arquimedes é tratado como computador all-in-one', () => {
  assert.equal(ativoEhComputador('Arquimedes'), true);
  assert.equal(ativoEhArquimedes('Arquimedes'), true);
});

test('switch continua separado de computadores', () => {
  assert.equal(ativoEhSwitch('Switch 24 portas'), true);
  assert.equal(ativoEhComputador('Switch 24 portas'), false);
});

test('tela danificada envia Arquimedes para manutenção', () => {
  assert.equal(calcularStatusAtivo(componentesOk, '', true), 'Manutenção');
});

test('computador com responsável e sem defeito fica ativo', () => {
  assert.equal(calcularStatusAtivo(componentesOk, 'Maria Silva'), 'Ativo');
});

test('usuário institucional recebe o domínio padrão', () => {
  assert.equal(montarEmailInstitucional('maria.silva'), 'maria.silva@ibametro.ba.gov.br');
});

test('usuário precisa seguir o formato nome.sobrenome', () => {
  assert.equal(usuarioSeguePadraoInstitucional('maria.silva'), true);
  assert.equal(usuarioSeguePadraoInstitucional('maria'), false);
  assert.equal(usuarioSeguePadraoInstitucional('maria.silva@gmail.com'), false);
  assert.equal(usuarioSeguePadraoInstitucional(undefined), false);
});
