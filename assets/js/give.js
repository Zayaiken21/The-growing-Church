import {init,$,safeUrl} from './core.js';
const c=await init(),url=safeUrl(c.settings.givingUrl);if(c.settings.givingUrl&&url){$('#giving').href=url;$('#giving').target='_blank';$('#giving').rel='noopener noreferrer';$('#giving').hidden=false;$('#giving-note').hidden=true;}
