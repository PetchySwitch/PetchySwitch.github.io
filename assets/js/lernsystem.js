
(function(){
 const C=window.MODULE_CONFIG,D=window.MODULE_DATA;
 document.documentElement.style.setProperty("--a",C.a);document.documentElement.style.setProperty("--b",C.b);
 const key="campus:"+C.id;
 const defaults={version:4,readTopics:[],cardLevels:{},donePlan:[],quizOK:0,quizN:0,notes:"",lastTab:"dashboard",lastActivity:null,examHistory:[],custom:{topics:[],flashcards:[],quiz:[],plan:[]},edits:{topics:{},flashcards:{},quiz:{},plan:{}},deleted:{topics:[],flashcards:[],quiz:[],plan:[]},favorites:{topics:[],flashcards:[],quiz:[]},cardReview:{},mistakes:{},trash:[]};
 let S={...defaults};try{S={...defaults,...JSON.parse(localStorage.getItem(key)||"{}")}}catch(e){}
 if(Array.isArray(S.knownCards)){S.knownCards.forEach(id=>S.cardLevels[id]=3);delete S.knownCards}

 S.custom=S.custom||{};S.edits=S.edits||{};S.deleted=S.deleted||{};S.cardLevels=S.cardLevels||{};S.readTopics=S.readTopics||[];S.donePlan=S.donePlan||[];S.examHistory=S.examHistory||[];
 const kinds=["topics","flashcards","quiz","plan"]; S.favorites=S.favorites||{topics:[],flashcards:[],quiz:[]};S.cardReview=S.cardReview||{};S.mistakes=S.mistakes||{};S.trash=S.trash||[];["topics","flashcards","quiz"].forEach(k=>S.favorites[k]=S.favorites[k]||[]);
 kinds.forEach(k=>{S.custom[k]=S.custom[k]||[];S.edits[k]=S.edits[k]||{};S.deleted[k]=S.deleted[k]||[]});
 const base={topics:[...(D.topics||[])],flashcards:[...(D.flashcards||[])],quiz:[...(D.quiz||[])],plan:[...(D.plan||[])]};
 function merged(k){return base[k].filter(x=>!S.deleted[k].includes(x.id)).map(x=>({...x,...(S.edits[k][x.id]||{}),_source:"base"})).concat(S.custom[k].map(x=>({...x,_source:"custom"})))}
 function refreshData(){D.topics=merged("topics");D.flashcards=merged("flashcards");D.quiz=merged("quiz");D.plan=merged("plan")}
 refreshData();

 const save=()=>{S.lastActivity=new Date().toISOString();try{localStorage.setItem(key,JSON.stringify(S))}catch(e){alert("Speichern fehlgeschlagen. Bitte exportiere ein Backup.")}}
 const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const lvl=id=>Number(S.cardLevels[id]||0), labels=["Neu","Unsicher","Okay","Sicher"];
 const pct=()=>{let a=D.topics.length?S.readTopics.length/D.topics.length:0,b=D.flashcards.length?Object.values(S.cardLevels).filter(x=>x>=3).length/D.flashcards.length:0,c=S.quizN?S.quizOK/S.quizN:0;let parts=[D.topics.length&&a,D.flashcards.length&&b,S.quizN&&c].filter(x=>x!==false);return parts.length?Math.round(parts.reduce((x,y)=>x+y,0)/parts.length*100):0}
 function filterUI(kind){const arr=D[kind]||[],lecs=[...new Set(arr.map(x=>x.lecture).filter(Boolean))],chaps=[...new Set(arr.map(x=>x.chapter).filter(Boolean))];return `<div class="filters"><input data-search="${kind}" placeholder="Suchen …"><select data-lecture="${kind}"><option value="">Alle Vorlesungen</option>${lecs.map(x=>`<option>${esc(x)}</option>`).join("")}</select><select data-chapter="${kind}"><option value="">Alle Kapitel</option>${chaps.map(x=>`<option>${esc(x)}</option>`).join("")}</select><select data-difficulty="${kind}"><option value="">Alle Schwierigkeiten</option><option>leicht</option><option>mittel</option><option>schwer</option></select>${kind==="flashcards"?`<select data-status="${kind}"><option value="">Alle Lernstände</option><option value="due">Heute fällig</option><option value="safe">Sicher</option><option value="fav">Favoriten</option></select>`:kind==="quiz"?`<select data-status="${kind}"><option value="">Alle Status</option><option value="mistake">Meine Fehler</option><option value="fav">Favoriten</option></select>`:""}</div>`}


 function filtered(kind){
  const arr=D[kind]||[],q=(document.querySelector(`[data-search="${kind}"]`)?.value||"").toLowerCase(),lec=document.querySelector(`[data-lecture="${kind}"]`)?.value||"",chap=document.querySelector(`[data-chapter="${kind}"]`)?.value||"",diff=document.querySelector(`[data-difficulty="${kind}"]`)?.value||"",stat=document.querySelector(`[data-status="${kind}"]`)?.value||"";
  return arr.filter(x=>(!q||JSON.stringify(x).toLowerCase().includes(q))&&(!lec||x.lecture===lec)&&(!chap||x.chapter===chap)&&(!diff||x.difficulty===diff)&&(!stat||(kind==="flashcards"?(stat==="due"?dueCard(x.id):stat==="safe"?lvl(x.id)>=3:stat==="fav"?fav("flashcards",x.id):true):(stat==="mistake"?(S.mistakes[x.id]||0)>0:stat==="fav"?fav("quiz",x.id):true))))
 }
 function readiness(){let a=D.topics.length?S.readTopics.filter(id=>D.topics.some(x=>x.id===id)).length/D.topics.length:0,b=D.flashcards.length?D.flashcards.filter(x=>lvl(x.id)>=3).length/D.flashcards.length:0,c=S.quizN?S.quizOK/S.quizN:0;return Math.round((a+b+c)/3*100)}
 function exportModule(){let p={schema:"semester-campus-module",version:3,module:C.id,exportedAt:new Date().toISOString(),state:S},a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:"application/json"}));a.download=C.id+"-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
 function importModule(file){let r=new FileReader();r.onload=()=>{try{let x=JSON.parse(r.result);if(x.schema!=="semester-campus-module"||x.module!==C.id||!x.state||typeof x.state!=="object"||Array.isArray(x.state))throw Error("Ungültiges Backup oder falsches Modul");if(x.state.custom&&(!["topics","flashcards","quiz","plan"].every(k=>!x.state.custom[k]||Array.isArray(x.state.custom[k]))))throw Error("Ungültige Inhaltsdaten");if(!confirm("Der bisherige Lernstand dieses Moduls wird überschrieben. Fortfahren?"))return;localStorage.setItem(key,JSON.stringify(x.state));alert("Backup importiert. Seite wird neu geladen.");location.reload()}catch(err){alert("Import fehlgeschlagen: "+err.message)}};r.readAsText(file)}
 function manageBar(k,id){return `<div class="toolbar" style="margin-top:10px"><button class="btn" data-inlineedit="${esc(k)}" data-inlineid="${esc(id)}">✏️ Bearbeiten</button><button class="btn danger" data-inlinedelete="${esc(k)}" data-inlineid="${esc(id)}">Löschen</button></div>`}
 function addBar(k,label){return `<button class="btn primary" data-inlineadd="${k}">＋ ${label}</button>`}
 function openInlineEditor(k,id=null){editorKind=k;editingId=id;render("editor");setTimeout(()=>document.getElementById("editorForm")?.scrollIntoView({behavior:"smooth",block:"start"}),0)}

 function fav(k,id){return (S.favorites[k]||[]).includes(id)}
 function favBtn(k,id){return `<button class="star" title="Favorit" data-favkind="${k}" data-favid="${esc(id)}">${fav(k,id)?"★":"☆"}</button>`}
 function toggleFav(k,id){let a=S.favorites[k]||[];S.favorites[k]=a.includes(id)?a.filter(x=>x!==id):[...a,id];save();render(S.lastTab)}
 function dueCard(id){let r=S.cardReview[id];return !r||!r.due||new Date(r.due)<=new Date()}
 function setReview(id,level){let days=[0,1,3,7][level]||0,d=new Date();d.setDate(d.getDate()+days);S.cardReview[id]={level,due:d.toISOString(),last:new Date().toISOString()}}
 function lectures(){return [...new Set([...D.topics,...D.flashcards,...D.quiz].map(x=>x.lecture).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))}
 function lectureNav(){let ls=lectures();return ls.length?`<div><h3>Vorlesungen</h3><div class="vl-grid">${ls.map(l=>{let t=D.topics.filter(x=>x.lecture===l),n=t.filter(x=>S.readTopics.includes(x.id)).length;return `<div class="vl-card" data-golec="${esc(l)}"><b>${esc(l)}</b><div class="muted">${t.length} Themen · ${t.length?Math.round(n/t.length*100):0}% bearbeitet</div></div>`}).join("")}</div></div>`:""}
 function mistakesView(){let a=D.quiz.filter(q=>(S.mistakes[q.id]||0)>0);return `<div class="panel"><h2>🎯 Meine Fehler</h2>${a.length?a.map(q=>`<div class="item"><b>${esc(q.q)}</b><div class="muted">Fehlerstand: ${S.mistakes[q.id]}</div>${manageBar("quiz",q.id)}</div>`).join(""):'<div class="empty">Keine offenen Fehlerfragen. 🎉</div>'}</div>`}
 function trashView(){return `<div class="panel"><h2>🗑️ Papierkorb</h2>${S.trash.length?S.trash.map((x,i)=>`<div class="trash-item"><div><b>${esc(itemTitle(x.kind,x.item))}</b><div class="muted">${kindNames[x.kind]}</div></div><div><button class="btn" data-restore="${i}">Wiederherstellen</button> <button class="btn danger" data-purge="${i}">Endgültig löschen</button></div></div>`).join(""):'<div class="empty">Papierkorb ist leer.</div>'}</div>`}
 function selfCheck(){let a=[],seen=new Set();kinds.forEach(k=>merged(k).forEach(x=>{if(seen.has(x.id))a.push("Doppelte ID: "+x.id);seen.add(x.id)}));merged("flashcards").forEach(x=>{if(!x.front||!x.back)a.push("Unvollständige Karte: "+x.id)});merged("quiz").forEach(x=>{if(!x.q||!Array.isArray(x.options)||x.options.length<2||x.correct<0||x.correct>=x.options.length)a.push("Ungültige Quizfrage: "+x.id)});return a}

 function dashboard(){
  const safe=Object.values(S.cardLevels).filter(x=>x>=3).length, due=Object.values(S.cardLevels).filter(x=>x<3).length;
  return `<div class="panel"><div class="section-title"><h2>Dashboard</h2><div class="toolbar"><button class="btn" data-exportmodule>Modul exportieren</button><label class="btn">Modul importieren<input hidden type="file" accept=".json" data-importmodule></label></div></div><div class="stats"><div class="stat"><b>${pct()}%</b>Lernfortschritt</div><div class="stat"><b>${S.readTopics.length}/${D.topics.length}</b>Stoff bearbeitet</div><div class="stat"><b>${safe}/${D.flashcards.length}</b>Karten sicher</div><div class="stat"><b>${S.quizN?Math.round(S.quizOK/S.quizN*100):0}%</b>Quizleistung</div></div><div class="progress"><i style="width:${pct()}%"></i></div>
  <div class="stats"><div class="stat"><b>${readiness()}%</b>Prüfungsstand</div><div class="stat"><b>${D.flashcards.filter(x=>dueCard(x.id)).length}</b>Fällige Karten</div><div class="stat"><b>${Object.values(S.mistakes).filter(n=>n>0).length}</b>Fehlerfragen</div></div>${lectureNav()}<div class="resume"><div><b>Heute lernen</b><div class="muted">${D.flashcards.length?`${due||D.flashcards.length} Karten sind noch nicht sicher.`:"Sobald Inhalte vorhanden sind, erscheinen hier Empfehlungen."}</div></div><button class="btn primary" data-study>Wiederholen →</button></div></div>`
 }
 function topics(){return `<div class="panel"><div class="section-title"><h2>Lernthemen</h2>${addBar("topics","Lernthema")}</div>${filterUI("topics")}<div id="topicList">${renderTopics(D.topics)}</div></div>`}
 function renderTopics(items){return items.length?items.map(x=>`<div class="item" data-item data-id="${esc(x.id)}" data-chap="${esc(x.chapter||"")}" data-text="${esc((x.title+" "+x.summary+" "+(x.tags||[]).join(" ")).toLowerCase())}" data-lec="${esc(x.lecture||"")}" data-diff="${esc(x.difficulty||"")}"><span class="badge">${esc(x.lecture||"Allgemein")} · ${esc(x.chapter||"")}</span><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p><label><input type="checkbox" data-topic="${esc(x.id)}" ${S.readTopics.includes(x.id)?"checked":""}> Bearbeitet</label>${favBtn("topics",x.id)}${manageBar("topics",x.id)}</div>`).join(""):`<div class="empty">Noch keine Lernthemen hinterlegt.</div>`}
 let cardSession=[],cardPos=0;
 function cards(){return `<div class="panel"><div class="section-title"><h2>Karteikarten</h2><div class="toolbar">${addBar("flashcards","Karteikarte")}<button class="btn primary" data-startcards>Lernsitzung starten</button></div></div>${filterUI("flashcards")}<div id="cardOverview">${D.flashcards.length?D.flashcards.map(x=>`<div class="item" data-item data-id="${esc(x.id)}" data-text="${esc((x.front+" "+x.back+" "+(x.tags||[]).join(" ")).toLowerCase())}" data-lec="${esc(x.lecture||"")}" data-chap="${esc(x.chapter||"")}" data-diff="${esc(x.difficulty||"")}"><b>${esc(x.front)}</b><div class="muted">${esc(x.lecture||"")} · ${labels[lvl(x.id)]}</div>${favBtn("flashcards",x.id)}${manageBar("flashcards",x.id)}</div>`).join(""):`<div class="empty">Noch keine Karteikarten hinterlegt.</div>`}</div></div>`}
 function startCards(){cardSession=[...filtered("flashcards")].sort((a,b)=>(Number(dueCard(b.id))-Number(dueCard(a.id)))||(lvl(a.id)-lvl(b.id)));cardPos=0;if(!cardSession.length){alert("Keine passenden Karteikarten vorhanden.");return}showCard()}
 function showCard(){const x=cardSession[cardPos];document.getElementById("content").innerHTML=x?`<div class="panel"><div class="sessionbar"><b>Karte ${cardPos+1}/${cardSession.length}</b><button class="btn" data-endcards>Beenden</button></div><div class="flashcard" data-flip><div class="front"><span class="badge">${labels[lvl(x.id)]}</span><h2>${esc(x.front)}</h2><p class="muted">Zum Aufdecken klicken</p></div><div class="answer"><h2>${esc(x.back)}</h2><p class="muted">Wie sicher war deine Antwort?</p></div></div><div class="rating"><button class="btn" data-rate="1">Unsicher</button><button class="btn" data-rate="2">Okay</button><button class="btn primary" data-rate="3">Sicher</button><button class="btn" data-rate="0">Nochmal</button></div></div>`:`<div class="panel"><h2>Sitzung geschafft</h2><p>Alle ausgewählten Karten wurden bearbeitet.</p><button class="btn primary" data-tab="cards">Zur Übersicht</button></div>`}
 let quizSession=[],quizPos=0,quizScore=0;
 function quiz(){return `<div class="panel"><div class="section-title"><h2>Quiz</h2>${addBar("quiz","Quizfrage")}</div><p class="muted">Direktes Feedback nach jeder Frage.</p>${filterUI("quiz")}<button class="btn primary" data-startquiz ${D.quiz.length?"":"disabled"}>Quiz-Sitzung starten</button><div style="margin-top:16px">${D.quiz.length?D.quiz.map(x=>`<div class="item" data-item data-id="${esc(x.id)}" data-text="${esc((x.q+" "+(x.tags||[]).join(" ")).toLowerCase())}" data-lec="${esc(x.lecture||"")}" data-chap="${esc(x.chapter||"")}" data-diff="${esc(x.difficulty||"")}"><b>${esc(x.q)}</b><div class="muted">${esc(x.lecture||"")} · ${esc(x.chapter||"")}</div>${favBtn("quiz",x.id)}${manageBar("quiz",x.id)}</div>`).join(""):`<div class="empty">Noch keine Quizfragen hinterlegt.</div>`}</div></div>`}
 function startQuiz(){quizSession=[...filtered("quiz")].sort(()=>Math.random()-.5);quizPos=0;quizScore=0;if(!quizSession.length){alert("Keine passenden Quizfragen vorhanden.");return}showQuiz()}
 function showQuiz(){let q=quizSession[quizPos];document.getElementById("content").innerHTML=q?`<div class="panel"><div class="sessionbar"><b>Frage ${quizPos+1}/${quizSession.length}</b><span>${quizScore} richtig</span></div><h2>${esc(q.q)}</h2>${q.options.map((o,i)=>`<button class="btn option" data-quizanswer="${i}">${esc(o)}</button>`).join("")}</div>`:`<div class="panel"><h2>Quiz beendet</h2><div class="stat"><b>${quizSession.length?Math.round(quizScore/quizSession.length*100):0}%</b>${quizScore}/${quizSession.length} richtig</div><button class="btn primary" data-tab="quiz">Zurück</button></div>`}
 let exam=[],examPos=0,examAnswers={};
 function examView(){let lecs=[...new Set(D.quiz.map(x=>x.lecture).filter(Boolean))],chaps=[...new Set(D.quiz.map(x=>x.chapter).filter(Boolean))];return `<div class="panel"><h2>Schriftlicher Prüfungsmodus</h2><p>Keine Lösungen während der Prüfung. Die Auswertung erscheint erst am Ende.</p><div class="exam-config"><label>Fragen<input id="examCount" type="number" min="1" max="100" value="${Math.min(20,Math.max(1,D.quiz.length))}"></label><label>Vorlesung<select id="examLecture"><option value="">Alle</option>${lecs.map(x=>`<option>${esc(x)}</option>`).join("")}</select></label><label>Kapitel<select id="examChapter"><option value="">Alle</option>${chaps.map(x=>`<option>${esc(x)}</option>`).join("")}</select></label><label>Auswahl<select id="examStatus"><option value="">Alle Fragen</option><option value="mistake">Nur Fehlerfragen</option><option value="fav">Nur Favoriten</option><option value="hard">Nur schwer</option></select></label></div><button class="btn primary" data-startexam ${D.quiz.length?"":"disabled"}>Prüfung starten</button>${D.quiz.length?"":`<div class="empty">Noch keine prüfungsfähigen Fragen vorhanden.</div>`}</div>`}
 function startExam(){let lec=document.getElementById("examLecture")?.value||"",chap=document.getElementById("examChapter")?.value||"",stat=document.getElementById("examStatus")?.value||"",cnt=Math.max(1,+(document.getElementById("examCount")?.value||20));exam=D.quiz.filter(x=>(!lec||x.lecture===lec)&&(!chap||x.chapter===chap)&&(!stat||(stat==="mistake"?(S.mistakes[x.id]||0)>0:stat==="fav"?fav("quiz",x.id):stat==="hard"?x.difficulty==="schwer":true))).sort(()=>Math.random()-.5).slice(0,cnt);if(!exam.length){alert("Für diese Auswahl gibt es keine Fragen.");return}examPos=0;examAnswers={};showExam()}
 function showExam(){let q=exam[examPos];if(!q)return finishExam();document.getElementById("content").innerHTML=`<div class="panel"><div class="sessionbar"><b>Prüfungsfrage ${examPos+1}/${exam.length}</b><span>${Object.keys(examAnswers).length} beantwortet</span></div><h2>${esc(q.q)}</h2>${q.options.map((o,i)=>`<button class="btn option ${examAnswers[q.id]===i?"selected":""}" data-examanswer="${i}">${esc(o)}</button>`).join("")}<button class="btn primary" data-examnext>${examPos===exam.length-1?"Abgeben":"Weiter →"}</button></div>`}
 function finishExam(){let score=exam.filter(q=>examAnswers[q.id]===q.correct).length;S.examHistory.push({date:new Date().toISOString(),score,total:exam.length});save();document.getElementById("content").innerHTML=`<div class="panel"><h2>Prüfungsauswertung</h2><div class="stat"><b>${exam.length?Math.round(score/exam.length*100):0}%</b>${score}/${exam.length} richtig</div>${exam.map(q=>`<div class="item ${examAnswers[q.id]===q.correct?"result-good":"result-bad"}"><b>${esc(q.q)}</b><p>${examAnswers[q.id]===q.correct?"Richtig":"Falsch"} · ${esc(q.explanation||"")}</p></div>`).join("")}<button class="btn primary" data-tab="exam">Zurück</button></div>`}
 function plan(){return `<div class="panel"><div class="section-title"><h2>Lernplan</h2>${addBar("plan","Eintrag")}</div>${D.plan.length?D.plan.map(x=>`<div class="item"><label><input type="checkbox" data-plan="${esc(x.id)}" ${S.donePlan.includes(x.id)?"checked":""}> <b>${esc(x.when)}</b> – ${esc(x.task)}</label>${manageBar("plan",x.id)}</div>`).join(""):`<div class="empty">Noch kein Lernplan hinterlegt.</div>`}</div>`}
 function notes(){return `<div class="panel"><h2>Notizen</h2><textarea id="notes" style="width:100%;min-height:300px;border:1px solid #dfe3ea;border-radius:14px;padding:14px;font:inherit">${esc(S.notes)}</textarea></div>`}

 let editorKind="topics", editingId=null, editorReturnTab="editor";
 const kindNames={topics:"Lernthemen",flashcards:"Karteikarten",quiz:"Quizfragen",plan:"Lernplan"};
 function uid(k){return "user-"+k+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7)}
 function fields(k,x={}){
  const common=`<input name="lecture" placeholder="Vorlesung, z. B. Vorlesung 03" value="${esc(x.lecture||"")}"><input name="chapter" placeholder="Kapitel" value="${esc(x.chapter||"")}">`;
  const meta=`<input name="tags" placeholder="Tags, mit Komma getrennt" value="${esc((x.tags||[]).join(", "))}"><select name="difficulty"><option value="">Schwierigkeit</option>${["leicht","mittel","schwer"].map(v=>`<option ${x.difficulty===v?"selected":""}>${v}</option>`).join("")}</select>`;
  if(k==="topics")return common+`<input class="wide" required name="title" placeholder="Titel" value="${esc(x.title||"")}"><textarea class="wide" required name="summary" placeholder="Lerninhalt / Zusammenfassung">${esc(x.summary||"")}</textarea>`+meta;
  if(k==="flashcards")return common+`<textarea class="wide" required name="front" placeholder="Vorderseite / Frage">${esc(x.front||"")}</textarea><textarea class="wide" required name="back" placeholder="Rückseite / Antwort">${esc(x.back||"")}</textarea>`+meta;
  if(k==="quiz")return common+`<textarea class="wide" required name="q" placeholder="Quizfrage">${esc(x.q||"")}</textarea><input class="wide" required name="options" placeholder="Antworten mit | trennen, z. B. A | B | C | D" value="${esc((x.options||[]).join(" | "))}"><input name="correct" type="number" min="1" placeholder="Richtige Antwort Nr." value="${x.correct!==undefined?x.correct+1:""}"><input name="explanation" placeholder="Erklärung" value="${esc(x.explanation||"")}">`+meta;
  return `<input name="when" placeholder="Zeitpunkt / Woche" value="${esc(x.when||"")}"><input name="lecture" placeholder="Vorlesung" value="${esc(x.lecture||"")}"><textarea class="wide" required name="task" placeholder="Aufgabe">${esc(x.task||"")}</textarea><input name="chapter" placeholder="Kapitel" value="${esc(x.chapter||"")}">`;
 }
 function itemTitle(k,x){return k==="topics"?x.title:k==="flashcards"?x.front:k==="quiz"?x.q:x.task}
 function editor(){
  const arr=merged(editorKind), current=editingId?arr.find(x=>x.id===editingId):null;
  return `<div class="panel">${selfCheck().length?`<div class="warning"><b>Inhaltsprüfung:</b><br>${selfCheck().map(esc).join("<br>")}</div>`:`<div class="okbox">✓ Inhaltsprüfung ohne Auffälligkeiten</div>`}<div class="section-title"><div><h2>Inhalte bearbeiten</h2><p class="muted">Eigene Inhalte hinzufügen oder bestehende Inhalte anpassen.</p></div><span class="badge">${arr.length} Einträge</span></div>
  <div class="editor-grid"><div class="editor-nav">${kinds.map(k=>`<button class="btn ${editorKind===k?"primary":""}" data-editkind="${k}">${kindNames[k]}</button>`).join("")}</div>
  <div><h3>${current?"Eintrag bearbeiten":"Neuen Eintrag hinzufügen"}</h3><form id="editorForm" class="editor-form">${fields(editorKind,current||{})}<div class="wide toolbar"><button class="btn primary" type="submit">${current?"Änderungen speichern":"Hinzufügen"}</button>${current?'<button class="btn" type="button" data-canceledit>Abbrechen</button>':""}</div></form>
  <hr><h3>Vorhandene ${kindNames[editorKind]}</h3>${arr.length?arr.map(x=>`<div class="edit-row"><div><b>${esc(itemTitle(editorKind,x))}</b><div class="muted small">${esc(x.lecture||"")} ${x.chapter?"· "+esc(x.chapter):""} <span class="source-badge">${x._source==="custom"?"selbst erstellt":"Kursinhalt"}</span></div></div><div class="edit-actions"><button class="btn" data-editid="${esc(x.id)}">Bearbeiten</button><button class="btn danger" data-deleteid="${esc(x.id)}">Löschen</button></div></div>`).join(""):'<div class="empty">Noch keine Einträge vorhanden.</div>'}</div></div></div>`
 }
 function formObject(k,fd){
  let x={lecture:(fd.get("lecture")||"").trim(),chapter:(fd.get("chapter")||"").trim()};
  if(k==="topics")Object.assign(x,{title:fd.get("title").trim(),summary:fd.get("summary").trim()});
  if(k==="flashcards")Object.assign(x,{front:fd.get("front").trim(),back:fd.get("back").trim()});
  if(k==="quiz"){let opts=fd.get("options").split("|").map(v=>v.trim()).filter(Boolean),cor=Math.max(0,(parseInt(fd.get("correct"))||1)-1);Object.assign(x,{q:fd.get("q").trim(),options:opts,correct:Math.min(cor,Math.max(0,opts.length-1)),explanation:(fd.get("explanation")||"").trim()})}
  if(k==="plan")Object.assign(x,{when:(fd.get("when")||"").trim(),task:fd.get("task").trim()});
  if(k!=="plan")Object.assign(x,{tags:(fd.get("tags")||"").split(",").map(v=>v.trim()).filter(Boolean),difficulty:fd.get("difficulty")||""});
  return x
 }
 function upsertEditor(fd){
  const obj=formObject(editorKind,fd);
  if(editingId){
   const ci=S.custom[editorKind].findIndex(x=>x.id===editingId);
   if(ci>=0)S.custom[editorKind][ci]={...S.custom[editorKind][ci],...obj};
   else S.edits[editorKind][editingId]={...(S.edits[editorKind][editingId]||{}),...obj};
  }else S.custom[editorKind].push({id:uid(editorKind),...obj});
  editingId=null;save();refreshData();render(editorReturnTab)
 }
 function deleteEditor(id){
  if(!confirm("Diesen Eintrag wirklich löschen?"))return;
  const cur=merged(editorKind).find(x=>x.id===id);if(cur)S.trash.push({kind:editorKind,item:{...cur},wasCustom:cur._source==="custom",deletedAt:new Date().toISOString(),progress:{level:S.cardLevels[id],review:S.cardReview[id],read:S.readTopics.includes(id),done:S.donePlan.includes(id)}});
  const ci=S.custom[editorKind].findIndex(x=>x.id===id);
  if(ci>=0)S.custom[editorKind].splice(ci,1); else {if(!S.deleted[editorKind].includes(id))S.deleted[editorKind].push(id);delete S.edits[editorKind][id]}
  delete S.cardLevels[id];delete S.cardReview[id];S.readTopics=S.readTopics.filter(x=>x!==id);S.donePlan=S.donePlan.filter(x=>x!==id);
  editingId=null;save();refreshData();render(editorReturnTab)
 }

 const views={dashboard,topics,cards,quiz,exam:examView,plan,notes,editor,mistakes:mistakesView,trash:trashView};
 function render(n="dashboard"){if(!views[n])n="dashboard";S.lastTab=n;localStorage.setItem(key,JSON.stringify(S));document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===n));document.getElementById("content").innerHTML=views[n]()}
 function toggle(arr,id,on){let k=arr.indexOf(id);if(on&&k<0)arr.push(id);if(!on&&k>=0)arr.splice(k,1);save();render(S.lastTab)}
 function applyFilters(kind){let q=(document.querySelector(`[data-search="${kind}"]`)?.value||"").toLowerCase(),lec=document.querySelector(`[data-lecture="${kind}"]`)?.value||"",chap=document.querySelector(`[data-chapter="${kind}"]`)?.value||"",diff=document.querySelector(`[data-difficulty="${kind}"]`)?.value||"",stat=document.querySelector(`[data-status="${kind}"]`)?.value||"";document.querySelectorAll("[data-item]").forEach(el=>{let id=el.dataset.id||"",ok=(!q||(el.dataset.text||"").includes(q))&&(!lec||el.dataset.lec===lec)&&(!chap||el.dataset.chap===chap)&&(!diff||el.dataset.diff===diff);if(stat&&kind==="flashcards")ok=ok&&(stat==="due"?dueCard(id):stat==="safe"?lvl(id)>=3:stat==="fav"?fav("flashcards",id):true);if(stat&&kind==="quiz")ok=ok&&(stat==="mistake"?(S.mistakes[id]||0)>0:stat==="fav"?fav("quiz",id):true);el.style.display=ok?"":"none"}) }

 document.addEventListener("click",e=>{
  const t=e.target.closest("button,[data-flip],[data-golec]");
  if(!t)return;
  const d=t.dataset;
  if(d.tab){if(d.tab==="editor")editorReturnTab="editor";render(d.tab);return}
  if(d.study!==undefined){render("cards");return}
  if(d.exportmodule!==undefined){exportModule();return}
  if(d.inlineadd){editorReturnTab=S.lastTab;openInlineEditor(d.inlineadd);return}
  if(d.inlineedit){editorReturnTab=S.lastTab;openInlineEditor(d.inlineedit,d.inlineid);return}
  if(d.inlinedelete){editorReturnTab=S.lastTab;editorKind=d.inlinedelete;deleteEditor(d.inlineid);return}
  if(d.favid){toggleFav(d.favkind,d.favid);return}
  if(d.golec){render("topics");const sel=document.querySelector('[data-lecture="topics"]');if(sel){sel.value=d.golec;applyFilters("topics")}return}
  if(d.editkind){editorKind=d.editkind;editingId=null;render("editor");return}
  if(d.editid){editingId=d.editid;render("editor");return}
  if(d.deleteid){deleteEditor(d.deleteid);return}
  if(d.canceledit!==undefined){editingId=null;render("editor");return}
  if(d.restore!==undefined){const i=Number(d.restore),x=S.trash[i];if(!x)return;if(x.wasCustom){let y={...x.item};delete y._source;S.custom[x.kind].push(y)}else{S.deleted[x.kind]=S.deleted[x.kind].filter(id=>id!==x.item.id);let y={...x.item};delete y._source;S.edits[x.kind][x.item.id]=y}if(x.progress){if(x.progress.level!==undefined)S.cardLevels[x.item.id]=x.progress.level;if(x.progress.review)S.cardReview[x.item.id]=x.progress.review;if(x.progress.read)S.readTopics.push(x.item.id);if(x.progress.done)S.donePlan.push(x.item.id)}S.trash.splice(i,1);save();refreshData();render("trash");return}
  if(d.purge!==undefined){if(confirm("Eintrag endgültig löschen?")){S.trash.splice(Number(d.purge),1);save();render("trash")}return}
  if(d.startcards!==undefined){startCards();return}
  if(d.endcards!==undefined){render("cards");return}
  if(d.flip!==undefined){t.classList.toggle("flipped");return}
  if(d.rate!==undefined){const x=cardSession[cardPos];if(!x)return;const level=Number(d.rate);S.cardLevels[x.id]=level;setReview(x.id,level);save();if(level===0&&cardSession.length<500)cardSession.push(x);cardPos++;showCard();return}
  if(d.startquiz!==undefined){startQuiz();return}
  if(d.quizanswer!==undefined){const q=quizSession[quizPos];if(!q)return;const ok=Number(d.quizanswer)===q.correct;S.quizN++;if(ok){quizScore++;S.quizOK++;S.mistakes[q.id]=Math.max(0,(S.mistakes[q.id]||0)-1)}else S.mistakes[q.id]=(S.mistakes[q.id]||0)+1;save();alert(ok?"Richtig!"+(q.explanation?" "+q.explanation:""):"Nicht ganz. "+(q.explanation||("Richtig: "+q.options[q.correct])));quizPos++;showQuiz();return}
  if(d.startexam!==undefined){startExam();return}
  if(d.examanswer!==undefined){const q=exam[examPos];if(!q)return;examAnswers[q.id]=Number(d.examanswer);showExam();return}
  if(d.examnext!==undefined){examPos++;showExam();return}
 });
 document.addEventListener("change",e=>{
  const t=e.target,d=t.dataset;
  if(d.topic!==undefined){toggle(S.readTopics,d.topic,t.checked);return}
  if(d.plan!==undefined){toggle(S.donePlan,d.plan,t.checked);return}
  if(d.importmodule!==undefined&&t.files?.[0]){importModule(t.files[0]);return}
  for(const kind of ["topics","flashcards","quiz"]){if(d.lecture===kind||d.chapter===kind||d.difficulty===kind||d.status===kind){applyFilters(kind);return}}
 });
 document.addEventListener("input",e=>{
  const t=e.target,d=t.dataset;
  if(t.id==="notes"){S.notes=t.value;save();return}
  if(d.search!==undefined)applyFilters(d.search);
 });
 document.addEventListener("submit",e=>{
  if(e.target.id==="editorForm"){e.preventDefault();upsertEditor(new FormData(e.target))}
 });

 document.addEventListener("DOMContentLoaded",()=>{document.getElementById("moduleTitle").textContent=C.name;document.getElementById("moduleIcon").textContent=C.icon;render(S.lastTab||"dashboard")});
})();
