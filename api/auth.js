const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

function hashSenha(senha) {
  return crypto.createHash('sha256').update(senha + 'bncc2024salt').digest('hex');
}

function sanitizar(texto) {
  return texto.replace(/[<>'"`;]/g, '').trim().slice(0, 500);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const { acao, nome, email, senha } = req.body;

  if (!email || !senha) return res.status(400).json({ erro: 'Email e senha obrigatórios' });

  const emailLimpo = sanitizar(email).toLowerCase();
  const senhaHash = hashSenha(sanitizar(senha));

  if (acao === 'cadastro') {
    if (!nome) return res.status(400).json({ erro: 'Nome obrigatório' });
    const nomeLimpo = sanitizar(nome);
    const { data: existe } = await supabase.from('usuarios').select('id').eq('email', emailLimpo).single();
    if (existe) return res.status(400).json({ erro: 'Email já cadastrado' });
    const { data, error } = await supabase.from('usuarios').insert({ nome: nomeLimpo, email: emailLimpo, senha_hash: senhaHash }).select().single();
    if (error) return res.status(500).json({ erro: 'Erro ao cadastrar' });
    return res.status(200).json({ usuario: { id: data.id, nome: data.nome, email: data.email } });
  }

  if (acao === 'login') {
    const { data, error } = await supabase.from('usuarios').select('id, nome, email').eq('email', emailLimpo).eq('senha_hash', senhaHash).single();
    if (error || !data) return res.status(401).json({ erro: 'Email ou senha incorretos' });
    return res.status(200).json({ usuario: { id: data.id, nome: data.nome, email: data.email } });
  }

  return res.status(400).json({ erro: 'Ação inválida' });
};
