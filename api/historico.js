const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { usuario_id, id } = req.query;

  if (!usuario_id) return res.status(400).json({ erro: 'usuario_id obrigatorio' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('historico')
      .select('*')
      .eq('usuario_id', usuario_id)
      .order('criado_em', { ascending: false });
    if (error) return res.status(500).json({ erro: 'Erro ao buscar histórico' });
    return res.status(200).json({ historico: data });
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ erro: 'id obrigatorio' });
    const { error } = await supabase
      .from('historico')
      .delete()
      .eq('id', id)
      .eq('usuario_id', usuario_id);
    if (error) return res.status(500).json({ erro: 'Erro ao deletar' });
    return res.status(200).json({ sucesso: true });
  }

  return res.status(405).json({ erro: 'Método não permitido' });
};
