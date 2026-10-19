// Screen explicit organization names only; never infer a person's beliefs.
export function pantryVisible(provider){
 const name=String(provider?.name||'').normalize('NFKC').toLowerCase();
 if(/\bgreater\s+st[.\s]*paul\b/.test(name))return true;
 return !/\b(?:church|ministr(?:y|ies)|mosque|masjid|islam(?:ic)?|muslim|synagogue|jewish|juda(?:ism|ic)|temple|sikh|gurdwara|hindu|buddhis\w*|catholic|christian|baptist|pentecostal|adventist|episcopal|lutheran|presbyterian|methodist|parish|cathedral|congregation|tabernacle|gospel|jehovah)\b|salvation army/i.test(name);
}
