const supabase = require('../utils/supabase');

const TABLE = 'kinesiologo';

async function findByEmail(email) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('email', email)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function findById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function create(payload) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function findByGoogleId(googleId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('google_id', googleId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function findByGithubId(githubId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('github_id', githubId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

module.exports = { findByEmail, findById, create, findByGoogleId, findByGithubId };
