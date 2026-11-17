export function tickers(input) {
  const list = [...new Set(input.trim().toUpperCase().split(/[,\s]+/))];
  if (list.length > 10 || list.some(t => !/^[A-Z0-9^][A-Z0-9.^=-]{0,23}$/.test(t)))
    throw Error("Enter 1–10 valid tickers separated by commas or spaces.");
  return list.join(",");
}
export function payoff(strategy, strike, upper, debit, multiplier, minimum, maximum) {
  if (![strike,debit,multiplier,minimum,maximum].every(Number.isFinite) || strike<=0 || debit<0 ||
    !Number.isInteger(multiplier) || multiplier<1 || minimum<0 || maximum<=minimum)
    throw Error("Enter a positive strike and whole contract multiplier, and an increasing price range.");
  const spread = ["Bull call spread","Bear put spread"].includes(strategy);
  if (spread && (!Number.isFinite(upper) || upper<=strike || debit>upper-strike))
    throw Error("A spread needs a higher upper strike and a debit at most the strike difference.");
  const cases = {
    "Long call": x=>Math.max(0,x-strike),
    "Long put": x=>Math.max(0,strike-x),
    "Bull call spread": x=>Math.max(0,x-strike)-Math.max(0,x-upper),
    "Bear put spread": x=>Math.max(0,upper-x)-Math.max(0,strike-x)
  };
  if (!Object.hasOwn(cases,strategy)) throw Error("Unsupported strategy.");
  return Array.from({length:21},(_,i)=>{
    const x=minimum+(maximum-minimum)*(i/20), y=(cases[strategy](x)-debit)*multiplier;
    if (!Number.isFinite(y)) throw Error("Use smaller prices and multiplier.");
    return [x,y];
  });
}
export function parseSnapshot(raw) {
  const data=JSON.parse(raw);
  if (!Array.isArray(data) || !data.length || data.length>10 || data.some(row=>!row ||
    typeof row.ticker!=="string" || !/^[A-Z0-9^][A-Z0-9.^=-]{0,23}$/.test(row.ticker) ||
    typeof row.retrieved_utc!=="string" || !row.fundamentals ||
    typeof row.fundamentals!=="object" || Array.isArray(row.fundamentals)))
    throw Error("Expected a snapshot.json from the equity-research workflow.");
  return data;
}
