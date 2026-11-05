
const MODS = [
 {id:"bioprozesstechnik",name:"Biologische Prozess- und Chemische Reaktionstechnik",icon:"🧪",a:"#0f8f78",b:"#38b99c"},
 {id:"energiewandlung",name:"Energiewandlung und -speicherung",icon:"⚡",a:"#d97706",b:"#f2b84b"},
 {id:"prozess-leittechnik",name:"Prozess- und Leittechnik",icon:"⚙️",a:"#2563b8",b:"#5592dc"},
 {id:"wirtschaftsrecht",name:"Wirtschaftsrecht",icon:"⚖️",a:"#7c3f8c",b:"#ad70bb"},
 {id:"energieeffizienz",name:"Energieeffizienz",icon:"🌿",a:"#ca3e73",b:"#ec7aa5"}
];
const emptyState=()=>({version:2,readTopics:[],knownCards:[],donePlan:[],quizOK:0,quizN:0,notes:"",lastTab:"dashboard",lastActivity:null});
function parse(x,f={}){try{return {...f,...JSON.parse(x||"{}")}}catch(e){return f}}
function stateFor(id){return parse(localStorage.getItem("campus:"+id),emptyState())}
function stats(id){
 const s=stateFor(id); return {topics:s.readTopics.length,cards:Object.values(s.cardLevels||{}).filter(x=>Number(x)>=3).length,plan:s.donePlan.length,quiz:s.quizN?Math.round(s.quizOK/s.quizN*100):0,last:s.lastActivity}
}
function exportAll(){
 const data={schema:"semester-campus-backup",version:4,exportedAt:new Date().toISOString(),modules:{}};
 MODS.forEach(m=>data.modules[m.id]=stateFor(m.id));
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="Semester-Lerncampus_Backup.json";a.click();URL.revokeObjectURL(a.href)
}
function importAll(file){
 const r=new FileReader();r.onload=()=>{
  try{
   const x=JSON.parse(r.result);
   if(x.schema!=="semester-campus-backup"||!x.modules)throw new Error();
   MODS.forEach(m=>{if(x.modules[m.id])localStorage.setItem("campus:"+m.id,JSON.stringify({...emptyState(),...x.modules[m.id]}))});
   alert("Backup erfolgreich importiert.");renderCampus()
  }catch(e){alert("Dieses Backup ist ungültig oder nicht kompatibel.")}
 };r.readAsText(file)
}
function renderCampus(){
 const el=document.getElementById("modules");
 let totalTopics=0,totalCards=0,totalQuiz=0,active=0;
 el.innerHTML=MODS.map(m=>{
   const s=stats(m.id); totalTopics+=s.topics;totalCards+=s.cards;totalQuiz+=s.quiz;if(s.last)active++;
   return `<a class="module" href="module/${m.id}/index.html" style="background:linear-gradient(135deg,${m.a},${m.b})">
     <div class="icon">${m.icon}</div><h2>${m.name}</h2>
     <div class="module-meta"><span class="pill">${s.topics} Themen gelesen</span><span class="pill">${s.cards} Karten sicher</span><span class="pill">${s.quiz}% Quiz</span></div>
     <div class="progress"><i style="width:${Math.min(100,(s.topics+s.cards+s.plan)*5)}%"></i></div>
   </a>`
 }).join("");
 document.getElementById("semesterStats").innerHTML=`<div class="stat"><b>${active}/5</b>Module begonnen</div><div class="stat"><b>${totalTopics}</b>Themen gelesen</div><div class="stat"><b>${totalCards}</b>Karten sicher</div><div class="stat"><b>${Math.round(totalQuiz/5)}%</b>Ø Quizquote</div>`;
}
document.addEventListener("DOMContentLoaded",()=>{
 renderCampus();
 document.getElementById("backupExport").onclick=exportAll;
 document.getElementById("backupImport").onchange=e=>{if(e.target.files[0])importAll(e.target.files[0]);e.target.value=""}
});
