-- ARREGLAR PERMISOS DEL CHAT (Esencial para que funcionen los mensajes)

-- 1. Asegurar que las tablas tienen seguridad activada
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 2. Borrar políticas antiguas para evitar fallos
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON direct_messages;
DROP POLICY IF EXISTS "Enable insert for authed users" ON direct_messages;
DROP POLICY IF EXISTS "Enable read for users involved" ON direct_messages;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON conversations;
DROP POLICY IF EXISTS "Enable insert for authed users" ON conversations;
DROP POLICY IF EXISTS "Enable read for users involved" ON conversations;

-- 3. Crear Políticas correctas

-- CONVERSACIONES: Cualquiera puede crear una conversación si es participante
CREATE POLICY "Chat Conv Insert" ON conversations FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
);

-- CONVERSACIONES: Solo los participantes pueden ver sus conversaciones
CREATE POLICY "Chat Conv Select" ON conversations FOR SELECT TO authenticated USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
);

-- CONVERSACIONES: Permitir actualizar (para last_message)
CREATE POLICY "Chat Conv Update" ON conversations FOR UPDATE TO authenticated USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
);


-- MENSAJES: Poder enviar mensajes si eres el sender
CREATE POLICY "Chat Msg Insert" ON direct_messages FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id
);

-- MENSAJES: Poder leer mensajes si estás en la conversación
CREATE POLICY "Chat Msg Select" ON direct_messages FOR SELECT TO authenticated USING (
    auth.uid() IN (
        SELECT participant1_id FROM conversations WHERE id = conversation_id
        UNION
        SELECT participant2_id FROM conversations WHERE id = conversation_id
    )
);
