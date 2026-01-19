import{a3 as o}from"./index-CT9F3akh.js";import{as as r}from"./TextArea-Dl3y1VrD.js";const c=new o("antFadeIn",{"0%":{opacity:0},"100%":{opacity:1}}),s=new o("antFadeOut",{"0%":{opacity:1},"100%":{opacity:0}}),f=(i,t=!1)=>{const{antCls:e}=i,n=`${e}-fade`,a=t?"&":"";return[r(n,c,s,i.motionDurationMid,t),{[`
        ${a}${n}-enter,
        ${a}${n}-appear
      `]:{opacity:0,animationTimingFunction:"linear"},[`${a}${n}-leave`]:{animationTimingFunction:"linear"}}]};export{f as i};
