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
import {
  ativoRecebeInfraestruturaAutomatica,
  gerarInfraestruturasRede,
} from '../src/features/ativos/rede/gerarInfraestruturaRede.ts';
import {
  ativoRecebeResponsavelFicticio,
  gerarResponsaveisFicticios,
} from '../src/features/ativos/responsaveis/gerarResponsaveisFicticios.ts';

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

test('rede automática inclui computadores, Arquimedes e impressoras, mas não switches', () => {
  assert.equal(ativoRecebeInfraestruturaAutomatica('Computador'), true);
  assert.equal(ativoRecebeInfraestruturaAutomatica('Arquimedes'), true);
  assert.equal(ativoRecebeInfraestruturaAutomatica('Impressora'), true);
  assert.equal(ativoRecebeInfraestruturaAutomatica('Switch 24 portas'), false);
});

test('rede automática gera IPs e MACs únicos', () => {
  const atualizacoes = gerarInfraestruturasRede([
    { id: '1', patrimonio: '100', tipo: 'Computador', setor: 'TI', status: 'Ativo' },
    { id: '2', patrimonio: '101', tipo: 'Arquimedes', setor: 'TI', status: 'Ativo' },
    { id: '3', patrimonio: '102', tipo: 'Impressora', setor: 'TI', status: 'Ativo' },
    { id: '4', patrimonio: '103', tipo: 'Switch', setor: 'TI', status: 'Ativo' },
  ]);

  assert.equal(atualizacoes.length, 3);
  assert.deepEqual(atualizacoes.map(({ infraestrutura }) => infraestrutura.ip), [
    '10.20.0.10',
    '10.20.0.11',
    '10.20.0.12',
  ]);
  assert.equal(new Set(atualizacoes.map(({ infraestrutura }) => infraestrutura.mac)).size, 3);
  assert.equal(atualizacoes.every(({ infraestrutura }) => infraestrutura.vlan === '0'), true);
});

test('responsáveis fictícios entram em computadores e Arquimedes, mas não em impressoras', () => {
  assert.equal(ativoRecebeResponsavelFicticio('Computador'), true);
  assert.equal(ativoRecebeResponsavelFicticio('Arquimedes'), true);
  assert.equal(ativoRecebeResponsavelFicticio('Impressora'), false);
  assert.equal(ativoRecebeResponsavelFicticio('Switch 24 portas'), false);
});

test('responsáveis fictícios preservam cadastros já preenchidos e geram nomes únicos', () => {
  const atualizacoes = gerarResponsaveisFicticios([
    { id: '1', patrimonio: '100', tipo: 'Computador', setor: 'TI', status: 'Disponível' },
    { id: '2', patrimonio: '101', tipo: 'Arquimedes', setor: 'TI', status: 'Disponível' },
    { id: '3', patrimonio: '102', tipo: 'Computador', setor: 'TI', status: 'Ativo', responsavel: 'Pessoa Existente' },
    { id: '4', patrimonio: '103', tipo: 'Impressora', setor: 'TI', status: 'Ativo' },
  ]);

  assert.equal(atualizacoes.length, 2);
  assert.equal(new Set(atualizacoes.map(({ responsavel }) => responsavel.responsavel)).size, 2);
  assert.deepEqual(atualizacoes.map(({ responsavel }) => responsavel.matricula), ['DEMO-0001', 'DEMO-0002']);
});
