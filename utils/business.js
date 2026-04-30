class Statistic{constructor(t,{ignoreZero:e=!0}={}){this.data=t.map(Number).filter(t=>!isNaN(t)&&(!e||0!==t)),this._sorted=null,this._min=this._max=this._secondMin=this._secondMax=this._median=this._mean=this._trimmed=this._weighted=null}_getSorted(){return null===this._sorted&&(this._sorted=[...this.data].sort((t,e)=>t-e)),this._sorted}min(){return null===this._min&&(this._min=Math.min(...this.data)),this._min}max(){return null===this._max&&(this._max=Math.max(...this.data)),this._max}second_min(){if(null===this._secondMin){const t=this._getSorted();for(let e=1;e<t.length;e++)if(t[e]>t[0])return this._secondMin=t[e];this._secondMin=null}return this._secondMin}second_max(){if(null===this._secondMax){const t=this._getSorted();for(let e=t.length-2;e>=0;e--)if(t[e]<t[t.length-1])return this._secondMax=t[e];this._secondMax=null}return this._secondMax}median(){if(null===this._median){const t=this._getSorted(),e=Math.floor(t.length/2);this._median=t.length%2==0?(t[e-1]+t[e])/2:t[e]}return this._median}average(){return null===this._mean&&(this._mean=this.data.reduce((t,e)=>t+e,0)/this.data.length),this._mean}trimmed_average(t=1){if(null===this._trimmed){const e=this.data.length;if(e<=2*t)return this._trimmed=this.average();const s=this._getSorted().slice(t,e-t);this._trimmed=s.reduce((t,e)=>t+e,0)/s.length}return this._trimmed}weighted_average(){if(null===this._weighted){const t=this.data.length,e=Array.from({length:t},(e,s)=>{const i=t-1-s;return 1-i/(1+i)}),s=e.reduce((t,e)=>t+e,0),i=e.map(t=>t/s);this._weighted=this.data.reduce((t,e,s)=>t+e*i[s],0)}return this._weighted}}

// ================= BUSINESS =================
class Business {
  constructor(data) {
    this.code  = data._id;
    this.bvps = toNumber(data.bvps);
    this.pb = new Statistic(data.pb);
  }
}

