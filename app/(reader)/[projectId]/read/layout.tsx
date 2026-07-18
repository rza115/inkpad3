import { notFound, redirect } from "next/navigation";
import {
  Merriweather,
  Lora,
  Source_Sans_3,
  Atkinson_Hyperlegible,
} from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/actions/projects";

// Font khusus reader — di-load scoped di layout ini (bukan root layout) biar
// tidak menambah bundle di luar reader mode. Georgia web-safe, tanpa next/font.
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  style: ["normal", "italic"],
});
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
});
const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
});
// Atkinson Hyperlegible = static font, wajib weight eksplisit
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

// Layout reader mode: guard sama seperti shell, tapi TANPA Topbar/Sidebar —
// reader full-screen imersif, chrome-nya cuma ReaderToolbar milik komponen.
export default async function ReadLayout({
  children,
  params,
}: LayoutProps<"/[projectId]/read">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  return (
    <div
      className={`${merriweather.variable} ${lora.variable} ${sourceSans.variable} ${atkinson.variable} min-h-dvh`}
    >
      {children}
    </div>
  );
}
