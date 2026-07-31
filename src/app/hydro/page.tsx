import { redirect } from "next/navigation";

/** 旧链接统一进智慧水利入口（态势 Tab） */
export default function HydroPage() {
  redirect("/hydrobench?tab=info");
}
