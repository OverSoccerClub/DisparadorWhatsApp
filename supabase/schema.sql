-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create clients table
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campanhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  destinatarios JSONB DEFAULT '[]'::jsonb,
  agendamento TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'agendada', 'enviando', 'concluida', 'pausada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create dispatches table
CREATE TABLE IF NOT EXISTS disparos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  telefone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'entregue', 'lido', 'erro')),
  resposta TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_user_id ON campanhas(user_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON campanhas(status);
CREATE INDEX IF NOT EXISTS idx_disparos_campanha_id ON disparos(campanha_id);
CREATE INDEX IF NOT EXISTS idx_disparos_user_id ON disparos(user_id);
CREATE INDEX IF NOT EXISTS idx_disparos_status ON disparos(status);

-- Enable Row Level Security
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE disparos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own clients" ON clientes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON clientes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clientes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON clientes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own campaigns" ON campanhas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON campanhas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON campanhas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON campanhas
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own dispatches" ON disparos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dispatches" ON disparos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dispatches" ON disparos
  FOR UPDATE USING (auth.uid() = user_id);

-- Create functions for statistics
CREATE OR REPLACE FUNCTION get_client_stats(user_uuid UUID)
RETURNS TABLE (
  total_clientes BIGINT,
  clientes_ativos BIGINT,
  clientes_inativos BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_clientes,
    COUNT(*) FILTER (WHERE status = 'ativo') as clientes_ativos,
    COUNT(*) FILTER (WHERE status = 'inativo') as clientes_inativos
  FROM clientes 
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_campaign_stats(user_uuid UUID)
RETURNS TABLE (
  total_campanhas BIGINT,
  campanhas_ativas BIGINT,
  mensagens_enviadas BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT c.id) as total_campanhas,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('agendada', 'enviando')) as campanhas_ativas,
    COUNT(d.id) FILTER (WHERE d.status IN ('enviado', 'entregue', 'lido')) as mensagens_enviadas
  FROM campanhas c
  LEFT JOIN disparos d ON c.id = d.campanha_id
  WHERE c.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
