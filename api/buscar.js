const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

function sanitizar(texto) {
  return texto.replace(/[<>'"`;]/g, '').trim().slice(0, 1000);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const { usuario_id, atividade, etapa, etapa_cor, area } = req.body;

  if (!usuario_id || !atividade || !etapa) {
    return res.status(400).json({ erro: 'Dados incompletos' });
  }

  const atividadeLimpa = sanitizar(atividade);
  const etapaLimpa = sanitizar(etapa);
  const areaLimpa = sanitizar(area || 'Todas as areas');

  const areaFiltro = areaLimpa !== 'Todas as areas' ? `Foco na area: ${areaLimpa}.` : '';
  const prompt = `Voce e um especialista em educacao e na Base Nacional Comum Curricular (BNCC) do Brasil.

O professor quer trabalhar a seguinte atividade ou objetivo:
"${atividadeLimpa}"

Etapa Escolar: ${etapaLimpa}
${areaFiltro}

Sua tarefa:
1. Identifique as habilidades da BNCC mais relevantes para essa atividade e etapa escolar.
2. Para cada habilidade, forneca:
   - Codigo da habilidade (ex: EF15LP01, EI03CG01, EM13LGG101)
   - Descricao completa da habilidade conforme a BNCC
   - Area/componente curricular
   - Por que essa habilidade se relaciona com a atividade proposta
3. Sugira tambem objetivos de aprendizagem alinhados.
4. Se for Educacao Infantil, use os Campos de Experiencia e objetivos de aprendizagem correspondentes.

Formate a resposta de forma clara e organizada em Markdown. Seja preciso e use os codigos e textos reais da BNCC.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const resultado = data.content?.map(b => b.text || '').join('') || 'Sem resposta.';

    const { error } = await supabase.from('historico').insert({
      usuario_id,
      atividade: atividadeLimpa,
      etapa: etapaLimpa,
      etapa_cor: etapa_cor || '#3b82f6',
      area: areaLimpa,
      resultado
    });

    if (error) console.error('Erro ao salvar histórico:', error);

    return res.status(200).json({ resultado });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao consultar IA' });
  }
};
