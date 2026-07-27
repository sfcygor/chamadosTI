# Comandos Essenciais do Git (Cheat Sheet)

Aqui estão os comandos básicos para usar o Git como sistema de backup local seguro.

## 1. Salvar um Checkpoint (Commit)
Sempre que concluir algo ou antes de fazer uma alteração arriscada, salve seu progresso.

```bash
# 1. Adiciona todas as modificações atuais para serem salvas
git add .

# 2. Cria o checkpoint (commit) com uma mensagem descritiva
git commit -m "feat: adicionei a aba de relatorios"
```
*Dicas de mensagens:*
- `feat: ...` para novas funcionalidades
- `fix: ...` para correção de bugs
- `chore: ...` para manutenção/configuração de projeto

## 2. Trabalhar com Branches (Regra de Ouro)
**A branch `main` só deve conter código que funciona perfeitamente.**
Antes de começar algo novo, crie um ambiente isolado (branch).

```bash
# 1. Criar e entrar em uma nova branch isolada
git checkout -b feature/minha-mudanca

# ... faça as alterações e salve seus checkpoints com git add e git commit ...

# 2. Quando tudo estiver finalizado e testado, volte para a principal (main)
git checkout main

# 3. Traga (mescle) as modificações que deram certo para a main
git merge feature/minha-mudanca
```

## 3. Desfazer Modificações (Voltar no Tempo)

**Cenário A: Modifiquei um arquivo agora, quebrou tudo, mas EU AINDA NÃO DEI COMMIT.**
Para jogar fora tudo que foi modificado desde o último commit:
```bash
git reset --hard
# ATENÇÃO: Isso apaga permanentemente as mudanças não salvas.
```

**Cenário B: Quero apenas ver como o sistema estava há dois dias atrás.**
```bash
# 1. Veja a lista de commits e copie as primeiras letras/números (hash) do commit desejado
git log --oneline

# 2. Volte para ele (isso não apaga nada do futuro, você só está "viajando no tempo")
git checkout 3f8a9b2

# 3. Para voltar ao estado atual (presente), volte para sua branch
git checkout main
```

## 4. Visualizar o Estado e o Histórico

**Ver quais arquivos eu alterei hoje:**
```bash
git status
```

**Ver a lista de todos os checkpoints (commits) já feitos:**
```bash
git log --oneline
```
