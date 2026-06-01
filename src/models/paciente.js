const supabase = require('../utils/supabase');

const TABLE = 'pacientes';

async function create(payload) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function findByKinesiologo(kinesiologoId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('kinesiologo_id', kinesiologoId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function findById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function update(id, payload) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function remove(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

module.exports = { create, findByKinesiologo, findById, update, remove };
