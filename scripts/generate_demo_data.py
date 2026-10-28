"""Generate the invented demo data for the Client Command Center dashboard.

Writes requests.csv, deadlines.csv, registrations.csv and clients.csv into ../data.
Seeded (random.seed(42)) so output is reproducible. All clubs and numbers are fictional.
Run: python3 scripts/generate_demo_data.py
"""
import random, csv, datetime as dt, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
os.makedirs(OUT, exist_ok=True)
P = lambda n: os.path.join(OUT, n)
random.seed(42)
clients=[("Riverbend YSC","Soccer","GotSport / SportsEngine",400),
("Harbor Point Volleyball","Volleyball","SportsEngine",180),
("Live Oak Baseball League","Baseball","Sports Connect",520),
("Marsh Hawks Lacrosse","Lacrosse","TeamLinkt",150),
("Tidewater Hoops","Basketball","Byga",240)]
w={"Riverbend YSC":1.4,"Harbor Point Volleyball":0.8,"Live Oak Baseball League":1.3,"Marsh Hawks Lacrosse":0.6,"Tidewater Hoops":0.9}
cats=[("Registration",28),("Payment / refund",18),("Schedule change",20),("Uniforms",9),("Sponsor",5),("General question",15),("Complaint",5)]
chans=[("Email",50),("Phone",18),("Voicemail",10),("Social DM",10),("Team app",12)]
def pick(l): return random.choices([a for a,_ in l],[b for _,b in l])[0]
start=dt.datetime(2026,8,31,8); now=dt.datetime(2026,10,13,17)
rows=[];i=1
d=start
while d<now:
  if d.weekday()<5:
    for c,_,_,_ in clients:
      n=max(0,int(random.gauss(2.2*w[c],1.2)))
      for _ in range(n):
        rec=d.replace(hour=random.randint(7,20),minute=random.randint(0,59))
        if rec>now: continue
        cat=pick(cats); ch=pick(chans)
        frh=abs(random.gauss(2.5,2.0)) if rec.hour<17 else random.uniform(12,16)
        if ch=="Voicemail": frh+=1
        fr=rec+dt.timedelta(hours=frh)
        resh=frh+abs(random.gauss(14 if cat not in("Payment / refund","Complaint") else 30,14))
        res=rec+dt.timedelta(hours=resh)
        status="Resolved"
        if fr>now: fr=None
        if res>now or random.random()<0.02:
          res=None; status="Open"
        rows.append([f"R{i:04d}",c,ch,cat,rec.strftime("%Y-%m-%d %H:%M"),fr.strftime("%Y-%m-%d %H:%M") if fr else "",res.strftime("%Y-%m-%d %H:%M") if res else "",status,round(frh,1) if fr else "",round(resh,1) if res else ""]);i+=1
  d+=dt.timedelta(days=1)
with open(P("requests.csv"),"w",newline="") as f:
  wr=csv.writer(f);wr.writerow(["id","client","channel","category","received","first_response","resolved","status","hours_to_first_response","hours_to_resolve"]);wr.writerows(rows)
dl=[("Riverbend YSC","Spring rec registration opens","2026-12-01"),("Riverbend YSC","Sponsor renewal letters sent","2026-10-15"),("Riverbend YSC","Fall end-of-season survey sent","2026-11-12"),
("Harbor Point Volleyball","Club season tryouts","2026-10-24"),("Harbor Point Volleyball","Region membership renewals","2026-10-31"),("Harbor Point Volleyball","Uniform order placed","2026-11-06"),
("Live Oak Baseball League","Spring registration early-bird ends","2026-10-20"),("Live Oak Baseball League","Field permit applications","2026-11-01"),("Live Oak Baseball League","Board budget report","2026-10-27"),
("Marsh Hawks Lacrosse","Fall ball final game","2026-10-18"),("Marsh Hawks Lacrosse","Winter clinic registration opens","2026-10-16"),
("Tidewater Hoops","Winter league schedules published","2026-10-22"),("Tidewater Hoops","Coach background checks complete","2026-10-19"),("Tidewater Hoops","Tournament entry deadline","2026-10-14"),
("Riverbend YSC","Holiday tournament entries","2026-10-30")]
with open(P("deadlines.csv"),"w",newline="") as f:
  wr=csv.writer(f);wr.writerow(["client","task","due"]);wr.writerows(sorted(dl,key=lambda x:x[2]))
reg=[]
targets={"Riverbend YSC":(410,400),"Harbor Point Volleyball":(170,185),"Live Oak Baseball League":(300,320),"Marsh Hawks Lacrosse":(120,98),"Tidewater Hoops":(220,240)}
for c,(last,this) in targets.items():
  for wk in range(1,9):
    f_last=last*(1-(1-wk/8)**1.6); f_this=this*(1-(1-wk/8)**1.6)
    if wk<=6: reg.append([c,wk,round(f_this+random.uniform(-4,4)),round(f_last)])
    else: reg.append([c,wk,"",round(f_last)])
with open(P("registrations.csv"),"w",newline="") as f:
  wr=csv.writer(f);wr.writerow(["client","week_of_registration","this_season","last_season"]);wr.writerows(reg)
with open(P("clients.csv"),"w",newline="") as f:
  wr=csv.writer(f);wr.writerow(["client","sport","platform","players"]);wr.writerows(clients)
print(len(rows))
