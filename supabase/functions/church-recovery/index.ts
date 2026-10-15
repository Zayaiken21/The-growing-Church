import { createClient } from 'npm:@supabase/supabase-js@2.49.8';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s=>s.trim()).filter(Boolean);
Deno.serve(async(req: Request) => {
  const origin = req.headers.get('origin') || '';
  const cors = { 'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
  const reply = (body: unknown, code=200) => new Response(JSON.stringify(body),{status:code,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(!allowedOrigins.includes(origin)) return reply({error:'Origin not allowed.'},403);
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers:cors});
  if(req.method!=='POST') return reply({error:'Method not allowed.'},405);
  try {
    const raw=await req.text();
    if(raw.length>4096) return reply({error:'Request too large.'},413);
    const body=JSON.parse(raw);
    if(typeof body.email!=='string'||body.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())||typeof body.pin!=='string'||!/^\d{10,16}$/.test(body.pin)) return reply({error:'Invalid request.'},400);
    const url=Deno.env.get('SUPABASE_URL')!;
    const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
    if(body.action==='issue') {
      const authorization=req.headers.get('authorization')||'';
      if(!authorization.startsWith('Bearer '))return reply({error:'Pastor access required.'},403);
      const {data,error}=await admin.auth.getUser(authorization.slice(7));
      if(error||data.user?.app_metadata?.role!=='pastor')return reply({error:'Pastor access required.'},403);
      const result=await admin.rpc('issue_church_pin',{member_email:body.email.trim(),recovery_pin:body.pin,pastor_id:data.user.id});
      if(result.error||!result.data)return reply({error:'Cannot issue PIN. Verify that this is a confirmed member account.'},400);
      return reply({ok:true});
    }
    if(body.action==='redeem') {
      if(typeof body.password!=='string'||body.password.length<12||body.password.length>128)return reply({error:'Use a password with 12–128 characters.'},400);
      const result=await admin.rpc('redeem_church_pin',{member_email:body.email.trim(),recovery_pin:body.pin});
      if(result.error||!result.data)return reply({error:'Recovery could not be completed. Ask your pastor for help or try again later.'},400);
      const {error}=await admin.auth.admin.updateUserById(result.data,{password:body.password});
      // PIN is consumed before the password change. On failure, pastor must issue a new PIN.
      if(error)return reply({error:'Recovery could not be completed. Ask your pastor for a new PIN.'},400);
      return reply({ok:true});
    }
    return reply({error:'Unknown action.'},400);
  } catch {return reply({error:'Request could not be processed.'},400);}
});
