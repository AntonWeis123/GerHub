const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || `${BASE_URL}/auth/discord/callback`;

const PRODUCTS = {
  small:  { name: 'Kleiner Ordner', price: '5,00 €', paypal: process.env.PAYPAL_SMALL_URL || '#' },
  medium: { name: 'Mittlerer Ordner', price: '10,00 €', paypal: process.env.PAYPAL_MEDIUM_URL || '#' },
  large:  { name: 'Großer Ordner', price: '20,00 €', paypal: process.env.PAYPAL_LARGE_URL || '#' }
};

app.use(session({ secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'), resave:false, saveUninitialized:false, cookie:{httpOnly:true, sameSite:'lax', secure: process.env.NODE_ENV==='production'} }));
app.use(express.static(path.join(__dirname,'public')));

app.get('/auth/discord', (req,res)=>{
  if(!DISCORD_CLIENT_ID) return res.status(500).send('Discord OAuth2 ist noch nicht konfiguriert. Setze DISCORD_CLIENT_ID und DISCORD_CLIENT_SECRET.');
  const state=crypto.randomBytes(24).toString('hex'); req.session.oauthState=state;
  const params=new URLSearchParams({client_id:DISCORD_CLIENT_ID,response_type:'code',redirect_uri:DISCORD_REDIRECT_URI,scope:'identify',state});
  res.redirect('https://discord.com/oauth2/authorize?'+params.toString());
});

app.get('/auth/discord/callback', async (req,res)=>{
  if(!req.query.code || req.query.state !== req.session.oauthState) return res.status(400).send('Ungültige Discord-Anmeldung. Bitte erneut versuchen.');
  try{
    const body=new URLSearchParams({client_id:DISCORD_CLIENT_ID,client_secret:DISCORD_CLIENT_SECRET,grant_type:'authorization_code',code:req.query.code,redirect_uri:DISCORD_REDIRECT_URI});
    const tokenRes=await fetch('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
    if(!tokenRes.ok) throw new Error('Token exchange failed');
    const token=await tokenRes.json();
    const userRes=await fetch('https://discord.com/api/users/@me',{headers:{Authorization:`Bearer ${token.access_token}`}});
    if(!userRes.ok) throw new Error('User lookup failed');
    req.session.discordUser=await userRes.json();
    delete req.session.oauthState;
    res.redirect('/');
  }catch(e){ console.error(e); res.status(500).send('Discord-Anmeldung fehlgeschlagen.'); }
});

app.get('/api/me',(req,res)=>res.json({user:req.session.discordUser||null}));
app.get('/logout',(req,res)=>req.session.destroy(()=>res.redirect('/')));

app.get('/buy/:id',(req,res)=>{
  const p=PRODUCTS[req.params.id]; if(!p) return res.status(404).send('Produkt nicht gefunden.');
  if(!req.session.discordUser) return res.redirect('/auth/discord');
  if(p.paypal==='#') return res.status(500).send('PayPal-Link für dieses Produkt fehlt.');
  // The Discord user is stored in the session. The PayPal link itself does not transmit their Discord ID.
  res.redirect(p.paypal);
});

app.listen(PORT,()=>console.log(`GerHub läuft auf ${BASE_URL}`));
