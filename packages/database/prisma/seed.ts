import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Valores de enum como strings (SQLite não suporta enums nativos)
const Priority = { NAO_CLASSIFICADA: 'NAO_CLASSIFICADA', BAIXA: 'BAIXA', MEDIA: 'MEDIA', ALTA: 'ALTA', CRITICA: 'CRITICA' };
const Role = { COLABORADOR: 'COLABORADOR', AGENTE: 'AGENTE', ADMIN: 'ADMIN' };
const TicketStatus = {
  NOVO: 'NOVO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  AGUARDANDO_USUARIO: 'AGUARDANDO_USUARIO',
  RESOLVIDO: 'RESOLVIDO',
  FECHADO: 'FECHADO',
};

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // ─── Categorias ────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { nome: 'Hardware' },
      update: {},
      create: { nome: 'Hardware', slaHoras: 8 },
    }),
    prisma.category.upsert({
      where: { nome: 'Software' },
      update: {},
      create: { nome: 'Software', slaHoras: 24 },
    }),
    prisma.category.upsert({
      where: { nome: 'Rede' },
      update: {},
      create: { nome: 'Rede', slaHoras: 2 },
    }),
    prisma.category.upsert({
      where: { nome: 'Acesso / Senha' },
      update: {},
      create: { nome: 'Acesso / Senha', slaHoras: 4 },
    }),
    prisma.category.upsert({
      where: { nome: 'E-mail / Comunicação' },
      update: {},
      create: { nome: 'E-mail / Comunicação', slaHoras: 16 },
    }),
    prisma.category.upsert({
      where: { nome: 'Instalação de Software' },
      update: {},
      create: { nome: 'Instalação de Software', slaHoras: 48 },
    }),
    prisma.category.upsert({
      where: { nome: 'Outros' },
      update: {},
      create: { nome: 'Outros', slaHoras: 72 },
    }),
  ]);

  console.log(`✅ ${categories.length} categorias criadas`);

  // ─── Usuários ──────────────────────────────────────────────────────────────
  const senhaHash = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@atendeti.com' },
    update: {},
    create: { nome: 'Administrador TI', email: 'admin@atendeti.com', senhaHash, papel: Role.ADMIN, setor: 'TI' },
  });

  const agente1 = await prisma.user.upsert({
    where: { email: 'carlos.ti@atendeti.com' },
    update: {},
    create: { nome: 'Carlos Souza', email: 'carlos.ti@atendeti.com', senhaHash, papel: Role.AGENTE, setor: 'TI' },
  });

  const agente2 = await prisma.user.upsert({
    where: { email: 'ana.ti@atendeti.com' },
    update: {},
    create: { nome: 'Ana Lima', email: 'ana.ti@atendeti.com', senhaHash, papel: Role.AGENTE, setor: 'TI' },
  });

  const colab1 = await prisma.user.upsert({
    where: { email: 'joao.silva@atendeti.com' },
    update: {},
    create: { nome: 'João Silva', email: 'joao.silva@atendeti.com', senhaHash, papel: Role.COLABORADOR, setor: 'Financeiro' },
  });

  const colab2 = await prisma.user.upsert({
    where: { email: 'maria.santos@atendeti.com' },
    update: {},
    create: { nome: 'Maria Santos', email: 'maria.santos@atendeti.com', senhaHash, papel: Role.COLABORADOR, setor: 'RH' },
  });

  const colab3 = await prisma.user.upsert({
    where: { email: 'pedro.rh@atendeti.com' },
    update: {},
    create: { nome: 'Pedro Alves', email: 'pedro.rh@atendeti.com', senhaHash, papel: Role.COLABORADOR, setor: 'Comercial' },
  });

  console.log(`✅ 6 usuários criados`);

  // ─── Tickets ───────────────────────────────────────────────────────────────
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const ticket1 = await prisma.ticket.create({
    data: {
      titulo: 'Internet completamente fora no 2º andar',
      descricao: 'Todos os computadores do 2º andar perderam conexão com a internet desde as 14h. Estamos sem conseguir trabalhar. Sistema de ERP também caiu.',
      prioridade: Priority.CRITICA,
      status: TicketStatus.EM_ANDAMENTO,
      categoriaId: categories[2].id,
      criadoPorId: colab1.id,
      atribuidoAId: agente1.id,
      assumidoEm: hourAgo,
      criadoEm: twoHoursAgo,
    },
  });

  await prisma.comment.createMany({
    data: [
      {
        ticketId: ticket1.id,
        autorId: colab1.id,
        texto: 'Urgente! Estamos totalmente parados. Equipe inteira afetada.',
        isNotaInterna: false,
        criadoEm: twoHoursAgo,
      },
      {
        ticketId: ticket1.id,
        autorId: agente1.id,
        texto: 'Certo, João. Já estou verificando o switch do 2º andar. Identificamos que o equipamento travou. Vou reiniciar.',
        isNotaInterna: false,
        criadoEm: hourAgo,
      },
      {
        ticketId: ticket1.id,
        autorId: agente1.id,
        texto: 'NOTA INTERNA: Switch modelo Cisco SG350 travou. Aparentemente problema no firmware. Analisar se precisamos de atualização após normalizar.',
        isNotaInterna: true,
        criadoEm: hourAgo,
      },
    ],
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      titulo: 'Não consigo acessar meu e-mail corporativo',
      descricao: 'Ao tentar abrir o Outlook, aparece a mensagem "Não é possível conectar ao servidor Exchange". Já reiniciei o computador mas o problema persiste.',
      prioridade: Priority.ALTA,
      status: TicketStatus.AGUARDANDO_USUARIO,
      categoriaId: categories[4].id,
      criadoPorId: colab2.id,
      atribuidoAId: agente2.id,
      assumidoEm: dayAgo,
      criadoEm: dayAgo,
    },
  });

  await prisma.comment.create({
    data: {
      ticketId: ticket2.id,
      autorId: agente2.id,
      texto: 'Maria, vou precisar que você tente acessar pelo webmail: https://mail.empresa.com — consegue acessar por lá?',
      isNotaInterna: false,
      criadoEm: dayAgo,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      titulo: 'Solicitar instalação do Adobe Acrobat Pro',
      descricao: 'Preciso do Adobe Acrobat Pro para assinar contratos digitalmente. Atualmente só tenho o Reader.',
      prioridade: Priority.NAO_CLASSIFICADA,
      status: TicketStatus.NOVO,
      categoriaId: categories[5].id,
      criadoPorId: colab3.id,
      criadoEm: now,
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      titulo: 'Computador travando ao abrir Excel com planilhas grandes',
      descricao: 'Sempre que abro planilhas acima de 10MB, o computador trava por vários minutos. Às vezes fecha o Excel sozinho. Preciso dessas planilhas diariamente para relatórios.',
      prioridade: Priority.MEDIA,
      status: TicketStatus.RESOLVIDO,
      categoriaId: categories[0].id,
      criadoPorId: colab1.id,
      atribuidoAId: agente1.id,
      assumidoEm: twoDaysAgo,
      resolvidoEm: dayAgo,
      descricaoSolucao: 'Identificado que o computador tinha apenas 4GB de RAM, insuficiente para planilhas grandes. Adicionamos mais 8GB de memória RAM. Problema resolvido.',
      criadoEm: twoDaysAgo,
    },
  });

  await prisma.priorityLog.create({
    data: {
      ticketId: ticket4.id,
      alteradoPorId: agente1.id,
      prioridadeAnterior: Priority.ALTA,
      novaPrioridade: Priority.MEDIA,
      motivo: 'Usuário tem computador backup disponível. Reclassificado para Média.',
    },
  });

  const ticket5 = await prisma.ticket.create({
    data: {
      titulo: 'Dúvida sobre configuração de VPN',
      descricao: 'Preciso acessar o sistema da empresa de casa durante meu home office na próxima semana. Como configuro a VPN no meu notebook pessoal?',
      prioridade: Priority.BAIXA,
      status: TicketStatus.FECHADO,
      categoriaId: categories[1].id,
      criadoPorId: colab2.id,
      atribuidoAId: agente2.id,
      assumidoEm: twoDaysAgo,
      resolvidoEm: twoDaysAgo,
      fechadoEm: dayAgo,
      descricaoSolucao: 'Enviado tutorial de configuração da VPN por e-mail e realizado suporte remoto para instalação.',
      criadoEm: twoDaysAgo,
    },
  });

  console.log(`✅ 5 tickets de exemplo criados`);

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('  Admin:         admin@atendeti.com       | Admin@123');
  console.log('  Agente 1:      carlos.ti@atendeti.com   | Admin@123');
  console.log('  Agente 2:      ana.ti@atendeti.com      | Admin@123');
  console.log('  Colaborador 1: joao.silva@atendeti.com  | Admin@123');
  console.log('  Colaborador 2: maria.santos@atendeti.com| Admin@123');
  console.log('  Colaborador 3: pedro.rh@atendeti.com    | Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
