const express=require("express");
const path=require("path");
const bcrypt=require("bcryptjs");
const Database=require("better-sqlite3");
const jwt=require("jsonwebtoken");
require("dotenv").config?.();

const app=express(), PORT=process.env.PORT||3000;
const db=new Database("earningcryptoeh.db");
db.pragma("journal_mode=WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,
 name TEXT NOT NULL,referral_code TEXT UNIQUE NOT NULL, referred_by TEXT, balance REAL DEFAULT 0,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS transactions(
 id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,type TEXT NOT NULL,amount REAL NOT NULL,
 status TEXT DEFAULT 'pending',note TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);
app.use(express.json());
app.use(express.static(path.join(__dirname,"../public")));

const SECRET=process.env.JWT_SECRET||"dev-only-change-me";
function token(u){return jwt.sign({id:u.id,email:u.email},SECRET,{expiresIn:"7d"});}
function auth(req,res,next){
 const h=req.headers.authorization||"";
 try{req.user=jwt.verify(h.replace("Bearer ",""),SECRET);next();}
 catch(e){res.status(401).json({error:"Authentication required"});}
}
function admin(req,res,next){ if(req.user.email!==(process.env.ADMIN_EMAIL||"admin@example.com")) return res.status(403).json({error:"Admin only"}); next(); }

app.post("/api/register",(req,res)=>{
 const {name,email,password,referral}=req.body||{};
 if(!name||!email||!password||password.length<8) return res.status(400).json({error:"Name, valid email and 8+ character password required"});
 const code=("EH"+Math.random().toString(36).slice(2,9)).toUpperCase();
 try{
  const hash=bcrypt.hashSync(password,12);
  const r=db.prepare("INSERT INTO users(name,email,password,referral_code,referred_by) VALUES(?,?,?,?,?)").run(name,email.toLowerCase(),hash,code,referral||null);
  const u=db.prepare("SELECT id,email,name,referral_code,balance FROM users WHERE id=?").get(r.lastInsertRowid);
  res.json({token:token(u),user:u});
 }catch(e){res.status(400).json({error:"Email already registered"});}
});
app.post("/api/login",(req,res)=>{
 const u=db.prepare("SELECT * FROM users WHERE email=?").get((req.body.email||"").toLowerCase());
 if(!u||!bcrypt.compareSync(req.body.password||"",u.password)) return res.status(401).json({error:"Invalid email or password"});
 res.json({token:token(u),user:{id:u.id,email:u.email,name:u.name,referral_code:u.referral_code,balance:u.balance}});
});
app.get("/api/me",auth,(req,res)=>{
 const u=db.prepare("SELECT id,email,name,referral_code,balance,created_at FROM users WHERE id=?").get(req.user.id);
 const tx=db.prepare("SELECT * FROM transactions WHERE user_id=? ORDER BY id DESC LIMIT 20").all(req.user.id);
 res.json({user:u,transactions:tx});
});
app.post("/api/transactions",auth,(req,res)=>{
 const {type,amount,note}=req.body||{};
 if(!["deposit_request","withdraw_request"].includes(type)||!Number.isFinite(+amount)||+amount<=0) return res.status(400).json({error:"Invalid request"});
 if(type==="withdraw_request"){
   const u=db.prepare("SELECT balance FROM users WHERE id=?").get(req.user.id);
   if(+amount>u.balance) return res.status(400).json({error:"Insufficient available balance"});
 }
 const r=db.prepare("INSERT INTO transactions(user_id,type,amount,note) VALUES(?,?,?,?)").run(req.user.id,type,+amount,note||"");
 res.json({ok:true,id:r.lastInsertRowid});
});
app.get("/api/admin/users",auth,admin,(req,res)=>res.json(db.prepare("SELECT id,name,email,balance,referral_code,created_at FROM users ORDER BY id DESC").all()));
app.get("/api/admin/transactions",auth,admin,(req,res)=>res.json(db.prepare("SELECT t.*,u.email FROM transactions t JOIN users u ON u.id=t.user_id ORDER BY t.id DESC LIMIT 100").all()));
app.post("/api/admin/transactions/:id",auth,admin,(req,res)=>{
 const tx=db.prepare("SELECT * FROM transactions WHERE id=?").get(req.params.id);
 if(!tx) return res.status(404).json({error:"Not found"});
 const status=req.body.status;
 if(!["approved","rejected"].includes(status)) return res.status(400).json({error:"Invalid status"});
 const update=db.transaction(()=>{
   db.prepare("UPDATE transactions SET status=? WHERE id=?").run(status,tx.id);
   if(status==="approved" && tx.type==="deposit_request") db.prepare("UPDATE users SET balance=balance+? WHERE id=?").run(tx.amount,tx.user_id);
   if(status==="approved" && tx.type==="withdraw_request") db.prepare("UPDATE users SET balance=balance-? WHERE id=?").run(tx.amount,tx.user_id);
 });
 update(); res.json({ok:true});
});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"../public/index.html")));
app.listen(PORT,()=>console.log(`EarningCryptoEH running on http://localhost:${PORT}`));
