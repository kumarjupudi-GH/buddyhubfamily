import { describe, expect, it } from "vitest";
import { feedbackSchema, averageRating, csvCell } from "@/lib/feedback";
const input = { batch:"11111111-1111-4111-8111-111111111111",name:"",email:"",wants_response:false,entries:[{id:"22222222-2222-4222-8222-222222222222",app_id:"homework",category:"General Feedback",ratings:{overall:5,ai_quality:4},description:"Clear explanation",helpful:null}] };
describe("Feedback rules",()=>{
  it("captures multiple feedback entries in one submission",()=>{expect(feedbackSchema.parse({...input,entries:[...input.entries,{...input.entries[0],id:"33333333-3333-4333-8333-333333333333",app_id:"art"}]}).entries).toHaveLength(2);});
  it("accepts ratings 1–5 and rejects 6",()=>{expect(feedbackSchema.safeParse({...input,entries:[{...input.entries[0],ratings:{overall:1}}]}).success).toBe(true);expect(feedbackSchema.safeParse({...input,entries:[{...input.entries[0],ratings:{overall:6}}]}).success).toBe(false);});
  it("requires an overall rating on full feedback",()=>{expect(feedbackSchema.safeParse({...input,entries:[{...input.entries[0],ratings:{}}]}).success).toBe(false);});
  it("accepts helpful-only feedback without stars",()=>{expect(feedbackSchema.safeParse({...input,entries:[{...input.entries[0],ratings:{},helpful:true}]}).success).toBe(true);});
  it("requires email when support response is requested",()=>{expect(feedbackSchema.safeParse({...input,wants_response:true}).success).toBe(false);});
  it("rejects unknown BuddyApps",()=>{expect(feedbackSchema.safeParse({...input,entries:[{...input.entries[0],app_id:"not-an-app"}]}).success).toBe(false);});
  it("restricts screenshots to their submission and entry",()=>{expect(feedbackSchema.safeParse({...input,entries:[{...input.entries[0],screenshot_path:"another-user/private.png"}]}).success).toBe(false);});
  it("excludes unrated KPIs from averages",()=>{expect(averageRating([{ratings:{overall:5}},{ratings:{}},{ratings:{overall:1}}],"overall")).toBe(3);});
  it("neutralizes CSV formulas",()=>{expect(csvCell("=1+1")).toBe('"\'=1+1"');});
});