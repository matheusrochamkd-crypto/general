-- ADICIONAR PROTEÇÃO CONTRA DUPLICATAS
-- Execute isso no Supabase SQL Editor

-- 1. (Opcional) Garantir que não existem duplicatas antes de criar a regra
-- Se houver duplicatas, o comando abaixo falhará. O botão "Corrigir Duplicatas" no app já deve ter limpado.

-- 2. Criar a restrição "Constraint"
-- Isso impede que o banco aceite dois eventos idênticos (mesmo Título, Data, Hora e Tipo) para o mesmo usuário.

ALTER TABLE agenda_events
ADD CONSTRAINT unique_event_content 
UNIQUE (user_id, title, start_date, time, type);

-- Se der erro dizendo que "values are not unique", significa que ainda tem duplicata.
-- Nesse caso, rode esse comando de limpeza forçada antes:
/*
DELETE FROM agenda_events a USING (
      SELECT min(id) as id, title, start_date, time, type
      FROM agenda_events 
      GROUP BY title, start_date, time, type
      HAVING count(*) > 1
    ) b
    WHERE a.title = b.title 
      AND a.start_date = b.start_date 
      AND a.type = b.type 
      AND (a.time = b.time OR (a.time IS NULL AND b.time IS NULL))
      AND a.id <> b.id;
*/
