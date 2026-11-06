/* Optional Supabase Auth + per-user cloud career save. Offline play does not depend on this file. */
const cloudConfig = window.MAIDAN_SUPABASE_CONFIG || { url: '', anonKey: '' };
const cloudState = { configured: Boolean(cloudConfig.url && cloudConfig.anonKey), loading: false, user: null, message: 'Offline saving is active.' };
let supabaseClient = null;
let cloudSaveTimer = null;

function updateCloudState(message) {
  if (message) cloudState.message = message;
  window.dispatchEvent(new CustomEvent('maidan:cloud-state', { detail: { ...cloudState } }));
  if (window.MaidanGame && typeof window.MaidanGame.render === 'function') {
    const tabName = (typeof tab !== 'undefined') ? tab : '';
    if (tabName === 'Cloud Account') window.MaidanGame.render();
  }
}

async function initCloud() {
  if (!cloudState.configured) {
    updateCloudState('Cloud sync is not configured. The game is fully playable with offline saves.');
    return;
  }
  cloudState.loading = true;
  updateCloudState('Connecting to your cloud save service…');
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabaseClient = createClient(cloudConfig.url, cloudConfig.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    cloudState.user = data?.session?.user || null;
    cloudState.loading = false;
    updateCloudState(cloudState.user ? `Signed in as ${cloudState.user.email}. Cloud sync is available.` : 'Cloud service connected. Sign in or create an account to synchronise careers.');
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      cloudState.user = session?.user || null;
      updateCloudState(cloudState.user ? `Signed in as ${cloudState.user.email}. Cloud sync is available.` : 'You are signed out. Your local career remains saved on this device.');
    });
  } catch (error) {
    cloudState.loading = false;
    cloudState.message = `Cloud service could not be reached: ${error?.message || 'connection error'}. Offline saves are still available.`;
    updateCloudState();
  }
}

async function signUp(email, password) {
  if (!supabaseClient) throw new Error('Cloud service is not configured.');
  const { data, error } = await supabaseClient.auth.signUp({
    email, password,
    options: { emailRedirectTo: window.location.href.split('#')[0] }
  });
  if (error) throw error;
  cloudState.user = data?.session?.user || data?.user || null;
  updateCloudState(data?.session ? 'Account created and signed in.' : 'Account created. Check your email to confirm it, then sign in.');
  return data;
}

async function signIn(email, password) {
  if (!supabaseClient) throw new Error('Cloud service is not configured.');
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  cloudState.user = data?.user || data?.session?.user || null;
  updateCloudState(`Signed in as ${cloudState.user?.email || email}.`);
  return data;
}

async function signOut() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
  cloudState.user = null;
  updateCloudState('Signed out. Your local save is unchanged.');
}

async function syncCareer(career) {
  if (!supabaseClient || !cloudState.user || !career) throw new Error('Sign in before synchronising a career.');
  const row = {
    user_id: cloudState.user.id,
    save_data: career,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabaseClient.from('player_saves').upsert(row, { onConflict: 'user_id' });
  if (error) throw error;
  updateCloudState(`Cloud save updated at ${new Date().toLocaleString()}.`);
}

async function restoreCareer() {
  if (!supabaseClient || !cloudState.user) throw new Error('Sign in before restoring a cloud save.');
  const { data, error } = await supabaseClient.from('player_saves').select('save_data, updated_at').eq('user_id', cloudState.user.id).maybeSingle();
  if (error) throw error;
  if (!data?.save_data) throw new Error('No cloud career save was found for this account.');
  const local = window.MaidanGame?.getCareer?.();
  const localDay = Number(local?.day || 0);
  const remoteDay = Number(data.save_data?.day || 0);
  if (local && localDay > 0 && !window.confirm(`Restore the cloud save from ${new Date(data.updated_at).toLocaleString()}? Your current local career (Day ${localDay}) will be replaced by the cloud career (Day ${remoteDay}). Export a backup first if you need it.`)) return;
  window.MaidanGame.setCareer(data.save_data);
  updateCloudState(`Cloud career restored from ${new Date(data.updated_at).toLocaleString()}.`);
}

function scheduleCloudSave(career) {
  if (!supabaseClient || !cloudState.user || !career) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => {
    syncCareer(career).catch((error) => updateCloudState(`Automatic cloud sync failed: ${error?.message || 'unknown error'}. You can retry manually.`));
  }, 1600);
}

window.MaidanCloud = {
  getState: () => ({ ...cloudState }),
  signUp,
  signIn,
  signOut,
  syncNow: () => syncCareer(window.MaidanGame?.getCareer?.()),
  restore: restoreCareer,
  scheduleSave: scheduleCloudSave
};

window.MaidanCloudSignUp = async () => {
  const email = document.getElementById('cloudEmail')?.value?.trim();
  const password = document.getElementById('cloudPassword')?.value || '';
  try {
    if (!email || password.length < 8) throw new Error('Enter a valid email and a password with at least 8 characters.');
    await signUp(email, password);
    window.MaidanGame?.notify?.('Cloud account request completed. Check the account status message.');
  } catch (error) { alert(error?.message || 'Unable to create account.'); }
};
window.MaidanCloudSignIn = async () => {
  const email = document.getElementById('cloudEmail')?.value?.trim();
  const password = document.getElementById('cloudPassword')?.value || '';
  try {
    if (!email || !password) throw new Error('Enter your email and password.');
    await signIn(email, password);
    const current = window.MaidanGame?.getCareer?.();
    if (current) await syncCareer(current);
    window.MaidanGame?.notify?.('Signed in and current career synchronised.');
  } catch (error) { alert(error?.message || 'Unable to sign in.'); }
};
window.MaidanCloudSignOut = async () => {
  try { await signOut(); window.MaidanGame?.notify?.('Signed out. Local career remains available.'); }
  catch (error) { alert(error?.message || 'Unable to sign out.'); }
};
window.MaidanCloudSyncNow = async () => {
  try { await window.MaidanCloud.syncNow(); window.MaidanGame?.notify?.('Cloud save synchronised.'); }
  catch (error) { alert(error?.message || 'Unable to synchronise.'); }
};
window.MaidanCloudRestore = async () => {
  try { await window.MaidanCloud.restore(); window.MaidanGame?.notify?.('Cloud save restored.'); }
  catch (error) { alert(error?.message || 'Unable to restore the cloud save.'); }
};

initCloud();
