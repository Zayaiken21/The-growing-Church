import {init,cards,$,safeUrl} from './core.js';
const c=await init();cards(c.sermons,'#sermons');const url=safeUrl(c.settings.livestreamUrl);if(c.settings.livestreamUrl&&url){$('#livestream').href=url;$('#livestream').hidden=false;}
