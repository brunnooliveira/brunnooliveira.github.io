(this["webpackJsonptrading-helper"]=this["webpackJsonptrading-helper"]||[]).push([[0],{27:function(e,t,n){e.exports=n(38)},32:function(e,t,n){},33:function(e,t,n){},38:function(e,t,n){"use strict";n.r(t);var a=n(0),r=n.n(a),c=n(10),i=n.n(c),o=(n(32),n(55)),l=(n(33),n(18)),m=n(57),u=n(56);var s=function(){var e=Object(a.useState)("15"),t=Object(l.a)(e,2),n=t[0],c=t[1],i=Object(a.useState)("1"),s=Object(l.a)(i,2),p=s[0],g=s[1],h=Object(a.useState)((new Date).toDateString()),E=Object(l.a)(h,2),d=E[0],f=E[1],v=function(){if("granted"!==Notification.permission)Notification.requestPermission();else{var e=new Date,t=new Intl.DateTimeFormat("pt-br",{hour:"numeric",minute:"numeric",second:"numeric"}).format(e);f(t),new Notification("Fechando barra!",{icon:"clock.png",body:t}).onclick=function(){window.open("http://stackoverflow.com/a/13328397/1269037")}}};return r.a.createElement("section",null,r.a.createElement(o.a,{container:!0,direction:"row",justify:"center",alignItems:"center",spacing:2},r.a.createElement(o.a,{item:!0},r.a.createElement("p",null,"Timeframe")),r.a.createElement(o.a,{item:!0},r.a.createElement(m.a,{value:n,onChange:function(e){c(e.target.value)}})),r.a.createElement(o.a,{item:!0},r.a.createElement("p",null,"Segundos")),r.a.createElement(o.a,{item:!0},r.a.createElement(m.a,{value:p,onChange:function(e){g(e.target.value)}}))),r.a.createElement(o.a,{container:!0,direction:"row",justify:"center",alignItems:"center",spacing:2},r.a.createElement(o.a,{item:!0},r.a.createElement(u.a,{variant:"contained",onClick:function e(){var t=new Date;console.log(t);var a=[],r=t.getMinutes().toString();"60"===n?a.push("59"):"15"===n?(a.push("14"),a.push("29"),a.push("44"),a.push("59")):"5"===n&&(a.push("4"),a.push("9"),r=r.length>1?r.substring(1):r),a.indexOf(r)>=0&&t.getSeconds().toString()===p&&v(),setTimeout((function(){return e()}),1e3)},color:"primary"},"Start")),r.a.createElement(o.a,{item:!0},r.a.createElement(u.a,{variant:"contained",onClick:v},"Teste"))),r.a.createElement("p",null,d))};var p=function(){return r.a.createElement("div",{className:"App"},r.a.createElement("header",{className:"App-header"},r.a.createElement("p",null,"THelp")),r.a.createElement(o.a,{container:!0,direction:"column",justify:"center",alignItems:"center",spacing:2},r.a.createElement(o.a,{item:!0},r.a.createElement(s,null)),r.a.createElement(o.a,{item:!0},r.a.createElement("p",null," Calculo Lote "))))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));i.a.render(r.a.createElement(r.a.StrictMode,null,r.a.createElement(p,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[27,1,2]]]);
//# sourceMappingURL=main.8da738f9.chunk.js.map