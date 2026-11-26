(function(){
var app=document.getElementById('app');
var SIZES=[2,3,2,3,3];
var MAX_REF=5;
var KEY='resistance-state';
var st={step:'board',missions:[null,null,null,null,null],refusals:0,i:0,votes:[],sel:null,arm:false,last:null};
try{
 var sv=JSON.parse(localStorage.getItem(KEY)||'null');
 if(sv&&sv.missions&&sv.missions.length===5){st.missions=sv.missions;st.refusals=sv.refusals||0}
}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify({missions:st.missions,refusals:st.refusals}))}catch(e){}}
function h(html){app.innerHTML=html}
function $(id){return document.getElementById(id)}
function count(v){return st.missions.filter(function(m){return m===v}).length}
function cur(){return st.missions.indexOf(null)}
function spiesWinByRefusal(){return st.refusals>=MAX_REF}
function over(){return count('s')>=3||count('f')>=3||spiesWinByRefusal()||cur()===-1}
function resistanceWon(){return !spiesWinByRefusal()&&count('s')>=3}
function total(){return SIZES[cur()]}
function reset(){st.missions=[null,null,null,null,null];st.refusals=0;st.arm=false;save()}
function boardHtml(){
 var c=cur(),o='<div class="board">';
 for(var k=0;k<5;k++){
  var m=st.missions[k];
  o+='<div class="ms '+(m||'')+(k===c&&!over()?' cur':'')+'"><div class="num">Missão '+(k+1)+'</div><div class="ico">'+(m==='s'?'✔':m==='f'?'✖':'')+'</div><div class="ppl">'+SIZES[k]+' pessoas</div></div>';
 }
 o+='</div><div class="score"><div class="a">'+count('s')+'<small>Resistência</small></div><div>×</div><div class="b">'+count('f')+'<small>Espiões</small></div></div>';
 o+='<div class="ref"><div class="lbl">Equipes recusadas em sequência ('+st.refusals+' de '+MAX_REF+')</div><div class="rd">';
 for(var r=0;r<MAX_REF;r++)o+='<div class="rdot'+(r<st.refusals?' on':'')+'">'+(r<st.refusals?'✖':'')+'</div>';
 return o+'</div></div>';
}
function render(){
 if(st.step==='board'){
  if(over()){
   var win=resistanceWon();
   var why=spiesWinByRefusal()?'5 equipes recusadas':(win?'3 missões com sucesso':'3 missões falharam');
   h(boardHtml()+'<div class="res '+(win?'s':'f')+'"><div class="big">'+(win?'A RESISTÊNCIA VENCEU':'OS ESPIÕES VENCERAM')+'</div><p style="color:#fff">'+why+'</p></div>'+
    '<div class="row2"><button class="btn alt" id="undo">Desfazer última</button><button class="btn" id="nw" style="padding:14px;font-size:1rem">Novo jogo</button></div>');
   $('nw').onclick=function(){reset();render()};
   $('undo').onclick=function(){
    if(spiesWinByRefusal()){st.refusals=MAX_REF-1}
    else{var k=cur()===-1?4:cur()-1;if(k>=0)st.missions[k]=null}
    save();render();
   };
   return;
  }
  var c=cur();
  h('<h1>🗳️ Resistance</h1>'+boardHtml()+
   '<button class="btn" id="go">Votar na missão '+(c+1)+' ('+SIZES[c]+' pessoas)</button>'+
   '<div class="row2"><button class="btn alt" id="rf">Equipe recusada (+1)</button><button class="btn alt sm" id="rm"'+(st.refusals===0?' disabled':'')+'>−1</button></div>'+
   '<div class="row2"><button class="btn alt" id="undo"'+(c===0?' disabled':'')+'>Desfazer missão</button><button class="btn alt" id="rs">'+(st.arm?'Toque de novo':'Reiniciar jogo')+'</button></div>');
  $('go').onclick=function(){st.i=0;st.votes=[];st.arm=false;st.step='pass';render()};
  $('rf').onclick=function(){st.refusals++;st.arm=false;save();render()};
  $('rm').onclick=function(){if(st.refusals>0){st.refusals--;save();render()}};
  $('undo').onclick=function(){var k=cur()===-1?4:cur()-1;if(k>=0){st.missions[k]=null;save();st.arm=false;render()}};
  $('rs').onclick=function(){if(st.arm){reset()}else st.arm=true;render()};
 }
 else if(st.step==='pass'){
  var dots='';for(var k=0;k<total();k++)dots+='<div class="dot'+(k<st.i?' on':'')+'"></div>';
  h('<div class="dots">'+dots+'</div><p>Missão '+(cur()+1)+' · Voto '+(st.i+1)+' de '+total()+'</p><h2>Passe o celular para o próximo jogador</h2><p>Só toque quando estiver com o aparelho e ninguém estiver olhando.</p><button class="btn" id="show">Sou eu, mostrar opções</button>');
  $('show').onclick=function(){st.sel=null;st.step='vote';render()};
 }
 else if(st.step==='vote'){
  h('<h2>Seu voto é secreto</h2><div class="votes"><button class="vote s'+(st.sel==='s'?' sel':'')+'" id="vs">✔<br>Sucesso</button><button class="vote f'+(st.sel==='f'?' sel':'')+'" id="vf">✖<br>Falha</button></div>'+
   '<button class="btn" id="ok"'+(st.sel?'':' disabled')+'>Confirmar voto</button>');
  $('vs').onclick=function(){st.sel='s';render()};
  $('vf').onclick=function(){st.sel='f';render()};
  $('ok').onclick=function(){
   if(!st.sel)return;
   st.votes.push(st.sel);st.sel=null;st.i++;
   if(navigator.vibrate)try{navigator.vibrate(40)}catch(e){}
   st.step=st.i>=total()?'ready':'pass';render();
  };
 }
 else if(st.step==='ready'){
  h('<h1>✅ Todos votaram</h1><p>Quando o grupo estiver pronto, revele o resultado.</p><button class="btn" id="rv">Revelar resultado</button>');
  $('rv').onclick=function(){
   var fails=st.votes.filter(function(v){return v==='f'}).length;
   st.last={ok:fails<1,fails:fails,cards:st.votes.slice().sort(function(){return Math.random()-.5}),n:cur()+1};
   st.missions[cur()]=st.last.ok?'s':'f';
   st.refusals=0;
   save();st.step='result';render();
  };
 }
 else if(st.step==='result'){
  var r=st.last;
  var cards=r.cards.map(function(v){return '<div class="card '+v+'">'+(v==='s'?'✔':'✖')+'</div>'}).join('');
  h('<p>Missão '+r.n+'</p><div class="res '+(r.ok?'s':'f')+'"><div class="big">'+(r.ok?'SUCESSO':'FALHA')+'</div><p style="color:#fff">'+r.fails+(r.fails===1?' voto de falha':' votos de falha')+'</p></div>'+
   '<div class="cards">'+cards+'</div><p>As cartas foram embaralhadas para não revelar a ordem.</p>'+
   '<button class="btn" id="bk">'+(over()?'Ver resultado final':'Voltar ao placar')+'</button>');
  $('bk').onclick=function(){st.step='board';render()};
 }
}
render();
})();
