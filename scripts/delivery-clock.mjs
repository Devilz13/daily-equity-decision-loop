import {localInstant} from './market-sessions.mjs';
export const hour=3600000;
export const singapore='Asia/Singapore';
export const anchors={
  asia:{open:['Asia/Tokyo','09:00'],close:['Asia/Kolkata','15:30']},
  singapore:{open:[singapore,'09:00'],close:[singapore,'17:16']},
  europe:{open:['Europe/London','08:00'],close:['Europe/London','16:30']},
  us:{open:['America/New_York','09:30'],close:['America/New_York','16:00']}
};

export function deliveryClock(market,date,kind,exception){
  if(market==='evening'){
    const target=+localInstant(date,'19:00',singapore);
    return {target,earliestEvidence:target-hour,deadline:target+hour};
  }
  const [zone,time]=anchors[market][kind];
  const cash=exception?Date.parse(exception):+localInstant(date,time,zone);
  const opening=kind==='open';
  const target=cash+(opening?-hour:hour);
  return {cash,target,earliestEvidence:opening?target-hour:cash,deadline:opening?cash:target+hour};
}
